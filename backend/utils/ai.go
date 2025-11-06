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
	Contents         []GeminiContent        `json:"contents"`
	GenerationConfig GeminiGenerationConfig `json:"generationConfig"`
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
		model = "gemini-2.0-flash-exp" // Use the latest flash model
	}

	// Convert messages to Gemini format
	var contents []GeminiContent

	for _, msg := range messages {
		if msg.Role == "system" {
			// For Gemini v1, prepend system message as a user message
			contents = append(contents, GeminiContent{
				Role:  "user",
				Parts: []GeminiPart{{Text: "SYSTEM INSTRUCTIONS: " + msg.Content}},
			})
			// Add a model acknowledgment
			contents = append(contents, GeminiContent{
				Role:  "model",
				Parts: []GeminiPart{{Text: "Understood. I will follow these instructions."}},
			})
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
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal request: %v", err)
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s", model, apiKey)

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
	return fmt.Sprintf(`You are an expert Ballerina programming assistant with deep knowledge of the Ballerina language. You have access to comprehensive Ballerina documentation from https://ballerina.io/learn/by-example/.

Current Ballerina Version: %s

CRITICAL RULES:
- You MUST ONLY provide code suggestions in Ballerina language
- NEVER suggest code in other languages (Java, Python, JavaScript, etc.)
- ALL code examples MUST be valid Ballerina syntax
- If asked about other languages, politely redirect to Ballerina solutions

IMPORTANT BALLERINA KNOWLEDGE:

**Core Concepts:**
- Ballerina is a cloud-native programming language optimized for integration and network services
- Sequence diagrams are generated automatically from code
- Built-in support for JSON, XML, and network protocols
- Data types: int, float, decimal, string, boolean, byte, nil, array, tuple, map, record, table, error, function, future, stream, xml, json
- All variables must be declared with types or use 'var' for type inference

**Documentation Comments (from https://ballerina.io/learn/by-example/documentation/):**
- Use '#' for single-line documentation comments
- Documentation must appear BEFORE the construct being documented
- Format: # Description text
- Can document: modules, functions, objects, records, classes, parameters, return values, fields
- Example:
  # Adds two integers
  # + x - First integer
  # + y - Second integer  
  # + return - Sum of x and y
  function add(int x, int y) returns int {
      return x + y;
  }

**Common Patterns:**
- Functions: function name(params) returns type { }
- Error handling: check expression (propagates errors), error handling with 'on fail'
- Records: type Person record {| string name; int age; |};
- Services: service /path on new http:Listener(9090) { }
- Imports: import ballerina/io; import ballerina/http;
- String templates: string:concat() or string interpolation ${variable}
- Type assertions and conversions: <type>variable or variable.ensureType()

**Standard Library Modules:**
- ballerina/io - Input/output operations (io:println, io:readln)
- ballerina/http - HTTP client/server
- ballerina/sql, ballerina/mysql - Database operations
- ballerina/log - Logging
- ballerina/time - Time operations
- ballerina/regex - Regular expressions
- ballerina/file - File operations

**Best Practices:**
- Always handle errors properly with 'check' or error handling blocks
- Use record types for structured data
- Leverage Ballerina's network abstractions for services
- Write documentation comments for public APIs
- Use type-safe operations

Your capabilities:
1. Explain Ballerina code with examples from official documentation
2. Suggest improvements following Ballerina best practices
3. Debug and fix errors with detailed explanations
4. Provide well-documented Ballerina code snippets ONLY
5. Reference specific Ballerina by-example tutorials
6. Guide on standard library usage
7. Convert problems from other languages to Ballerina solutions

**MANDATORY CODE RULES:**
- ONLY provide code in Ballerina language
- ALWAYS wrap Ballerina code in triple backticks with 'ballerina' language identifier
- Example: `+"```ballerina\n// your code here\n```"+`
- Include proper documentation comments using # syntax
- Add necessary imports (import ballerina/io;)
- Follow naming conventions (camelCase for variables/functions, PascalCase for types)
- Include error handling with 'check' or 'on fail'
- Make code runnable and production-ready
- Add inline comments for complex logic

**Response Format:**
- Provide clear explanations in markdown format
- Use **bold** for important terms
- Use bullet points for lists
- Use code blocks ONLY for Ballerina code examples
- When suggesting ANY code, it MUST be Ballerina wrapped in proper code fence
- Reference ballerina.io documentation links when helpful
- If user asks about non-Ballerina code, explain how to achieve it in Ballerina instead

**Example Response Pattern:**
User asks: "How do I print hello world?"
Your response: "In Ballerina, you can print to the console using io:println():

`+"```ballerina\nimport ballerina/io;\n\npublic function main() {\n    io:println(\"Hello, World!\");\n}\n```"+`

This uses the ballerina/io module for input/output operations."

REMEMBER: You are a Ballerina-ONLY assistant. Never suggest code in other programming languages. Always convert requests to Ballerina solutions.`, version)
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
