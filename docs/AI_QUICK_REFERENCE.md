# 🚀 AI Copilot - Quick Reference

## ⚡ Quick Setup (5 minutes)

### 1. Get Free Gemini API Key
```
Visit: https://aistudio.google.com/api-keys
Click: "Create API Key"
Copy: Your new API key
```

### 2. Configure Backend
```bash
# Edit backend/.env
nano backend/.env

# Add these lines:
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend && go run main.go

# Terminal 2: Frontend
cd frontend-vite && npm run dev
```

### 4. Test AI
- Open browser → Click ✨ AI button
- Try: "Explain this code"
- Success! 🎉

---

## 🎯 Provider Comparison

| Feature | Google Gemini | OpenAI |
|---------|---------------|--------|
| **Cost** | ✅ FREE (60 req/min) | ❌ Paid ($0.15-60/1M tokens) |
| **Quality** | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent |
| **Speed** | ⚡ Fast | ⚡ Fast |
| **Setup** | 🟢 Easy | 🟢 Easy |
| **Best For** | Free tier, dev | Production, high quality |

**Recommendation:** Start with Gemini (free), add OpenAI as fallback if needed.

---

## 🔧 Configuration Cheatsheet

### Auto Mode (Recommended)
```env
AI_PROVIDER=auto
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key  # Optional fallback
```
**Behavior:** Tries Gemini first → Falls back to OpenAI if needed

### Gemini Only
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-flash
```

### OpenAI Only
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
```

---

## 💡 AI Features & Commands

### Quick Actions
| Button | What it does |
|--------|-------------|
| 💡 **Explain Code** | Detailed code explanation |
| 🔧 **Fix Errors** | Detect and fix issues |
| ⚡ **Optimize** | Improve performance |
| ❓ **Help** | General Ballerina questions |

### Chat Examples
```
"How do I create an HTTP service in Ballerina?"
"Explain what this function does"
"Convert this to use async operations"
"What's wrong with my code?"
"Show me best practices for error handling"
```

---

## 🐛 Quick Troubleshooting

### Error: "AI API key not configured"
```bash
# Fix: Add API key to .env
echo "GEMINI_API_KEY=your_key_here" >> backend/.env
# Restart backend
```

### Error: "No response from AI"
```bash
# Check API key validity
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"

# Or switch to fallback
AI_PROVIDER=auto  # Enable auto-fallback
```

### Error: Rate limit exceeded
```bash
# Wait 1 minute, or upgrade to paid tier
# Or add OpenAI as fallback
```

---

## 📊 Cost Calculator

### Gemini (Free Tier)
```
Requests: 60/minute = 3,600/hour = 86,400/day
Cost: $0 FREE! 🎉
```

### OpenAI (Paid)
```
GPT-4o-mini:
- Input: $0.15 per 1M tokens (~1500 requests)
- Output: $0.60 per 1M tokens
- Average query cost: ~$0.001

Monthly (10,000 queries): ~$10
```

### Recommended Setup
```env
AI_PROVIDER=auto
GEMINI_API_KEY=xxx  # Free, 99% of requests
OPENAI_API_KEY=xxx  # Backup, 1% of requests
```
**Estimated monthly cost:** < $1 💰

---

## 🔐 Security Checklist

- [ ] API keys in `.env` file (not in code)
- [ ] `.env` in `.gitignore`
- [ ] Rate limiting enabled
- [ ] Different keys for dev/prod
- [ ] Monitor usage regularly

---

## 🎨 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Toggle AI Panel |
| `Enter` | Send message |
| `Shift + Enter` | New line in chat |

---

## 📱 API Endpoints

```
POST /api/ai/chat       - Interactive chat
POST /api/ai/explain    - Explain code
POST /api/ai/fix        - Fix errors
POST /api/ai/suggest    - Code suggestions
```

---

## 🌐 Useful Links

**Get API Keys:**
- Gemini: https://aistudio.google.com/api-keys
- OpenAI: https://platform.openai.com/api-keys

**Documentation:**
- Full Setup Guide: `docs/AI_SETUP_GUIDE.md`
- Architecture: `docs/AI_COPILOT_INTEGRATION.md`
- Ballerina: https://ballerina.io/learn/

**Dashboards:**
- Gemini Usage: https://aistudio.google.com/
- OpenAI Usage: https://platform.openai.com/usage

---

## 🚀 Pro Tips

1. **Save Costs**: Use `auto` mode with Gemini primary
2. **Better Responses**: Add more code context in chat
3. **Faster**: Use `gemini-1.5-flash` for speed
4. **Higher Quality**: Use `gemini-1.5-pro` or `gpt-4o`
5. **Debug**: Check `backend/logs` for AI request details

---

**Need Help?** See full guide: `docs/AI_SETUP_GUIDE.md`
