package handler

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSecurityValidationErrorResponse(t *testing.T) {
	tests := []struct {
		name             string
		code             string
		shouldContain    string
		shouldNotContain string
	}{
		{
			name: "while true infinite loop",
			code: `while true {
    io:println("loop");
}`,
			shouldContain:    "Infinite loop detected",
			shouldNotContain: "Security validation failed:",
		},
		{
			name: "ballerina/regex import",
			code: `import ballerina/regex;
public function main() {}`,
			shouldContain:    "Regex operations are not allowed",
			shouldNotContain: "Security validation failed:",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reqBody := CodeRequest{
				Code:    tt.code,
				Version: "2201.12.0",
			}
			bodyBytes, _ := json.Marshal(reqBody)
			req := httptest.NewRequest("POST", "/run", bytes.NewReader(bodyBytes))
			w := httptest.NewRecorder()

			RunCode(w, req)

			var response CodeResponse
			json.NewDecoder(w.Body).Decode(&response)

			if !strings.Contains(response.Error, "SECURITY_VALIDATION_ERROR:") {
				t.Errorf("Expected error to contain 'SECURITY_VALIDATION_ERROR:', got '%s'", response.Error)
			}

			if !strings.Contains(response.Error, tt.shouldContain) {
				t.Errorf("Expected error to contain '%s', got '%s'", tt.shouldContain, response.Error)
			}

			if strings.Contains(response.Error, tt.shouldNotContain) {
				t.Errorf("Expected error NOT to contain '%s', got '%s'", tt.shouldNotContain, response.Error)
			}
		})
	}
}
