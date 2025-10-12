package handler

import (
	"ballerina-compiler/ballerina-compiler-backend/utils"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
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

	log.Printf("DEBUG: Set CORS headers with origin: %s", origin)

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

	// Run code using Docker with request context for cancellation support
	output, execErr := utils.RunBallerinaPackageWithContext(r.Context(), packageDir, ballerinaVersion)

	// Sanitize output to remove sensitive information
	sanitizedOutput := utils.SanitizeErrorOutput(output)

	response := CodeResponse{
		Output: sanitizedOutput,
		Error:  "",
	}

	if execErr != nil {
		sanitizedError := utils.SanitizeErrorOutput(execErr.Error())
		response.Error = sanitizedError
		log.Printf("Execution error: %v", execErr)
	} else {
		log.Printf("Execution successful")
	}

	w.Header().Set("Content-Type", "application/json")

	// Log response headers before sending
	log.Printf("DEBUG: Response headers: %v", w.Header())
	log.Printf("DEBUG: Sending response with output length: %d", len(response.Output))

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("ERROR: Failed to encode response: %v", err)
	}
}
