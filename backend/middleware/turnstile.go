package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
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
}

// TurnstileConfig holds configuration for Turnstile verification
type TurnstileConfig struct {
	SecretKey         string
	Enabled           bool
	Timeout           time.Duration
	ExpectedHostnames []string
}

// VerifyTurnstile is a middleware that validates Cloudflare Turnstile tokens
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
				http.Error(w, "Missing verification token", http.StatusUnauthorized)
				return
			}

			// Get client IP
			remoteIP := getClientIP(r)

			// Verify token with Cloudflare
			isValid, resp, err := verifyToken(token, remoteIP, config)
			if err != nil {
				log.Printf(" Turnstile verification error: %v\n", err)
				http.Error(w, "Verification service unavailable", http.StatusServiceUnavailable)
				return
			}

			if !isValid {
				log.Printf(" Turnstile verification failed: %v\n", resp.ErrorCodes)
				http.Error(w, fmt.Sprintf("Verification failed: %v", resp.ErrorCodes), http.StatusUnauthorized)
				return
			}

			// Validate hostname if configured
			if len(config.ExpectedHostnames) > 0 {
				hostnameValid := false
				for _, expectedHost := range config.ExpectedHostnames {
					if resp.Hostname == expectedHost {
						hostnameValid = true
						break
					}
				}

				if !hostnameValid {
					log.Printf(" Hostname mismatch: expected %v, got %s\n", config.ExpectedHostnames, resp.Hostname)
					http.Error(w, "Invalid request origin", http.StatusUnauthorized)
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
		SecretKey: os.Getenv("TURNSTILE_SECRET_KEY"),
		Enabled:   os.Getenv("ENABLE_TURNSTILE_VERIFICATION") == "true",
		Timeout:   10 * time.Second,
		ExpectedHostnames: []string{
			"ballerina-online-playground.pages.dev",
			"pramithamj.github.io",
			"localhost",
		},
	}
}
