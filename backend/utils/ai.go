package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAI API structures
type OpenAIRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Gemini API structures
type GeminiRequest struct {
	Contents          []GeminiContent          `json:"contents"`
	GenerationConfig  GeminiGenerationConfig   `json:"generationConfig"`
	SystemInstruction *GeminiSystemInstruction `json:"systemInstruction,omitempty"`
}

type GeminiContent struct {
	Role  string       `json:"role"`
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiGenerationConfig struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
}

type GeminiSystemInstruction struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []GeminiPart `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// ProcessAIRequest sends request to AI provider (OpenAI or Gemini) and processes response
func ProcessAIRequest(
	userMessage string,
	code string,
	version string,
	context map[string]interface{},
	history []map[string]string,
) (string, string, error) {
	// Determine which provider to use
	provider := os.Getenv("AI_PROVIDER")
	if provider == "" {
		provider = "auto" // Auto-detect based on available API keys
	}

	// Build system prompt with Ballerina context
	systemPrompt := buildBallerinaSystemPrompt(version)

	// Build messages array
	messages := []Message{
		{Role: "system", Content: systemPrompt},
	}

	// Add conversation history (last 5 messages for context)
	historyLimit := 5
	if len(history) > historyLimit {
		history = history[len(history)-historyLimit:]
	}

	for _, msg := range history {
		messages = append(messages, Message{
			Role:    msg["role"],
			Content: msg["content"],
		})
	}

	// Add current user message with code context
	userContent := buildUserPrompt(userMessage, code, context)
	messages = append(messages, Message{
		Role:    "user",
		Content: userContent,
	})

	// Try providers in order
	var response string
	var suggestedCode string
	var err error

	switch provider {
	case "openai":
		response, suggestedCode, err = callOpenAI(messages)
	case "gemini":
		response, suggestedCode, err = callGemini(messages)
	case "auto":
		// Try Gemini first (free tier), fallback to OpenAI
		if os.Getenv("GEMINI_API_KEY") != "" {
			response, suggestedCode, err = callGemini(messages)
			if err != nil {
				log.Printf("Gemini failed, trying OpenAI: %v", err)
				if os.Getenv("OPENAI_API_KEY") != "" {
					response, suggestedCode, err = callOpenAI(messages)
				}
			}
		} else if os.Getenv("OPENAI_API_KEY") != "" {
			response, suggestedCode, err = callOpenAI(messages)
		} else {
			err = fmt.Errorf("no AI API key configured")
		}
	default:
		err = fmt.Errorf("unknown AI provider: %s", provider)
	}

	return response, suggestedCode, err
}

// callOpenAI calls the OpenAI API
func callOpenAI(messages []Message) (string, string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", "", fmt.Errorf("OpenAI API key not configured")
	}

	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = "gpt-4o-mini" // Use more cost-effective model
	}

	temperature := 0.7
	maxTokens := 2000

	reqBody := OpenAIRequest{
		Model:       model,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequest(
		"POST",
		"https://api.openai.com/v1/chat/completions",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to read response: %v", err)
	}

	var openaiResp OpenAIResponse
	if err := json.Unmarshal(body, &openaiResp); err != nil {
		return "", "", fmt.Errorf("failed to unmarshal response: %v", err)
	}

	// Check for API errors
	if openaiResp.Error != nil {
		return "", "", fmt.Errorf("OpenAI API error: %s", openaiResp.Error.Message)
	}

	if len(openaiResp.Choices) == 0 {
		return "", "", fmt.Errorf("no response from OpenAI")
	}

	aiResponse := openaiResp.Choices[0].Message.Content

	// Extract code suggestions if present
	suggestedCode := extractCodeFromResponse(aiResponse)

	return aiResponse, suggestedCode, nil
}

// callGemini calls the Google Gemini API
func callGemini(messages []Message) (string, string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", "", fmt.Errorf("gemini API key not configured")
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-1.5-flash" // Free tier model
	}

	// Convert messages to Gemini format
	var contents []GeminiContent
	var systemInstruction *GeminiSystemInstruction

	for _, msg := range messages {
		if msg.Role == "system" {
			// System messages go in systemInstruction
			systemInstruction = &GeminiSystemInstruction{
				Parts: []GeminiPart{{Text: msg.Content}},
			}
		} else {
			// Convert role: OpenAI uses "assistant", Gemini uses "model"
			role := msg.Role
			if role == "assistant" {
				role = "model"
			}
			contents = append(contents, GeminiContent{
				Role:  role,
				Parts: []GeminiPart{{Text: msg.Content}},
			})
		}
	}

	reqBody := GeminiRequest{
		Contents: contents,
		GenerationConfig: GeminiGenerationConfig{
			Temperature:     0.7,
			MaxOutputTokens: 2000,
		},
		SystemInstruction: systemInstruction,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal request: %v", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to read response: %v", err)
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", "", fmt.Errorf("failed to unmarshal response: %v", err)
	}

	// Check for API errors
	if geminiResp.Error != nil {
		return "", "", fmt.Errorf("gemini API error: %s", geminiResp.Error.Message)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", "", fmt.Errorf("no response from Gemini")
	}

	aiResponse := geminiResp.Candidates[0].Content.Parts[0].Text

	// Extract code suggestions if present
	suggestedCode := extractCodeFromResponse(aiResponse)

	return aiResponse, suggestedCode, nil
}

// buildBallerinaSystemPrompt creates a specialized system prompt
func buildBallerinaSystemPrompt(version string) string {
	return fmt.Sprintf(`You are an expert Ballerina programming assistant specialized in helping developers write, debug, and understand Ballerina code.

Current Ballerina Version: %s

Your capabilities:
1. Explain Ballerina code concepts and syntax
2. Suggest code improvements and best practices
3. Debug and fix errors in Ballerina code
4. Provide code examples and snippets
5. Answer questions about Ballerina features
6. Help with Ballerina standard library usage

When providing code:
- Use proper Ballerina syntax for version %s
- Include necessary imports
- Follow Ballerina naming conventions (camelCase for variables/functions)
- Add helpful comments for clarity
- Ensure code is production-ready and follows best practices

When explaining:
- Be clear, concise, and accurate
- Use examples to illustrate concepts
- Reference official Ballerina documentation when relevant
- Explain the "why" not just the "how"

Always be helpful, professional, and provide actionable advice.`, version, version)
}

// buildUserPrompt constructs the user prompt with context
func buildUserPrompt(message string, code string, context map[string]interface{}) string {
	prompt := message

	// Handle specific action contexts
	if action, ok := context["action"]; ok {
		switch action {
		case "explain":
			if code != "" {
				prompt = "Please explain this Ballerina code in detail:\n\n```ballerina\n" + code + "\n```"
			}
		case "fix":
			if code != "" {
				prompt = "Please analyze this Ballerina code and help me fix any errors or issues:\n\n```ballerina\n" + code + "\n```"
			}
		case "optimize":
			if code != "" {
				prompt = "How can I optimize and improve this Ballerina code?\n\n```ballerina\n" + code + "\n```"
			}
		case "help":
			prompt = "I need help with Ballerina programming. " + message
		}
	} else if code != "" && !strings.Contains(message, "```") {
		// If code exists but not already in message, append it
		prompt += "\n\nCurrent code context:\n```ballerina\n" + code + "\n```"
	}

	return prompt
}

// extractCodeFromResponse extracts code blocks from AI response
func extractCodeFromResponse(response string) string {
	// Look for code between ```ballerina and ```
	markers := []string{"```ballerina\n", "```bal\n", "```\n"}

	for _, marker := range markers {
		start := strings.Index(response, marker)
		if start != -1 {
			start += len(marker)
			end := strings.Index(response[start:], "```")
			if end != -1 {
				code := response[start : start+end]
				return strings.TrimSpace(code)
			}
		}
	}

	return ""
}

// ExplainCode provides detailed explanation of Ballerina code
func ExplainCode(code string, version string) (string, string, error) {
	return ProcessAIRequest(
		"Explain this code",
		code,
		version,
		map[string]interface{}{"action": "explain"},
		[]map[string]string{},
	)
}

// FixCode analyzes and suggests fixes for code errors
func FixCode(code string, errorMsg string, version string) (string, string, error) {
	message := "Fix this code"
	if errorMsg != "" {
		message = fmt.Sprintf("Fix this error: %s", errorMsg)
	}

	return ProcessAIRequest(
		message,
		code,
		version,
		map[string]interface{}{"action": "fix"},
		[]map[string]string{},
	)
}

// SuggestCode provides code suggestions based on context
func SuggestCode(prompt string, code string, version string) (string, string, error) {
	return ProcessAIRequest(
		prompt,
		code,
		version,
		map[string]interface{}{"action": "suggest"},
		[]map[string]string{},
	)
}
