# 🚀 Quick Start: AI Copilot Integration

## Setup in 3 Steps

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Configure Backend

```bash
# Edit backend/.env
cd backend
nano .env  # or use your favorite editor
```

Add this line:
```bash
OPENAI_API_KEY=sk-paste-your-actual-key-here
```

### Step 3: Start the Application

```bash
# Terminal 1: Start Backend
cd backend
go run main.go

# Terminal 2: Start Frontend
cd frontend-vite
npm install  # if not already done
npm run dev
```

## Using the AI Copilot

1. **Open the playground** in your browser
2. **Click the ✨ Sparkles icon** in the header
3. **Start chatting** with the AI assistant!

### Quick Actions

- **💡 Explain Code** - Understand what your code does
- **🔧 Fix Errors** - Get help fixing compilation errors
- **⚡ Optimize** - Improve your code performance
- **❓ Help** - Ask any Ballerina questions

### Example Queries

Try these to get started:

```
"How do I create an HTTP service?"
"Explain this code to me"
"What's the best way to handle errors?"
"Show me how to connect to a database"
"Create a simple REST API"
```

## Cost Information

- **GPT-4**: ~$0.045 per query (high quality)
- **GPT-3.5-Turbo**: ~$0.0015 per query (fast & cheap)

To use the cheaper model:
```bash
# In backend/.env
AI_MODEL=gpt-3.5-turbo
```

## Troubleshooting

### "AI service not available"
→ Check that your API key is correct in `.env`

### "Rate limit exceeded"
→ Wait a moment or upgrade your OpenAI plan

### Backend won't start
→ Make sure Go is installed: `go version`

### Frontend won't start
→ Install dependencies: `npm install`

## Need Help?

- 📖 Full docs: `docs/AI_COPILOT_INTEGRATION.md`
- 🐛 Report issues: GitHub Issues
- 💬 Ask questions: GitHub Discussions

---

**Happy Coding! 🎉**
