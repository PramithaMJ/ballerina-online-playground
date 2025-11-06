package handler

import (
	"ballerina-compiler/ballerina-compiler-backend/utils"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// Simple in-memory cache for code execution results
var (
	resultCache = make(map[string]CodeResponse)
	cacheMutex  sync.RWMutex
	cacheExpiry = make(map[string]time.Time)
)

type CodeRequest struct {
	Code    string `json:"code"`
	Version string `json:"version"` // Ballerina version (e.g., "2201.10.2", "2201.9.0")
}

type CodeResponse struct {
	Output string `json:"output"`
	Error  string `json:"error"`
}

func RunCode(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers immediately for ALL responses
	origin := r.Header.Get("Origin")
	if origin == "" {
		origin = "*"
	}
	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, HEAD")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var req CodeRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate code is not empty
	if strings.TrimSpace(req.Code) == "" {
		response := CodeResponse{
			Output: "",
			Error:  "No code provided. Please write some Ballerina code.",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Generate cache key
	hasher := sha256.New()
	hasher.Write([]byte(req.Code + req.Version))
	cacheKey := hex.EncodeToString(hasher.Sum(nil))

	// Check cache
	cacheMutex.RLock()
	if resp, found := resultCache[cacheKey]; found {
		if time.Now().Before(cacheExpiry[cacheKey]) {
			cacheMutex.RUnlock()
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			json.NewEncoder(w).Encode(resp)
			return
		}
	}
	cacheMutex.RUnlock()

	// Validate and set default version if not provided
	ballerinaVersion := req.Version
	if ballerinaVersion == "" {
		ballerinaVersion = "2201.12.0" // Default version (Latest Stable)
	}

	// Validate version format
	if !utils.IsValidBallerinaVersion(ballerinaVersion) {
		response := CodeResponse{
			Output: "",
			Error:  "Invalid Ballerina version. Please check supported versions at https://hub.docker.com/r/ballerina/ballerina/tags",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Security validation
	if err := utils.ValidateCode(req.Code); err != nil {
		log.Printf("Code validation failed: %v", err)
		response := CodeResponse{
			Output: "",
			Error:  "Security validation failed: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Log the execution request with client IP
	clientIP := r.Header.Get("X-Forwarded-For")
	if clientIP == "" {
		clientIP = r.RemoteAddr
	}
	log.Printf("Executing Ballerina code from IP: %s (%d bytes)", clientIP, len(req.Code))

	// Create a Ballerina package structure
	packageDir, err := utils.CreateBallerinaPackage(req.Code)
	if err != nil {
		log.Printf("Error creating Ballerina package: %v", err)
		response := CodeResponse{
			Output: "",
			Error:  "Failed to create package: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	defer os.RemoveAll(packageDir) // Cleanup temp directory

	// Execute in parallel using goroutine with result channel
	type executionResult struct {
		output string
		err    error
	}

	resultChan := make(chan executionResult, 1)

	// Run execution in background
	go func() {
		output, execErr := utils.RunBallerinaPackageWithContext(r.Context(), packageDir, ballerinaVersion)
		resultChan <- executionResult{output: output, err: execErr}
	}()

	// Wait for result with context timeout
	var execResult executionResult
	select {
	case execResult = <-resultChan:
		// Execution completed
	case <-r.Context().Done():
		// Request cancelled by client
		log.Printf("Request cancelled by client")
		response := CodeResponse{
			Output: "",
			Error:  "Execution cancelled by user",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Sanitize output to remove sensitive information
	sanitizedOutput := utils.SanitizeErrorOutput(execResult.output)

	response := CodeResponse{
		Output: sanitizedOutput,
		Error:  "",
	}

	if execResult.err != nil {
		sanitizedError := utils.SanitizeErrorOutput(execResult.err.Error())
		response.Error = sanitizedError
		log.Printf("Execution error: %v", execResult.err)
	} else {
		log.Printf("Execution successful")
	}

	// Store in cache for 5 minutes
	cacheMutex.Lock()
	resultCache[cacheKey] = response
	cacheExpiry[cacheKey] = time.Now().Add(5 * time.Minute)
	cacheMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("ERROR: Failed to encode response: %v", err)
	}
}
