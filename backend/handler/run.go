package handler

import (
	"ballerina-compiler/ballerina-compiler-backend/utils"
	"encoding/json"
	"net/http"
	"os"
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

	// Save code to a temporary file
	tempFile, err := utils.SaveToTempFile(req.Code, "code.bal")
	if err != nil {
		http.Error(w, "Failed to save code", http.StatusInternalServerError)
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
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}