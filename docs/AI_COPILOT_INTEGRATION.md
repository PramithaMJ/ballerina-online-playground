# AI Copilot Integration Guide

## 🎯 Overview

The Ballerina Online Playground now includes an intelligent AI Copilot powered by OpenAI GPT-4. This AI assistant helps developers write, understand, debug, and optimize Ballerina code directly within the playground.

## ✨ Features

### 1. **Interactive Chat Interface**
- Natural language conversations about Ballerina code
- Context-aware responses based on current code
- Conversation history for better context

### 2. **Quick Actions**
- **Explain Code**: Get detailed explanations of your Ballerina code
- **Fix Errors**: Automatic error detection and fix suggestions
- **Optimize**: Code optimization recommendations
- **Help**: General Ballerina programming assistance

### 3. **Code Suggestions**
- AI-generated code snippets
- One-click code insertion into editor
- Syntax-aware suggestions for the selected Ballerina version

### 4. **Smart Context**
- Version-aware responses (uses selected Ballerina version)
- Code context included in queries
- Maintains recent conversation history

## 🚀 Setup

### Backend Configuration

1. **Get OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure Environment Variables**
   
   Edit `backend/.env`:
   ```bash
   # AI Configuration
   OPENAI_API_KEY=sk-your-actual-api-key-here
   AI_MODEL=gpt-4                    # or gpt-3.5-turbo for lower cost
   AI_MAX_TOKENS=2000
   AI_TEMPERATURE=0.7
   ```

3. **Start Backend**
   ```bash
   cd backend
   go run main.go
   ```

### Frontend Configuration

The frontend is already configured and ready to use! The AI toggle button (✨ Sparkles icon) appears in the header.

## 📡 API Endpoints

### 1. **Chat Endpoint**
```
POST /api/ai/chat
```

**Request:**
```json
{
  "message": "How do I create an HTTP service in Ballerina?",
  "code": "import ballerina/http;",
  "version": "2201.12.0",
  "context": {},
  "history": []
}
```

**Response:**
```json
{
  "response": "To create an HTTP service in Ballerina...",
  "suggestedCode": "service / on new http:Listener(8080) { ... }"
}
```

### 2. **Explain Code Endpoint**
```
POST /api/ai/explain
```

**Request:**
```json
{
  "code": "service / on new http:Listener(8080) { ... }",
  "version": "2201.12.0"
}
```

### 3. **Fix Code Endpoint**
```
POST /api/ai/fix
```

**Request:**
```json
{
  "code": "import ballerina/http;",
  "error": "compilation error: unknown module 'http'",
  "version": "2201.12.0"
}
```

### 4. **Suggest Code Endpoint**
```
POST /api/ai/suggest
```

**Request:**
```json
{
  "message": "Create a REST API with GET and POST endpoints",
  "code": "",
  "version": "2201.12.0"
}
```

## 🎨 Usage

### Opening AI Chat Panel

1. Click the **✨ Sparkles** icon in the header
2. The AI chat panel replaces the output panel
3. Click again to toggle back to output panel

### Using Quick Actions

1. **Explain Code**
   - Write some code in the editor
   - Click "💡 Explain Code"
   - AI provides detailed explanation

2. **Fix Errors**
   - When code has errors
   - Click "🔧 Fix Errors"
   - AI analyzes and suggests fixes

3. **Optimize**
   - Click "⚡ Optimize"
   - AI suggests improvements and optimizations

4. **Help**
   - Click "❓ Help"
   - Ask any Ballerina-related questions

### Inserting Suggested Code

When AI provides code suggestions:
1. A code block appears with "📋 Insert Code" button
2. Click the button to insert code into editor
3. Code is appended to existing code (or replaces if empty)

### Chat Interface

1. Type your question in the input box
2. Press **Enter** to send (or **Shift+Enter** for new line)
3. AI responds with helpful information
4. Continue the conversation naturally

## 💡 Tips & Best Practices

### For Best Results

1. **Be Specific**: "Create an HTTP GET endpoint that returns JSON" is better than "Make an API"

2. **Provide Context**: Include relevant code in the editor when asking questions

3. **Use Quick Actions**: They provide optimized prompts for common tasks

4. **Iterate**: Follow up with clarifying questions if needed

5. **Version Awareness**: AI knows which Ballerina version you're using

### Example Queries

- "Explain how async operations work in Ballerina"
- "Show me how to connect to MySQL database"
- "What's wrong with this HTTP client code?"
- "Convert this JSON to a Ballerina record type"
- "How do I handle errors in Ballerina?"
- "Create a gRPC service with two methods"

## 🔒 Security

### API Key Protection

- **Never commit** API keys to version control
- API keys are stored server-side only
- Frontend never sees the actual API key

### Rate Limiting

- AI endpoints have rate limiting
- Prevents abuse and controls costs
- 5 requests per 5 seconds per IP (configurable)

### Input Validation

- User inputs are sanitized
- Code length limits apply
- Malicious prompts are filtered

## 💰 Cost Management

### OpenAI Pricing (as of 2024)

- **GPT-4**: ~$0.03/1K input tokens, ~$0.06/1K output tokens
- **GPT-3.5-Turbo**: ~$0.001/1K input tokens, ~$0.002/1K output tokens

### Estimated Costs

**Average query**: ~500 tokens total = **$0.045** (GPT-4) or **$0.0015** (GPT-3.5)

**Monthly estimates** (1000 users, 10 queries each):
- GPT-4: **$450/month**
- GPT-3.5-Turbo: **$15/month**

### Cost Optimization

1. **Use GPT-3.5-Turbo** for development/testing
   ```bash
   AI_MODEL=gpt-3.5-turbo
   ```

2. **Set Token Limits**
   ```bash
   AI_MAX_TOKENS=1000  # Lower = cheaper
   ```

3. **Implement Caching**: Cache common queries (future enhancement)

4. **Monitor Usage**: Check OpenAI dashboard regularly

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required | `sk-...` |
| `AI_MODEL` | Model to use | `gpt-4` | `gpt-4`, `gpt-3.5-turbo` |
| `AI_MAX_TOKENS` | Max response length | `2000` | 100-4000 |
| `AI_TEMPERATURE` | Creativity (0-1) | `0.7` | 0.0-1.0 |

### Temperature Guide

- **0.0-0.3**: Precise, deterministic (good for code generation)
- **0.4-0.7**: Balanced (recommended for chat)
- **0.8-1.0**: Creative, diverse (for brainstorming)

## 🛠 Troubleshooting

### "OpenAI API key not configured"

**Solution**: Add your API key to `backend/.env`
```bash
OPENAI_API_KEY=sk-your-key-here
```

### "AI request failed"

**Possible causes**:
1. Invalid API key → Check key in OpenAI dashboard
2. Rate limit exceeded → Wait or upgrade OpenAI plan
3. Network issues → Check internet connection
4. API quota exhausted → Add credits to OpenAI account

### "No response from AI"

**Solution**: Check backend logs:
```bash
cd backend
go run main.go
# Look for error messages
```

### AI Gives Incorrect Ballerina Syntax

**Solution**: 
1. Ensure correct version is selected
2. Try being more specific in your query
3. Report issue if persists

## 🚀 Advanced Usage

### Custom Prompts

For advanced users, you can modify system prompts in:
```
backend/utils/ai.go → buildBallerinaSystemPrompt()
```

### Adding New Quick Actions

Edit:
```
frontend-vite/src/components/AIChatPanel.jsx
```

Add to `quickActions` array:
```javascript
{
  icon: '🎯',
  label: 'Custom Action',
  action: 'custom',
  prompt: 'Your custom prompt here',
}
```

### Alternative AI Providers

#### Using Anthropic Claude

```bash
# backend/.env
ANTHROPIC_API_KEY=your-key
AI_PROVIDER=anthropic
```

#### Using Ollama (Self-hosted)

```bash
# backend/.env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
```

## 📊 Monitoring

### Backend Logs

Watch AI requests:
```bash
tail -f backend/logs/app.log | grep "AI Chat"
```

### OpenAI Dashboard

Monitor usage at: [https://platform.openai.com/usage](https://platform.openai.com/usage)

## 🎓 Learning Resources

- [Ballerina Documentation](https://ballerina.io/learn/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)

## 🤝 Contributing

Want to improve the AI integration?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This feature is part of the Ballerina Online Playground project and follows the same license.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/PramithaMJ/ballerina-online-playground/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PramithaMJ/ballerina-online-playground/discussions)
- **Email**: your-email@example.com

---

**Built with ❤️ for the Ballerina Community**
