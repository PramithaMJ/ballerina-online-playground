# 🐛 502 Bad Gateway - Root Cause and Solution

## 📊 Issue Analysis

### What's Happening:
1. ✅ Backend receives POST request to `/execute`
2. ✅ Code validation passes
3. ✅ Docker executes Ballerina code successfully
4. ✅ Output generated: `"Hello, Ballerina!\nResult: 20\nWelcome, Developer!\n"`
5. ❌ **Response sent WITHOUT CORS headers**
6. ❌ Cloudflare/Browser rejects response → 502 Bad Gateway

### Evidence from Logs:
```
ballerina-playground-backend  | 2025/10/12 11:27:21 Execution successful
ballerina-playground-backend  | 2025/10/12 11:27:21 POST /execute - 17.816483186s
```

Backend reports success, but frontend gets 502.

---

## 🔍 Root Cause

### The Problem:
**Middleware execution order was wrong**

```go
// ❌ OLD (WRONG) - CORS applied too late
http.HandleFunc("/execute", chain(
    handler.RunCode,
    enableCORS,              // 5th - TOO LATE!
    middleware.RateLimitMiddleware(rateLimiter),
    performanceMiddleware,
    loggingMiddleware,
))
```

In Go, middleware chains execute **right-to-left**:
```
Request → logging → performance → rateLimit → CORS → handler → CORS → ... → Response
                                                         ↑
                                                    Applied HERE
                                                    (after handler!)
```

When the handler calls `w.Write()` or `http.Error()`, the response is sent **before** CORS middleware runs!

---

## ✅ The Fix

### Commit: `b4399a9`
**Title:** "fix: Reorder middleware chain to apply CORS headers first"

```go
// ✅ NEW (CORRECT) - CORS applied first
http.HandleFunc("/execute", chain(
    handler.RunCode,
    middleware.RateLimitMiddleware(rateLimiter),
    performanceMiddleware,
    loggingMiddleware,
    enableCORS,              // Rightmost = First to execute!
))
```

Now the execution flow is:
```
Request → CORS → logging → performance → rateLimit → handler → Response
           ↑
      Applied FIRST!
      Headers set before handler runs
```

---

## 📦 Deployment Status

### Local Machine:
- ✅ Changes committed: `b4399a9`
- ✅ Pushed to GitHub: `origin/security`

### EC2 Server:
- ❌ **Still running OLD code**
- ❌ Needs: `git pull` + rebuild

### How to Verify EC2 Has Old Code:
The health endpoint returns CORS headers (because it doesn't chain through the buggy middleware), but `/execute` doesn't. This confirms the middleware order bug is still present.

---

## 🚀 Deploy to EC2 (REQUIRED)

### Quick Deploy (Copy-Paste This):
```bash
cd ~/ballerina-online-playground && \
git pull origin security && \
cd backend && \
sudo docker-compose down && \
sudo docker-compose up -d --build && \
sleep 5 && \
sudo docker ps && \
sudo docker-compose logs --tail=20
```

### Expected Output:
```
remote: Enumerating objects: 7, done.
remote: Counting objects: 100% (7/7), done.
...
Successfully built <image-id>
Creating ballerina-playground-backend ... done

CONTAINER ID   IMAGE                                 STATUS
7ac4e0d949f1   ballerina-online-playground-backend   Up 5 seconds (healthy)

🚀 Server started on port 8081
```

---

## 🧪 Testing After Deploy

### 1. Test OPTIONS (Preflight):
```bash
curl -X OPTIONS https://mug-participation-variations-wildlife.trycloudflare.com/execute \
  -H "Origin: https://pramithamj.github.io" \
  -v 2>&1 | grep -E "(HTTP|access-control)"
```

**Expected:**
```
< HTTP/2 204
< access-control-allow-origin: https://pramithamj.github.io
< access-control-allow-methods: POST, GET, OPTIONS, HEAD
```

### 2. Test POST (Actual Request):
```bash
curl -X POST https://mug-participation-variations-wildlife.trycloudflare.com/execute \
  -H "Content-Type: application/json" \
  -H "Origin: https://pramithamj.github.io" \
  -d '{"code":"import ballerina/io;\n\npublic function main() {\n    io:println(\"Success!\");\n}"}' \
  -i | head -20
```

**Expected:**
```
HTTP/2 200                                                    ← Was 502!
access-control-allow-origin: https://pramithamj.github.io   ← NOW PRESENT!
content-type: application/json

{"output":"Success!\n","error":""}
```

### 3. Test in Frontend:
1. Open https://pramithamj.github.io
2. Click "Run Code"
3. ✅ Should see output in console (not 502 error!)

---

## 📝 Summary

| Component | Status | Action Required |
|-----------|--------|-----------------|
| **Root Cause** | ✅ Identified | Middleware order bug |
| **Fix Developed** | ✅ Complete | Commit `b4399a9` |
| **Local Code** | ✅ Updated | Pushed to GitHub |
| **EC2 Server** | ❌ **OUTDATED** | **Deploy NOW** |
| **Frontend** | ⏸️ Waiting | Will work after deploy |

---

## ⏰ Time to Fix
- Pull + rebuild: ~2 minutes
- Total downtime: ~10 seconds

---

## 🎯 Next Steps

1. **SSH into EC2**
2. **Run the quick deploy command** (see above)
3. **Wait 2 minutes** for rebuild
4. **Test the frontend** - should work immediately!

---

## 🤔 Why This Happened

The middleware chain syntax in Go is confusing:

```go
chain(handler, mw1, mw2, mw3)
```

Executes as: `mw3(mw2(mw1(handler)))`

So the **rightmost** middleware runs **first**. CORS must be rightmost to run before the handler writes the response.

---

## 📚 Related Commits

- `d8b5660` - Enhanced CORS middleware (headers added)
- `b4399a9` - **Fixed middleware order (THE FIX)** ← Deploy this!

---

Last updated: 2025-10-12 11:28 GMT
