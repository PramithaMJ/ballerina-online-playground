# Development Guide

## 🎯 How It Works

### Architecture Flow

1. **User writes code** → Frontend (HTML/JS)
2. **Click "Run" button** → JavaScript sends POST request to backend
3. **Backend receives code** → Go server (`:8081/execute`)
4. **Create temp file** → Save code to `/tmp/code.bal`
5. **Launch Docker container** → Execute code in isolated Ballerina container
6. **Capture output** → Collect stdout/stderr
7. **Return result** → JSON response to frontend
8. **Display output** → Show in UI

### Security Layers

```
┌─────────────────────────────────────────────┐
│  Layer 1: Frontend Validation               │
│  - Check for empty code                     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Layer 2: Backend Validation                │
│  - Timeout (30s)                            │
│  - Request validation                       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Layer 3: Docker Isolation                  │
│  - No network access                        │
│  - Memory limit (256MB)                     │
│  - CPU limit (0.5 core)                     │
│  - Process limit (50)                       │
│  - Read-only filesystem                     │
└─────────────────────────────────────────────┘
```

## 🔧 Development Workflow

### Starting the Project

```bash
# Quick start
./start.sh

# Or manual start:
# Terminal 1 - Backend
cd backend
go run main.go

# Terminal 2 - Frontend (optional, for development)
cd frontend
python3 -m http.server 3000
```

### Making Changes

#### Backend Changes (Go)

1. Edit files in `backend/`
2. Stop server (Ctrl+C)
3. Restart: `go run main.go`
4. Or use live reload: `go install github.com/cosmtrek/air@latest && air`

#### Frontend Changes (HTML/JS/CSS)

Just refresh your browser - no build step needed!

### Testing Backend API

```bash
# Test /execute endpoint
curl -X POST http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import ballerina/io;\npublic function main() {\n    io:println(\"Test\");\n}"}'

# Test with error
curl -X POST http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"invalid code here"}'
```

## 🐛 Common Development Issues

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or on Linux:
sudo systemctl start docker
```

### Issue: "Port 8081 already in use"

**Solution:**
```bash
# Find process using port 8081
lsof -i :8081

# Kill the process
kill -9 <PID>

# Or change port in main.go and script.js
```

### Issue: "CORS error in browser"

**Check:**
- Backend CORS middleware is enabled in `main.go`
- Frontend URL matches backend expectations
- Check browser console for specific error

### Issue: "Module not found" in Go

**Solution:**
```bash
cd backend
go mod tidy
go mod download
```

## Adding New Features

### Adding a New Endpoint

1. **Create handler** in `backend/handler/`:
```go
// backend/handler/format.go
func FormatCode(w http.ResponseWriter, r *http.Request) {
    // Your logic here
}
```

2. **Register route** in `backend/main.go`:
```go
http.HandleFunc("/format", enableCORS(handler.FormatCode))
```

3. **Call from frontend** in `frontend/script.js`:
```javascript
async function formatCode() {
    const response = await fetch(`${API_URL}/format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: yourCode })
    });
}
```

### Adding Code Examples

Edit `frontend/script.js`:
```javascript
const examples = {
    "Hello World": `import ballerina/io;\n\npublic function main() {\n    io:println("Hello!");\n}`,
    "Variables": `// Your example here`
};
```

### Adding Syntax Highlighting

Use **CodeMirror** or **Monaco Editor**:

```html
<!-- Add to index.html -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>

<script>
// Replace textarea with CodeMirror
var editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
    lineNumbers: true,
    mode: "text/x-ballerina",
    theme: "monokai"
});
</script>
```

##  Performance Optimization

### Backend Optimizations

1. **Connection Pooling** (if using database):
```go
var db *sql.DB
func init() {
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)
}
```

2. **Response Compression**:
```go
import "github.com/NYTimes/gziphandler"

http.Handle("/execute", gziphandler.GzipHandler(http.HandlerFunc(handler.RunCode)))
```

3. **Caching** (for common code snippets):
```go
var cache = sync.Map{}

func getCachedResult(codeHash string) (string, bool) {
    val, ok := cache.Load(codeHash)
    if ok {
        return val.(string), true
    }
    return "", false
}
```

### Frontend Optimizations

1. **Debounce** code execution:
```javascript
let timeout;
function debouncedRun() {
    clearTimeout(timeout);
    timeout = setTimeout(() => runCode(), 500);
}
```

2. **Code size limits**:
```javascript
if (code.length > 10000) {
    alert("Code is too long (max 10KB)");
    return;
}
```

## 🧪 Testing

### Unit Tests (Go)

```bash
cd backend
go test ./...
```

Example test file `backend/handler/run_test.go`:
```go
package handler

import (
    "testing"
    "net/http/httptest"
)

func TestRunCode(t *testing.T) {
    // Your test here
}
```

### Integration Tests

```bash
# Start server
go run main.go &

# Run tests
./test/integration_test.sh

# Stop server
pkill -f "go run main.go"
```

##  Building for Production

### Build Backend Binary

```bash
cd backend
CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o playground-server .
```

### Docker Build

```bash
cd backend
docker build -t ballerina-playground:latest .
docker run -p 8081:8081 ballerina-playground:latest
```

### Full Stack with Docker Compose

```bash
docker-compose up --build -d
```

## 🔍 Monitoring & Logging

### Add Structured Logging

```go
import "go.uber.org/zap"

logger, _ := zap.NewProduction()
defer logger.Sync()

logger.Info("code executed",
    zap.String("output", output),
    zap.Int("code_length", len(code)),
)
```

### Add Metrics

```go
import "github.com/prometheus/client_golang/prometheus"

var (
    executionCounter = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "code_executions_total",
            Help: "Total number of code executions",
        },
        []string{"status"},
    )
)
```

## 🎨 UI Enhancements

### Add Dark Mode Toggle

```javascript
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}
```

### Add Code Sharing

Generate shareable links with code in URL:
```javascript
function shareCode() {
    const encoded = btoa(editor.getValue());
    const url = `${window.location.origin}?code=${encoded}`;
    navigator.clipboard.writeText(url);
}

// Load from URL
const params = new URLSearchParams(window.location.search);
if (params.has('code')) {
    editor.setValue(atob(params.get('code')));
}
```

## 📚 Resources

- [Ballerina Language](https://ballerina.io/)
- [Go Documentation](https://golang.org/doc/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [MDN Web Docs](https://developer.mozilla.org/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature-name`
6. Open Pull Request

## 📝 Code Style

### Go
- Use `gofmt` for formatting
- Follow [Effective Go](https://golang.org/doc/effective_go.html)
- Use meaningful variable names

### JavaScript
- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Add comments for complex logic

### HTML/CSS
- Use semantic HTML5 tags
- Mobile-first responsive design
- Use CSS variables for theming
