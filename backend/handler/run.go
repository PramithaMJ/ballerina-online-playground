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

	// Log the execution request
	log.Printf("Executing Ballerina code (%d bytes)", len(req.Code))

	// Save code to a temporary file
	tempFile, err := utils.SaveToTempFile(req.Code, "code.bal")
	if err != nil {
		log.Printf("Error saving temp file: %v", err)
		response := CodeResponse{
			Output: "",
			Error:  "Failed to save code: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}
	defer os.Remove(tempFile) // Cleanup temp file

	// Run code using Docker
	output, execErr := utils.RunInDocker(tempFile, "ballerina/ballerina:latest", "bal", "run", "/home/ballerina/code.bal")

	response := CodeResponse{
		Output: output,
		Error:  "",
	}

	if execErr != nil {
		response.Error = execErr.Error()
		log.Printf("Execution error: %v", execErr)
	} else {
		log.Printf("Execution successful")
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
