package handler

import (
	"ballerina-compiler/ballerina-compiler-backend/utils"
	"encoding/json"
	"net/http"
	"os"
)

func CompileCode(w http.ResponseWriter, r *http.Request) {
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

	// Security validation
	if err := utils.ValidateCode(req.Code); err != nil {
		response := CodeResponse{
			Output: "",
			Error:  "Security validation failed: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Save code to a temporary file
	tempFile, err := utils.SaveToTempFile(req.Code, "code.bal")
	if err != nil {
		http.Error(w, "Failed to save code", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile) // Cleanup temp file

	// Compile code using Docker
	output, execErr := utils.RunInDocker(tempFile, "ballerina/ballerina:2201.10.2", "bal", "build", "/home/ballerina/code.bal")

	// Sanitize output
	sanitizedOutput := utils.SanitizeErrorOutput(output)

	response := CodeResponse{
		Output: sanitizedOutput,
		Error:  "",
	}
	if execErr != nil {
		response.Error = utils.SanitizeErrorOutput(execErr.Error())
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
