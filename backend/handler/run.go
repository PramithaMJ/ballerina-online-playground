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
	Code string `json:"code"`
}

type CodeResponse struct {
	Output string `json:"output"`
	Error  string `json:"error"`
}

func RunCode(w http.ResponseWriter, r *http.Request) {
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
	output, execErr := utils.RunBallerinaPackageWithContext(r.Context(), packageDir)

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
	json.NewEncoder(w).Encode(response)
}
