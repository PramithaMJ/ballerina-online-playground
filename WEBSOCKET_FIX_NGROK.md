# 🔧 WebSocket Fix: Use ngrok Instead of Cloudflare Tunnel

## ⚠️ Problem
Cloudflare Tunnel **does NOT support WebSocket protocol upgrades**, causing this error:
```
Failed to upgrade to WebSocket: websocket: response does not implement http.Hijacker
```

## ✅ Solution: Use ngrok (5 Minutes Setup)

### Step 1: Install ngrok
```bash
# macOS (using Homebrew)
brew install ngrok/ngrok/ngrok

# Or download from: https://ngrok.com/download
```

### Step 2: Stop Cloudflare Tunnel
```bash
# Find and kill the cloudflared process
ps aux | grep cloudflared
kill <process_id>

# Or if running in terminal, press Ctrl+C
```

### Step 3: Start ngrok Tunnel
```bash
# Navigate to backend directory
cd /Users/pramithajayasooriya/ballerina-online-playground/backend

# Start ngrok on port 8080 (same port as backend)
ngrok http 8080
```

### Step 4: Update Frontend API URL
ngrok will show output like:
```
Forwarding  https://abcd-1234-5678.ngrok-free.app -> http://localhost:8080
```

Copy the `https://...ngrok-free.app` URL and update your frontend:

**File:** `frontend-vite/src/config/env.config.js`
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'https://YOUR-NGROK-URL.ngrok-free.app'; // Replace with your ngrok URL
```

### Step 5: Rebuild Frontend
```bash
cd /Users/pramithajayasooriya/ballerina-online-playground/frontend-vite
npm run build
```

### Step 6: Test Debug Feature
1. Open your app in browser
2. Click the **Debug** button
3. Check browser console - you should see:
   - ✅ `🐛 [useDebugSession] Debug service returned session ID`
   - ✅ `✅ Debugging session started`
   - ✅ **No WebSocket errors!**
4. Debug Panel should appear on the right with **green "Connected"** status

---

## 🎯 Expected Results

### Browser Console (Success)
```
🐛 [useDebugSession] Starting debug session...
🐛 [useDebugSession] Calling debugService.startDebugging...
🎯 [App] isDebugging changed: true
✅ WebSocket connected
✅ Debugging session started: debug-1760812345678901234
🔌 Connected to debug server
```

### Backend Logs (Success)
```
POST /debug/start - 941.705µs
Created debug session: debug-1760812345678901234
WebSocket connected: debug-1760812345678901234
Debug execution started for session: debug-1760812345678901234
```

### Debug Panel Status
- 🟢 **Green indicator**: "Connected to debug server"
- ✅ Breakpoints panel shows breakpoints
- ✅ Variables panel active
- ✅ Control buttons (Continue, Step Over, etc.) enabled

---

## 🔄 Alternative: ngrok Static Domain (Optional)

If you don't want to update the URL every time:

### 1. Sign up for ngrok (Free)
Visit: https://dashboard.ngrok.com/signup

### 2. Get Auth Token
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Reserve Static Domain (Free tier gets 1 static domain)
Go to: https://dashboard.ngrok.com/domains

### 4. Start ngrok with Static Domain
```bash
ngrok http --domain=your-static-domain.ngrok-free.app 8080
```

### 5. Update Frontend Once
```javascript
export const API_BASE_URL = 'https://your-static-domain.ngrok-free.app';
```

Now your URL never changes! 🎉

---

## 📊 Comparison: Cloudflare Tunnel vs ngrok

| Feature | Cloudflare Tunnel | ngrok |
|---------|------------------|-------|
| HTTP Support | ✅ Yes | ✅ Yes |
| **WebSocket Support** | ❌ **NO** | ✅ **YES** |
| Free Tier | ✅ Yes | ✅ Yes |
| Static Domain | ✅ Yes | ✅ Yes (1 free) |
| Setup Time | 5 min | 2 min |
| Best For | Production sites | Development/WebSockets |

---

## 🚀 Quick Commands

### Start Everything
```bash
# Terminal 1: Start backend
cd /Users/pramithajayasooriya/ballerina-online-playground/backend
docker-compose up

# Terminal 2: Start ngrok
ngrok http 8080

# Terminal 3: Start frontend (if running locally)
cd /Users/pramithajayasooriya/ballerina-online-playground/frontend-vite
npm run dev
```

---

## 🆘 Troubleshooting

### Issue: "ngrok: command not found"
**Solution:**
```bash
brew install ngrok/ngrok/ngrok
```

### Issue: ngrok URL changes every restart
**Solution:** Use static domain (see above) or use ngrok config file:
```bash
# Create config file
cat > ~/.ngrok2/ngrok.yml << EOF
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  ballerina:
    proto: http
    addr: 8080
    domain: your-static-domain.ngrok-free.app
EOF

# Start with config
ngrok start ballerina
```

### Issue: CORS errors with ngrok
**Solution:** Your backend already has CORS configured - should work out of the box!

### Issue: "Failed to complete tunnel connection"
**Solution:** Check if port 8080 is running:
```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

---

## 📝 Summary

1. **Stop** Cloudflare Tunnel
2. **Install** ngrok: `brew install ngrok/ngrok/ngrok`
3. **Start** ngrok: `ngrok http 8080`
4. **Update** frontend API URL with ngrok URL
5. **Rebuild** frontend: `npm run build`
6. **Test** - Debug Panel should work with WebSocket! 🎉

---

## 🎯 Next Steps After ngrok Setup

Once WebSocket works, you'll be able to:
- ✅ Set breakpoints by clicking line numbers
- ✅ See real-time variable values
- ✅ Step through code execution
- ✅ View call stack
- ✅ Use debug control buttons (Continue, Step Over, Step Into, etc.)

**The full debugging experience will be functional!** 🚀
