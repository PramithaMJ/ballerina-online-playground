# 🔧 Complete Setup & Troubleshooting Guide

## 📋 Prerequisites Checklist

Before starting, ensure you have:

```
☐ Docker Desktop installed and running
☐ Go 1.23+ installed
☐ Modern web browser (Chrome, Firefox, Safari, Edge)
☐ Terminal/Command Prompt access
☐ 2GB free disk space (for Docker images)
```

## 🎬 Step-by-Step Setup

### Step 1: Verify Docker Installation

```bash
# Check Docker is installed
docker --version
# Expected: Docker version 20.x.x or higher

# Check Docker is running
docker ps
# Expected: List of containers (or empty list if none running)

# If Docker not running:
# - Mac/Windows: Start Docker Desktop application
# - Linux: sudo systemctl start docker
```

### Step 2: Clone and Navigate to Project

```bash
cd /path/to/ballerina-online-playground
```

### Step 3: Pull Ballerina Docker Image

```bash
# This downloads the Ballerina runtime (~500MB)
docker pull ballerina/ballerina:latest

# Verify image is downloaded
docker images | grep ballerina
# Expected: ballerina/ballerina   latest   xxx   xxx   xxx
```

### Step 4: Verify Go Installation

```bash
# Check Go is installed
go version
# Expected: go version go1.23.x

# Navigate to backend
cd backend

# Download dependencies
go mod download

# Verify modules
go list -m all
```

### Step 5: Start Backend Server

```bash
# From backend directory
go run main.go

# Expected output:
# 2025/10/09 12:00:00 Server started on port 8081
# 2025/10/09 12:00:00 CORS enabled for all origins
```

**Keep this terminal open!** Backend must keep running.

### Step 6: Test Backend (New Terminal)

```bash
# Open a new terminal window
curl -X POST http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import ballerina/io;\npublic function main() {\n    io:println(\"Test\");\n}"}'

# Expected output:
# {"output":"Test\n","error":""}
```

### Step 7: Open Frontend

**Option A: Direct Open (Simplest)**
```bash
# Mac
open frontend/index.html

# Linux
xdg-open frontend/index.html

# Windows
start frontend/index.html
```

**Option B: With Local Server (Recommended for development)**
```bash
# Open new terminal
cd frontend
python3 -m http.server 3000

# Then open browser to:
# http://localhost:3000
```

### Step 8: Test in Browser

1. You should see sample code already loaded
2. Click "Run" button
3. Output panel should show: "Hello, Ballerina!"

✅ **Success!** Your playground is working!

---

## 🐛 Troubleshooting Common Issues

### Problem 1: "Connection Error" in Browser

**Symptoms:**
- Frontend shows "Connection Error"
- Output panel shows error message

**Diagnosis:**
```bash
# Check if backend is running
curl http://localhost:8081/execute
```

**Solutions:**

**A) Backend not running**
```bash
# Start backend
cd backend
go run main.go
```

**B) Wrong port in frontend**
```bash
# Check script.js has correct URL
grep API_URL frontend/script.js
# Should show: const API_URL = 'http://localhost:8081';
```

**C) CORS not enabled**
```bash
# Check main.go has CORS middleware
grep "Access-Control-Allow-Origin" backend/main.go
# Should find the CORS header
```

---

### Problem 2: "Cannot connect to Docker daemon"

**Symptoms:**
- Backend logs show: "Cannot connect to Docker daemon"
- Error: "docker: command not found"

**Solutions:**

**A) Docker not installed**
```bash
# Mac: Download from https://www.docker.com/products/docker-desktop
# Linux: 
sudo apt-get update
sudo apt-get install docker.io

# Windows: Download from https://www.docker.com/products/docker-desktop
```

**B) Docker not running**
```bash
# Mac/Windows: Open Docker Desktop app

# Linux:
sudo systemctl start docker
sudo systemctl enable docker  # Start on boot

# Verify
docker ps
```

**C) Permission denied (Linux only)**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or:
newgrp docker

# Verify
docker ps  # Should work without sudo
```

---

### Problem 3: "Port 8081 already in use"

**Symptoms:**
- Backend fails to start
- Error: "bind: address already in use"

**Solutions:**

**Option A: Kill existing process**
```bash
# Find process using port 8081
lsof -i :8081
# or
netstat -an | grep 8081

# Kill the process (replace <PID> with actual ID)
kill -9 <PID>

# Restart backend
cd backend && go run main.go
```

**Option B: Change port**
```bash
# 1. Edit backend/main.go
# Change line:
# log.Fatal(http.ListenAndServe(":8081", nil))
# To:
# log.Fatal(http.ListenAndServe(":9090", nil))

# 2. Edit frontend/script.js
# Change line:
# const API_URL = 'http://localhost:8081';
# To:
# const API_URL = 'http://localhost:9090';

# 3. Restart backend
cd backend && go run main.go
```

---

### Problem 4: "Execution timeout"

**Symptoms:**
- Code runs for a long time
- Error: "execution timeout: code took longer than 30 seconds"

**Cause:** Code has infinite loop or very slow operation

**Solutions:**

**A) Fix your code**
```ballerina
// Bad - infinite loop
while true {
    // ...
}

// Good - with condition
int i = 0;
while i < 10 {
    i = i + 1;
}
```

**B) Increase timeout (if legitimate use case)**
```bash
# Edit backend/utils/docker.go
# Change line:
# ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
# To:
# ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)

# Restart backend
```

---

### Problem 5: "Module not found" in Go

**Symptoms:**
```
package ballerina-compiler/ballerina-compiler-backend/handler is not in std
```

**Solutions:**

```bash
cd backend

# Reinitialize module
go mod init ballerina-compiler/ballerina-compiler-backend

# Download dependencies
go mod tidy
go mod download

# Verify
go list -m all

# Run again
go run main.go
```

---

### Problem 6: Ballerina Image Not Found

**Symptoms:**
- Error: "Unable to find image 'ballerina/ballerina:latest'"

**Solutions:**

```bash
# Pull image manually
docker pull ballerina/ballerina:latest

# Verify
docker images | grep ballerina

# If pull fails (network issue), try:
docker pull ballerina/ballerina:2201.9.0  # Specific version

# Update docker.go to use specific version:
# Change: "ballerina/ballerina:latest"
# To: "ballerina/ballerina:2201.9.0"
```

---

### Problem 7: "No output" but code should print

**Symptoms:**
- Code runs without error
- But no output shown

**Diagnosis:**

```ballerina
// This code WILL produce output
import ballerina/io;

public function main() {
    io:println("Hello");
}

// This code will NOT produce output (no print statement)
public function main() {
    int x = 5 + 3;  // Just calculation, no output
}
```

**Solution:** Add `io:println()` to see results

```ballerina
import ballerina/io;

public function main() {
    int result = 5 + 3;
    io:println(result);  // Now you'll see: 8
}
```

---

### Problem 8: Browser CORS Error

**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions:**

**A) Verify CORS middleware**
```bash
# Check main.go has enableCORS function
grep "enableCORS" backend/main.go

# Should see:
# http.HandleFunc("/execute", enableCORS(handler.RunCode))
```

**B) Restart backend**
```bash
# Stop backend (Ctrl+C)
# Start again
cd backend && go run main.go
```

**C) Check browser console**
```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Should NOT see CORS errors
```

---

### Problem 9: Code with Syntax Error Hangs

**Symptoms:**
- Invalid code seems to run forever

**This is normal!** Ballerina compiler is trying to compile.

**Expected behavior:**
- After ~5-30 seconds, you'll see compilation errors
- Docker timeout will kill it after 30s max

**Solution:** Write valid Ballerina syntax 😊

---

### Problem 10: Frontend looks broken (no styles)

**Symptoms:**
- Plain HTML, no colors
- Buttons don't look styled

**Solutions:**

**A) Check CSS file exists**
```bash
ls -la frontend/style.css
# Should exist
```

**B) Check HTML references CSS**
```bash
grep "style.css" frontend/index.html
# Should see: <link rel="stylesheet" href="style.css">
```

**C) Serve with HTTP server**
```bash
# Don't just open HTML file, serve it:
cd frontend
python3 -m http.server 3000
# Open: http://localhost:3000
```

---

## 🧪 Testing Your Setup

### Quick Health Check

Run this script to verify everything:

```bash
#!/bin/bash

echo "🏥 Health Check"
echo "==============="

# 1. Docker
if docker --version > /dev/null 2>&1; then
    echo "✅ Docker installed"
else
    echo "❌ Docker not installed"
fi

# 2. Docker running
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker running"
else
    echo "❌ Docker not running"
fi

# 3. Go
if go version > /dev/null 2>&1; then
    echo "✅ Go installed"
else
    echo "❌ Go not installed"
fi

# 4. Ballerina image
if docker images | grep -q ballerina; then
    echo "✅ Ballerina image present"
else
    echo "❌ Ballerina image missing - run: docker pull ballerina/ballerina:latest"
fi

# 5. Backend running
if curl -s http://localhost:8081/execute > /dev/null 2>&1; then
    echo "✅ Backend server running"
else
    echo "❌ Backend server not running - run: cd backend && go run main.go"
fi

echo ""
echo "Done!"
```

---

## 📊 Performance Tips

### If execution is slow:

1. **First run is always slower** - Docker pulls image
2. **Subsequent runs faster** - Image cached
3. **Complex code takes longer** - Normal behavior

### Optimize backend:

```go
// Add response caching for identical code
var cache sync.Map

func getCached(code string) (string, bool) {
    hash := sha256.Sum256([]byte(code))
    val, ok := cache.Load(hash)
    if ok {
        return val.(string), true
    }
    return "", false
}
```

---

## 🎓 Understanding Error Messages

### Frontend Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| "Connection Error" | Can't reach backend | Start backend server |
| "No code provided" | Empty textarea | Write some code first |
| "Request failed" | Network issue | Check URL in script.js |

### Backend Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| "Invalid request method" | Not using POST | Use POST request |
| "Invalid request body" | Malformed JSON | Check JSON format |
| "Failed to save code" | Filesystem issue | Check permissions |

### Docker Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| "Cannot connect to daemon" | Docker not running | Start Docker |
| "Image not found" | Missing Ballerina image | docker pull ballerina/ballerina:latest |
| "execution timeout" | Code too slow/infinite loop | Fix code or increase timeout |

---

## 🆘 Still Having Issues?

### Gather Information

```bash
# System info
uname -a
docker --version
go version

# Backend logs
cd backend
go run main.go 2>&1 | tee backend.log

# Test manually
curl -v http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import ballerina/io;\npublic function main() {io:println(\"Test\");}"}'
```

### Check These Files

1. `backend/main.go` - CORS enabled?
2. `backend/utils/docker.go` - Timeout value?
3. `frontend/script.js` - Correct API_URL?
4. `backend/go.mod` - Module path correct?

### Clean Start

```bash
# Kill all Docker containers
docker kill $(docker ps -q)

# Remove temp files
rm -rf /tmp/code*.bal

# Restart backend
cd backend
go clean
go run main.go
```

---

## ✅ Success Criteria

Your playground is working correctly when:

1. ✅ Backend starts without errors
2. ✅ `curl` test returns valid JSON
3. ✅ Frontend loads with sample code
4. ✅ Clicking "Run" shows output
5. ✅ Error codes show error messages
6. ✅ "Clear" button resets everything

---

**Need more help?** 
- Check README.md for documentation
- Check DEVELOPMENT.md for advanced topics
- Run ./test-backend.sh for automated testing

**Happy Coding! 🎉**
