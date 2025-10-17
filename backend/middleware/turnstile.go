package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

// TurnstileResponse represents the response from Cloudflare's siteverify API
type TurnstileResponse struct {
	Success     bool     `json:"success"`
	ChallengeTS string   `json:"challenge_ts"`
	Hostname    string   `json:"hostname"`
	ErrorCodes  []string `json:"error-codes"`
	Action      string   `json:"action"`
	CData       string   `json:"cdata"`
	Metadata    struct {
		EphemeralID string `json:"ephemeral_id"`
	} `json:"metadata"`
}

// TurnstileConfig holds configuration for Turnstile verification
type TurnstileConfig struct {
	SecretKey         string
	Enabled           bool
	Timeout           time.Duration
	ExpectedHostnames []string
	MaxRetries        int
	RetryDelay        time.Duration
}

// Token cache to prevent duplicate validations
type tokenCache struct {
	mu      sync.RWMutex
	tokens  map[string]time.Time
	maxSize int
}

var cache = &tokenCache{
	tokens:  make(map[string]time.Time),
	maxSize: 1000,
}

// Check if token was recently used
func (c *tokenCache) isUsed(token string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	_, exists := c.tokens[token]
	return exists
}

// Mark token as used
func (c *tokenCache) markUsed(token string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Prevent cache from growing too large
	if len(c.tokens) >= c.maxSize {
		// Remove oldest entries
		oldest := time.Now()
		var oldestToken string
		for t, timestamp := range c.tokens {
			if timestamp.Before(oldest) {
				oldest = timestamp
				oldestToken = t
			}
		}
		delete(c.tokens, oldestToken)
	}

	c.tokens[token] = time.Now()
}

// Cleanup expired tokens from cache
func (c *tokenCache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for token, timestamp := range c.tokens {
		// Remove tokens older than 10 minutes
		if now.Sub(timestamp) > 10*time.Minute {
			delete(c.tokens, token)
		}
	}
}

// Start background cleanup
func init() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			cache.cleanup()
		}
	}()
}

// respondWithError sends a JSON error response
func respondWithError(w http.ResponseWriter, statusCode int, message string, details interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	if details != nil {
		response["details"] = details
	}

	json.NewEncoder(w).Encode(response)
}

// handleVerificationFailure processes verification failures with detailed error messages
func handleVerificationFailure(w http.ResponseWriter, resp *TurnstileResponse, token string) {
	errorMsg := "Verification failed"
	statusCode := http.StatusUnauthorized

	if len(resp.ErrorCodes) > 0 {
		switch resp.ErrorCodes[0] {
		case "timeout-or-duplicate":
			errorMsg = "Token expired or already used. Please generate a new token."
		case "invalid-input-response":
			errorMsg = "Invalid verification token. Please refresh the page."
		case "invalid-input-secret":
			errorMsg = "Server configuration error. Please contact administrator."
			log.Printf(" CONFIGURATION ERROR: Invalid Turnstile secret key! Check TURNSTILE_SECRET_KEY environment variable.\n")
		case "bad-request":
			errorMsg = "Invalid request format. Please try again."
			statusCode = http.StatusBadRequest
		case "internal-error":
			errorMsg = "Verification service error. Please try again later."
			statusCode = http.StatusServiceUnavailable
		case "missing-input-response":
			errorMsg = "Missing verification token."
		case "missing-input-secret":
			errorMsg = "Server configuration error. Please contact administrator."
			log.Printf(" CONFIGURATION ERROR: Missing Turnstile secret key!\n")
		default:
			errorMsg = fmt.Sprintf("Verification failed: %v", resp.ErrorCodes[0])
		}
	}

	log.Printf(" Turnstile verification failed: %v (token prefix: %s...)\n", resp.ErrorCodes, token[:min(10, len(token))])
	respondWithError(w, statusCode, errorMsg, map[string]interface{}{
		"error_codes": resp.ErrorCodes,
	})
}

// verifyTokenWithRetry attempts to verify token with retry logic
func verifyTokenWithRetry(token, remoteIP string, config TurnstileConfig) (bool, *TurnstileResponse, error) {
	maxRetries := config.MaxRetries
	if maxRetries <= 0 {
		maxRetries = 3
	}

	retryDelay := config.RetryDelay
	if retryDelay <= 0 {
		retryDelay = time.Second
	}

	var lastErr error
	var lastResp *TurnstileResponse

	for attempt := 1; attempt <= maxRetries; attempt++ {
		isValid, resp, err := verifyToken(token, remoteIP, config)

		// If successful or validation explicitly failed (not a network error), return immediately
		if err == nil {
			return isValid, resp, nil
		}

		lastErr = err
		lastResp = resp

		// If this is the last attempt, return the error
		if attempt == maxRetries {
			break
		}

		// Log retry attempt
		log.Printf(" Verification attempt %d/%d failed: %v. Retrying in %v...\n", attempt, maxRetries, err, retryDelay)

		// Wait before retrying (exponential backoff)
		time.Sleep(retryDelay * time.Duration(attempt))
	}

	return false, lastResp, lastErr
}

// VerifyTurnstile is a middleware that validates Cloudflare Turnstile tokens
// Industry-standard implementation with comprehensive error handling
func VerifyTurnstile(config TurnstileConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip verification for OPTIONS requests (CORS preflight)
			if r.Method == "OPTIONS" {
				next.ServeHTTP(w, r)
				return
			}

			// Skip if Turnstile is disabled
			if !config.Enabled {
				log.Println(" Turnstile verification is disabled")
				next.ServeHTTP(w, r)
				return
			}

			// Skip if no secret key configured (development mode)
			if config.SecretKey == "" {
				log.Println(" No Turnstile secret key configured - skipping verification")
				next.ServeHTTP(w, r)
				return
			}

			// Get token from header
			token := r.Header.Get("CF-Turnstile-Token")
			if token == "" {
				// Fallback: check query parameter
				token = r.URL.Query().Get("cf-turnstile-response")
			}

			if token == "" {
				log.Println(" Missing Turnstile token")
				respondWithError(w, http.StatusUnauthorized, "Missing verification token", nil)
				return
			}

			// Validate token format
			if len(token) > 2048 {
				log.Println(" Token too long")
				respondWithError(w, http.StatusBadRequest, "Invalid token format", nil)
				return
			}

			// Check if token was already used (prevent replay attacks)
			if cache.isUsed(token) {
				log.Printf(" Token already used: %s...\n", token[:min(10, len(token))])
				respondWithError(w, http.StatusUnauthorized, "Token already used. Please generate a new token.", nil)
				return
			}

			// Get client IP
			remoteIP := getClientIP(r)

			// Verify token with Cloudflare (with retry logic)
			isValid, resp, err := verifyTokenWithRetry(token, remoteIP, config)
			if err != nil {
				log.Printf(" Turnstile verification error: %v\n", err)
				respondWithError(w, http.StatusServiceUnavailable, "Verification service unavailable. Please try again.", nil)
				return
			}

			if !isValid {
				handleVerificationFailure(w, resp, token)
				return
			}

			// Mark token as used
			cache.markUsed(token)

			// Validate hostname if configured
			if len(config.ExpectedHostnames) > 0 && resp.Hostname != "" {
				hostnameValid := false
				for _, expectedHost := range config.ExpectedHostnames {
					if resp.Hostname == expectedHost {
						hostnameValid = true
						break
					}
				}

				if !hostnameValid {
					log.Printf(" Hostname mismatch: expected %v, got %s\n", config.ExpectedHostnames, resp.Hostname)
					respondWithError(w, http.StatusUnauthorized, "Invalid request origin", nil)
					return
				}
			}

			// Check token age (warn if older than 4 minutes)
			if resp.ChallengeTS != "" {
				challengeTime, err := time.Parse(time.RFC3339, resp.ChallengeTS)
				if err == nil {
					age := time.Since(challengeTime)
					if age > 4*time.Minute {
						log.Printf(" Token is %.1f minutes old\n", age.Minutes())
					}
					if age > 5*time.Minute {
						log.Printf(" Token expired: %.1f minutes old\n", age.Minutes())
						respondWithError(w, http.StatusUnauthorized, "Token expired. Please generate a new token.", nil)
						return
					}
				}
			}

			log.Printf(" Turnstile verification successful from %s (hostname: %s)\n", remoteIP, resp.Hostname)

			// Verification successful - proceed to next handler
			next.ServeHTTP(w, r)
		})
	}
}

// verifyToken calls Cloudflare's siteverify API
func verifyToken(token, remoteIP string, config TurnstileConfig) (bool, *TurnstileResponse, error) {
	// Prepare request payload
	payload := map[string]string{
		"secret":   config.SecretKey,
		"response": token,
	}

	if remoteIP != "" {
		payload["remoteip"] = remoteIP
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return false, nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: config.Timeout,
	}

	// Make request to Cloudflare
	req, err := http.NewRequest("POST", "https://challenges.cloudflare.com/turnstile/v0/siteverify", bytes.NewBuffer(jsonData))
	if err != nil {
		return false, nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return false, nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Parse response
	var result TurnstileResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return false, nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result.Success, &result, nil
}

// NewTurnstileConfig creates a new TurnstileConfig from environment variables
func NewTurnstileConfig() TurnstileConfig {
	return TurnstileConfig{
		SecretKey:  os.Getenv("TURNSTILE_SECRET_KEY"),
		Enabled:    os.Getenv("ENABLE_TURNSTILE_VERIFICATION") == "true",
		Timeout:    15 * time.Second, // Increased timeout for reliability
		MaxRetries: 3,
		RetryDelay: 1 * time.Second,
		ExpectedHostnames: []string{
			"ballerina-online-playground.pages.dev",
			"pramithamj.github.io",
			"localhost",
			"127.0.0.1",
		},
	}
}
