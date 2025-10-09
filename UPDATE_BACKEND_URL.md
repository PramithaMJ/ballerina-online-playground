# 🔄 How to Update Backend URL

## Current Situation

You have **different URLs** for different environments:

```
Local Development:   .env file → VITE_API_URL=http://54.160.240.225:8081
Production (GitHub): GitHub Secret → VITE_API_URL=http://54.160.240.225:8081
Backend (EC2):       Stays the same → http://localhost:8081 (internal)
```

---

## 📋 What Needs to Change When You Get HTTPS URL

### Step 1: Get Your Cloudflare Tunnel URL

On EC2:
```bash
cloudflared tunnel --url http://localhost:8081
```

Output will be like:
```
https://amazing-cloud-5678.trycloudflare.com
```

**Copy this URL!** Let's call it `YOUR_HTTPS_URL`

---

### Step 2: Update GitHub Secret (Production)

This is the **MOST IMPORTANT** change!

#### Option A: Via GitHub Website
1. Go to: `https://github.com/PramithaMJ/ballerina-online-playground/settings/secrets/actions`
2. Find `VITE_API_URL`
3. Click "Update"
4. Change value to: `YOUR_HTTPS_URL` (e.g., `https://amazing-cloud-5678.trycloudflare.com`)
5. Click "Update secret"

#### Option B: Via GitHub CLI (if installed)
```bash
gh secret set VITE_API_URL --body "YOUR_HTTPS_URL"
```

---

### Step 3: Update Local .env (Optional - For Local Testing)

**File:** `frontend-vite/.env`

**Current:**
```env
# Backend API URL
VITE_API_URL=http://54.160.240.225:8081
```

**Change to:**
```env
# Backend API URL - Cloudflare Tunnel HTTPS
VITE_API_URL=https://amazing-cloud-5678.trycloudflare.com
```

**Note:** This only affects local development when you run `npm run dev`

---

### Step 4: Trigger Production Redeploy

```bash
# From your local machine
cd ~/ballerina-online-playground

# Commit and push (this triggers GitHub Actions)
git add .
git commit -m "Update backend URL to HTTPS"
git push origin main

# Or trigger without changes:
git commit --allow-empty -m "Redeploy with HTTPS backend"
git push origin main
```

---

## 🚨 What DOESN'T Need to Change

### ❌ Backend Code (`backend/main.go`)
- Backend still runs on `http://localhost:8081`
- Cloudflare tunnel forwards to it
- **No changes needed!**

### ❌ Docker Compose Files
- `docker-compose.yml`
- `docker-compose.prod.yml`
- They still use port 8081
- **No changes needed!**

### ❌ Backend Dockerfile
- Still exposes port 8081
- **No changes needed!**

### ❌ EC2 Security Group
- Port 8081 can stay open (for direct testing)
- Or you can close it (more secure)
- **No changes needed for tunnel to work!**

---

## 📊 Environment Comparison

### Before (HTTP - Not Working)
```
┌─────────────────────────────────────┐
│ Local Development                   │
│ .env: http://54.160.240.225:8081   │
│ Works: ✅ (same network)            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Production (GitHub Pages)           │
│ Secret: http://54.160.240.225:8081 │
│ Works: ❌ (HTTPS→HTTP blocked)      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Backend (EC2)                       │
│ Port: 8081 (HTTP)                   │
│ Works: ✅ (but not accessible)      │
└─────────────────────────────────────┘
```

### After (HTTPS - Working!)
```
┌─────────────────────────────────────┐
│ Local Development                   │
│ .env: https://tunnel.url            │
│ Works: ✅                            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Production (GitHub Pages)           │
│ Secret: https://tunnel.url          │
│ Works: ✅ (HTTPS→HTTPS allowed)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Cloudflare Tunnel                   │
│ URL: https://tunnel.url             │
│ Forwards to: localhost:8081         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Backend (EC2)                       │
│ Port: 8081 (HTTP internally)        │
│ Works: ✅ (via tunnel)               │
└─────────────────────────────────────┘
```

---

## 🔍 Files You DO Need to Update

### 1. GitHub Secret
**Location:** GitHub.com → Settings → Secrets → Actions  
**Change:** `VITE_API_URL` from HTTP to HTTPS

### 2. Local .env (Optional)
**File:** `frontend-vite/.env`  
**Change:** Update URL for local testing

That's it! Just 2 things!

---

## 🔍 Files You DON'T Need to Update

### ❌ backend/main.go
```go
// This stays the same:
Addr: ":8081",
```

### ❌ docker-compose.prod.yml
```yaml
# This stays the same:
ports:
  - "8081:8081"
```

### ❌ backend/Dockerfile
```dockerfile
# This stays the same:
EXPOSE 8081
```

### ❌ frontend-vite/vite.config.js
```javascript
// This doesn't have the URL hardcoded
// It reads from environment variables
```

### ❌ frontend-vite/src/App.jsx
```javascript
// This reads from env:
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081'
// No hardcoded URL, so no changes needed!
```

---

## 🎯 Step-by-Step Checklist

- [ ] **Step 1:** Start Cloudflare tunnel on EC2
  ```bash
  cloudflared tunnel --url http://localhost:8081
  ```

- [ ] **Step 2:** Copy the HTTPS URL from output

- [ ] **Step 3:** Update GitHub Secret `VITE_API_URL`
  - Go to repo settings → Secrets → Actions
  - Update `VITE_API_URL` with HTTPS URL

- [ ] **Step 4:** (Optional) Update local `.env` file
  ```bash
  # Edit frontend-vite/.env
  VITE_API_URL=https://your-tunnel-url
  ```

- [ ] **Step 5:** Commit and push to trigger redeploy
  ```bash
  git add .
  git commit -m "Update backend to HTTPS"
  git push origin main
  ```

- [ ] **Step 6:** Wait for GitHub Actions to complete
  - Go to: https://github.com/PramithaMJ/ballerina-online-playground/actions
  - Wait for green checkmark

- [ ] **Step 7:** Test your app!
  - Visit: https://pramithamj.github.io/ballerina-online-playground/
  - Write Ballerina code
  - Click "Run Code"
  - Should work! 🎉

---

## 🧪 How to Test

### Test Backend Directly
```bash
# Old HTTP URL (still works for testing)
curl http://54.160.240.225:8081/health

# New HTTPS URL (through Cloudflare)
curl https://your-tunnel-url/health

# Both should return:
# {"status":"healthy","service":"ballerina-compiler-backend"}
```

### Test Frontend
1. Open: https://pramithamj.github.io/ballerina-online-playground/
2. Open browser DevTools (F12)
3. Go to Console tab
4. Should see no CORS errors
5. Run sample code
6. Should execute successfully!

### Test Local Development (Optional)
```bash
cd frontend-vite
npm run dev
# Visit http://localhost:5173
# Should connect to HTTPS backend
```

---

## 🆘 Troubleshooting

### Frontend Still Shows HTTP Error?
1. Check GitHub Secret is updated
2. Wait for GitHub Actions to complete
3. Clear browser cache (Ctrl+Shift+Del)
4. Hard reload (Ctrl+Shift+R)

### Tunnel URL Not Working?
```bash
# Check if tunnel is running on EC2
ssh ubuntu@54.160.240.225
ps aux | grep cloudflared

# If not running, restart it:
cloudflared tunnel --url http://localhost:8081
```

### Backend Not Responding?
```bash
# Check backend container
sudo docker-compose -f docker-compose.prod.yml ps
sudo docker-compose -f docker-compose.prod.yml logs backend

# Restart if needed
sudo docker-compose -f docker-compose.prod.yml restart
```

---

## 💡 Pro Tips

1. **Keep tunnel running:** Use `screen` or `nohup` to keep tunnel alive
   ```bash
   screen -S tunnel
   cloudflared tunnel --url http://localhost:8081
   # Press Ctrl+A then D to detach
   ```

2. **Bookmark tunnel URL:** Save it somewhere, you'll need it again

3. **Test before pushing:** Update local `.env` first, test with `npm run dev`

4. **Monitor logs:** Watch GitHub Actions logs during deployment

5. **Check browser console:** DevTools (F12) shows helpful error messages

---

## 📚 Related Documentation

- **Full HTTPS Guide:** `HTTPS_SETUP_GUIDE.md`
- **Quick Fix:** `HTTPS_QUICK_FIX.md`
- **Understanding HTTPS:** `UNDERSTANDING_HTTPS_ISSUE.md`
- **Commands:** `COMMAND_REFERENCE.md`

---

**Summary:** You only need to update the GitHub Secret and optionally your local .env file. Nothing in backend code or Docker configs needs to change! 🚀
