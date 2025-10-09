# 🎯 Quick Answer: What to Change

## TL;DR (Too Long; Didn't Read)

When you get your Cloudflare HTTPS URL, you only need to change:

### ✅ MUST CHANGE

1. **GitHub Secret** (for production deployment)

### 🔄 OPTIONAL

2. **Local .env file** (for local development only)

### ❌ NO CHANGES NEEDED

- Backend code (`main.go`) - stays the same
- Docker files - stay the same
- Docker Compose - stays the same
- Security groups - stay the same
- Frontend code (`App.jsx`) - stays the same

---

## 📊 Visual Guide

```
 ┌───────────────────────────────────────────────────────────┐
│                  WHAT TO UPDATE                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1️⃣  GitHub Secret (REQUIRED)                            │
│      ├─ Go to: repo → Settings → Secrets → Actions       │
│      ├─ Find: VITE_API_URL                               │
│      ├─ Old: http://54.160.240.225:8081                  │
│      └─ New: https://your-tunnel-url                     │
│                                                          │
│  2️⃣  Local .env (OPTIONAL)                               │
│      ├─ File: frontend-vite/.env                         │
│      ├─ Old: VITE_API_URL=http://54.160.240.225:8081    │
│      └─ New: VITE_API_URL=https://your-tunnel-url       │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                  NO CHANGES NEEDED                        │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ❌ backend/main.go                                       │
│     → Still listens on :8081                             │
│                                                           │
│  ❌ backend/Dockerfile                                    │
│     → Still exposes 8081                                 │
│                                                           │
│  ❌ docker-compose.yml                                    │
│     → Still maps 8081:8081                               │
│                                                           │
│  ❌ docker-compose.prod.yml                               │
│     → Still maps 8081:8081                               │
│                                                           │
│  ❌ frontend-vite/src/App.jsx                             │
│     → Reads from env, no hardcoded URL                   │
│                                                           │
│  ❌ frontend-vite/vite.config.js                          │
│     → No URL configuration here                          │
│                                                           │
│  ❌ EC2 Security Group                                    │
│     → Port 8081 can stay open or closed                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 🚀 The Complete Process (5 Steps)

### Step 1: Start Cloudflare Tunnel on EC2

```bash
ssh ubuntu@54.160.240.225
cloudflared tunnel --url http://localhost:8081
```

**Output:**

```
https://amazing-cloud-5678.trycloudflare.com
```

---

### Step 2: Update GitHub Secret

Go to: `https://github.com/PramithaMJ/ballerina-online-playground/settings/secrets/actions`

Change `VITE_API_URL` to: `https://amazing-cloud-5678.trycloudflare.com`

---

### Step 3: (Optional) Update Local .env

```bash
# Edit: frontend-vite/.env
VITE_API_URL=https://amazing-cloud-5678.trycloudflare.com
```

---

### Step 4: Trigger Redeploy

```bash
git add .
git commit -m "Update backend to HTTPS"
git push origin main
```

---

### Step 5: Test!

Visit: `https://pramithamj.github.io/ballerina-online-playground/`

---

## 🎓 Why Backend Code Doesn't Change

The backend still runs on `http://localhost:8081` **internally**.

Cloudflare Tunnel creates a **proxy**:

```
Internet (HTTPS)
    ↓
https://tunnel-url.trycloudflare.com
    ↓
[Cloudflare Tunnel on EC2]
    ↓
http://localhost:8081 (Backend)
```

The backend doesn't know about HTTPS. It just receives HTTP requests from the tunnel.

---

## 🔍 File-by-File Breakdown

### ✅ Files That Change


| File              | What Changes | Why                                 |
| ----------------- | ------------ | ----------------------------------- |
| GitHub Secret     | URL value    | Production frontend needs HTTPS URL |
| `.env` (optional) | URL value    | Local testing with HTTPS backend    |

### ❌ Files That Don't Change


| File                           | Why No Change      | Details                            |
| ------------------------------ | ------------------ | ---------------------------------- |
| `backend/main.go`              | Backend stays HTTP | Tunnel handles HTTPS               |
| `backend/Dockerfile`           | Port stays 8081    | Internal port doesn't change       |
| `docker-compose.prod.yml`      | Port mapping same  | Maps to internal 8081              |
| `frontend-vite/src/App.jsx`    | Reads from env     | Uses`import.meta.env.VITE_API_URL` |
| `frontend-vite/vite.config.js` | No URL config      | Doesn't contain API URL            |

---

## 💻 Commands You'll Use

### On EC2 (Backend Server)

```bash
# Start tunnel
cloudflared tunnel --url http://localhost:8081

# Keep tunnel running (use screen)
screen -S tunnel
cloudflared tunnel --url http://localhost:8081
# Press Ctrl+A then D to detach
```

### On Local Machine (Your Computer)

```bash
# Update local env (optional)
cd ballerina-online-playground/frontend-vite
nano .env  # or use your editor

# Commit and push
cd ..
git add .
git commit -m "Update backend URL"
git push origin main
```

### On GitHub.com (Browser)

```
Settings → Secrets and variables → Actions
→ Update VITE_API_URL secret
```

---

## ✅ Quick Checklist

Copy this and check off as you go:

```
□ SSH into EC2
□ Run: cloudflared tunnel --url http://localhost:8081
□ Copy the HTTPS URL from output
□ Update GitHub Secret VITE_API_URL
□ (Optional) Update local .env file
□ Commit and push changes
□ Wait for GitHub Actions to finish
□ Test at: https://pramithamj.github.io/ballerina-online-playground/
□ Run Ballerina code - should work!
```

---

## 🆘 Common Questions

### Q: Do I need to rebuild Docker images?

**A:** No! Backend stays the same.

### Q: Do I need to restart Docker containers?

**A:** No! Just start the Cloudflare tunnel alongside them.

### Q: What if I restart EC2?

**A:** You'll need to:

1. Restart backend: `sudo docker-compose -f docker-compose.prod.yml up -d`
2. Restart tunnel: `cloudflared tunnel --url http://localhost:8081`
3. Update GitHub Secret with new tunnel URL (it changes)

### Q: The tunnel URL changes every restart?

**A:** Yes, with the free method. For permanent URL:

- Buy a domain ($8-12/year)
- Use `cloudflared tunnel login` method
- Or pay for Cloudflare Zero Trust

### Q: Can I test before updating GitHub?

**A:** Yes! Update local `.env` and run `npm run dev` locally.

### Q: Do I need to change CORS settings?

**A:** No! CORS is already configured in `main.go`.

---

## 📱 Mobile Quick Reference

Save this for when you're on the go:

```
1. EC2: cloudflared tunnel --url http://localhost:8081
2. Copy URL
3. GitHub: Settings → Secrets → Update VITE_API_URL
4. Local: git push
5. Done!
```

---

**Remember:** Only 2 places need updating:

1. GitHub Secret (required)
2. Local .env (optional)

That's it! 🎉
