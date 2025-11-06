# AI Copilot Setup Guide

This guide will help you set up the AI Copilot feature for the Ballerina Online Playground with support for both Google Gemini and OpenAI.

## 🎯 Overview

The AI Copilot feature provides:
- **Intelligent code assistance** for Ballerina programming
- **Code explanation** and documentation
- **Error detection and fixing**
- **Code optimization suggestions**
- **Interactive chat** for Ballerina questions

## 🔑 Supported AI Providers

### 1. Google Gemini (Recommended - FREE Tier)

**Why Gemini?**
- ✅ Free tier available (60 requests/minute)
- ✅ High-quality responses
- ✅ Fast response times
- ✅ Good understanding of programming concepts

**Get Your API Key:**
1. Visit: https://aistudio.google.com/api-keys
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

**Models Available:**
- `gemini-1.5-flash` - Fast, efficient (Free tier)
- `gemini-1.5-pro` - Higher quality, slower (Paid)

### 2. OpenAI (Alternative - Paid)

**Why OpenAI?**
- ✅ Very high quality responses
- ✅ Well-documented API
- ⚠️ Requires payment (no free tier)
- ⚠️ Higher cost per request

**Get Your API Key:**
1. Visit: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

**Models Available:**
- `gpt-4o-mini` - Fast, cost-effective ($0.15/$0.60 per 1M tokens)
- `gpt-4o` - Highest quality ($2.50/$10 per 1M tokens)
- `gpt-4` - Previous generation ($30/$60 per 1M tokens)

## ⚙️ Configuration

### Backend Configuration

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Edit `.env` file:**
   ```bash
   nano .env
   ```

3. **Configure your preferred provider:**

   **Option A: Gemini Only (Free)**
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```

   **Option B: OpenAI Only (Paid)**
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your_openai_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

   **Option C: Auto with Fallback (Recommended)**
   ```env
   AI_PROVIDER=auto
   
   # Primary: Gemini (Free)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   
   # Fallback: OpenAI (Paid)
   OPENAI_API_KEY=sk-your_openai_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

   With `auto` mode, the system will:
   1. Try Gemini first (if API key is configured)
   2. Fallback to OpenAI if Gemini fails
   3. This ensures maximum uptime while minimizing costs

4. **Additional AI Settings:**
   ```env
   AI_MAX_TOKENS=2000        # Maximum response length
   AI_TEMPERATURE=0.7        # Creativity (0.0-1.0)
   ```

### Frontend Configuration

The frontend automatically uses the backend's AI configuration. No additional setup needed!

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
go mod tidy
```

**Frontend:**
```bash
cd frontend-vite
npm install
```

### 2. Start Services

**Backend:**
```bash
cd backend
go run main.go
```

**Frontend:**
```bash
cd frontend-vite
npm run dev
```

### 3. Test AI Features

1. Open the playground in your browser
2. Click the **✨ AI** button in the header
3. Try these commands:
   - "Explain this code" - Get explanations
   - "Fix errors" - Detect and fix issues
   - "How do I..." - Ask Ballerina questions

## 🎨 Features

### 1. AI Chat Panel

Interactive chat interface with:
- **Quick Actions**: Explain, Fix, Optimize, Help buttons
- **Code Context**: AI understands your current code
- **Conversation History**: Maintains context across messages
- **Code Suggestions**: Insert AI-generated code directly

### 2. Smart Code Assistance

- **Explain Code**: Get detailed explanations of Ballerina syntax
- **Fix Errors**: Automatically detect and suggest fixes
- **Code Optimization**: Improve performance and readability
- **Best Practices**: Learn Ballerina conventions

### 3. Ballerina-Specific Knowledge

The AI is specialized for Ballerina with:
- Knowledge of Ballerina syntax and features
- Understanding of Ballerina standard library
- Version-specific advice
- Best practices and patterns

## 💰 Cost Estimation

### Gemini (Free Tier)
- **Rate Limit**: 60 requests/minute
- **Cost**: FREE
- **Monthly**: Unlimited (with rate limits)

### OpenAI Pricing
- **GPT-4o-mini**: ~$0.01 per 10 requests
- **Monthly (1000 users, 10 queries each)**:
  - 10,000 queries × $0.001 = **~$10/month**

### Recommended Setup
```env
AI_PROVIDER=auto
GEMINI_API_KEY=your_key    # Use Gemini (free)
OPENAI_API_KEY=your_key    # Fallback only if needed
```

This minimizes costs while ensuring high availability.

## 🔒 Security Best Practices

### 1. API Key Protection

✅ **DO:**
- Store API keys in `.env` file (never commit!)
- Use environment variables
- Rotate keys regularly
- Monitor usage

❌ **DON'T:**
- Commit API keys to Git
- Share keys publicly
- Use production keys in development
- Hardcode keys in source code

### 2. Rate Limiting

Backend automatically implements rate limiting:
```env
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=1m
```

This prevents abuse and controls costs.

### 3. Input Validation

All code is validated before sending to AI:
- Maximum code size: 50KB
- Maximum line count: 1000 lines
- Sanitized inputs

## 🐛 Troubleshooting

### "AI API key not configured"

**Solution:**
1. Check `.env` file has correct API key
2. Restart backend server
3. Verify API key is valid

### "No response from AI"

**Possible causes:**
- Invalid API key
- Rate limit exceeded
- Network issues
- API service down

**Solutions:**
1. Check API key validity
2. Wait if rate limited
3. Try alternative provider
4. Check backend logs

### "Gemini API error: ..."

**Solutions:**
1. Verify API key from https://aistudio.google.com/api-keys
2. Check rate limits
3. Enable fallback to OpenAI:
   ```env
   AI_PROVIDER=auto
   OPENAI_API_KEY=sk-your-key
   ```

### Rate Limit Issues

**Gemini Free Tier:**
- Limit: 60 requests/minute
- Solution: Implement user-side caching or upgrade to paid

**OpenAI:**
- Depends on your plan
- Solution: Increase tier or optimize queries

## 📊 Monitoring

### Backend Logs

Check logs for AI requests:
```bash
tail -f backend/logs/app.log
```

Look for:
- `AI Chat request` - Incoming requests
- `Gemini failed, trying OpenAI` - Fallback triggered
- `OpenAI API error` / `gemini API error` - Issues

### Usage Tracking

**Gemini:**
- Dashboard: https://aistudio.google.com/
- View quotas and usage

**OpenAI:**
- Dashboard: https://platform.openai.com/usage
- View costs and usage

## 🚀 Advanced Configuration

### Custom System Prompts

Edit `backend/utils/ai.go` - `buildBallerinaSystemPrompt()` to customize AI behavior.

### Custom Models

Use different models:
```env
# Gemini
GEMINI_MODEL=gemini-1.5-pro    # Higher quality

# OpenAI
OPENAI_MODEL=gpt-4o           # Best quality
```

### Temperature Control

Adjust creativity:
```env
AI_TEMPERATURE=0.5    # More focused (recommended for code)
AI_TEMPERATURE=0.7    # Balanced (default)
AI_TEMPERATURE=0.9    # More creative
```

## 📚 Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI Platform](https://platform.openai.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Ballerina Documentation](https://ballerina.io/learn/)

## 🆘 Support

For issues or questions:
1. Check this guide
2. Review backend logs
3. Check API provider status
4. Open a GitHub issue

---

**Ready to start?** Get your [Gemini API key](https://aistudio.google.com/api-keys) now! 🚀
