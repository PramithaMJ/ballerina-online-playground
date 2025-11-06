package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"ballerina-compiler/ballerina-compiler-backend/utils"
)

// AIChatRequest represents the request structure for AI chat
type AIChatRequest struct {
	Message string                 `json:"message"`
	Code    string                 `json:"code"`
	Version string                 `json:"version"`
	Context map[string]interface{} `json:"context"`
	History []map[string]string    `json:"history"`
}

// AIChatResponse represents the response structure for AI chat
type AIChatResponse struct {
	Response      string `json:"response"`
	SuggestedCode string `json:"suggestedCode,omitempty"`
	Error         string `json:"error,omitempty"`
}

// AIExplainRequest represents the request for code explanation
type AIExplainRequest struct {
	Code    string `json:"code"`
	Version string `json:"version"`
}

// AIFixRequest represents the request for code fixing
type AIFixRequest struct {
	Code    string `json:"code"`
	Error   string `json:"error"`
	Version string `json:"version"`
}

// HandleAIChat processes AI chat requests
func HandleAIChat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding AI chat request: %v", err)
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: "Invalid request body",
		})
		return
	}

	log.Printf("AI Chat request - Message: %s, Version: %s", req.Message, req.Version)

	// Call AI service
	response, suggestedCode, err := utils.ProcessAIRequest(
		req.Message,
		req.Code,
		req.Version,
		req.Context,
		req.History,
	)

	if err != nil {
		log.Printf("Error processing AI request: %v", err)
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(AIChatResponse{
		Response:      response,
		SuggestedCode: suggestedCode,
	})
}

// HandleAIExplain provides code explanation
func HandleAIExplain(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AIExplainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: "Invalid request body",
		})
		return
	}

	log.Printf("AI Explain request - Version: %s", req.Version)

	response, suggestedCode, err := utils.ExplainCode(req.Code, req.Version)
	if err != nil {
		log.Printf("Error explaining code: %v", err)
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(AIChatResponse{
		Response:      response,
		SuggestedCode: suggestedCode,
	})
}

// HandleAIFix helps fix code errors
func HandleAIFix(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AIFixRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: "Invalid request body",
		})
		return
	}

	log.Printf("AI Fix request - Version: %s, Error: %s", req.Version, req.Error)

	response, suggestedCode, err := utils.FixCode(req.Code, req.Error, req.Version)
	if err != nil {
		log.Printf("Error fixing code: %v", err)
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(AIChatResponse{
		Response:      response,
		SuggestedCode: suggestedCode,
	})
}

// HandleAISuggest provides code suggestions
func HandleAISuggest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: "Invalid request body",
		})
		return
	}

	log.Printf("AI Suggest request - Message: %s, Version: %s", req.Message, req.Version)

	response, suggestedCode, err := utils.SuggestCode(req.Message, req.Code, req.Version)
	if err != nil {
		log.Printf("Error suggesting code: %v", err)
		json.NewEncoder(w).Encode(AIChatResponse{
			Error: err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(AIChatResponse{
		Response:      response,
		SuggestedCode: suggestedCode,
	})
}
