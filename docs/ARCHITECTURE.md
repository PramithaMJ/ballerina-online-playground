# 🏗️ Ballerina Online Playground - Architecture Documentation

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER'S BROWSER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Frontend (HTML/CSS/JS)                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │   │
│  │  │  Code Editor │  │  Run Button  │  │   Output Display    │   │   │
│  │  │  (textarea)  │  │              │  │   (pre element)     │   │   │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP POST /execute
                                │ { "code": "..." }
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Backend Server (Go - Port 8081)                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  main.go                                                         │   │
│  │  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │ HTTP Handler  │→ │  CORS Middleware│→ │  Route Handler  │   │   │
│  │  │ (Port 8081)   │  │  (Security)     │  │  (run.go)       │   │   │
│  │  └───────────────┘  └─────────────────┘  └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  handler/run.go                                                  │   │
│  │  1. Validate request                                             │   │
│  │  2. Extract code from JSON                                       │   │
│  │  3. Call utils/file.go → Save to temp file                       │   │
│  │  4. Call utils/docker.go → Execute in container                  │   │
│  │  5. Capture output                                               │   │
│  │  6. Return JSON response                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ Docker API Call
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Docker Engine (Host Machine)                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  utils/docker.go                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  docker run --rm \                                       │    │   │
│  │  │    --network none \           # No internet access       │    │   │
│  │  │    --memory 256m \             # 256MB RAM limit         │    │   │
│  │  │    --cpus 0.5 \                # Half CPU core           │    │   │
│  │  │    --pids-limit 50 \           # Max 50 processes        │    │   │
│  │  │    -v /tmp/code.bal:/home/ballerina/code.bal:ro \        │    │   │
│  │  │                                # Mount file read-only    │    │   │
│  │  │    ballerina/ballerina:latest \                          │    │   │
│  │  │    bal run /home/ballerina/code.bal                      │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ Launch Container
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Isolated Docker Container (Ballerina Runtime)              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Container Environment                                           │   │
│  │  • Image: ballerina/ballerina:latest                             │   │
│  │  • Network: NONE (isolated)                                      │   │
│  │  • Memory: 256MB max                                             │   │
│  │  • CPU: 0.5 core max                                             │   │
│  │  • Processes: 50 max                                             │   │
│  │  • Timeout: 30 seconds                                           │   │
│  │  • Filesystem: Read-only                                         │   │
│  │                                                                   │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │  Ballerina Compiler & Runtime                             │  │   │
│  │  │  1. Read /home/ballerina/code.bal                         │  │   │
│  │  │  2. Parse and compile Ballerina code                      │  │   │
│  │  │  3. Execute compiled bytecode                             │  │   │
│  │  │  4. Output to stdout/stderr                               │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                │ Output (stdout + stderr)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Response Flow (Backwards)                         │
│                                                                           │
│  Container → Docker Engine → Backend → HTTP Response → Frontend          │
│  (output)    (capture)        (JSON)     (network)      (display)        │
└─────────────────────────────────────────────────────────────────────────┘
```

##  Request/Response Flow

### Complete Flow Diagram

```
┌──────────┐
│  USER    │
└────┬─────┘
     │ 1. Write code
     │ 2. Click "Run"
     ▼
┌─────────────────┐
│   script.js     │
│  (Frontend)     │
└────┬────────────┘
     │ 3. POST /execute
     │    {code: "..."}
     ▼
┌─────────────────┐
│   main.go       │
│  (Go Server)    │
└────┬────────────┘
     │ 4. Check CORS
     │ 5. Route to handler
     ▼
┌─────────────────┐
│ handler/run.go  │
│                 │
└────┬────────────┘
     │ 6. Validate JSON
     │ 7. Check code not empty
     ▼
┌─────────────────┐
│ utils/file.go   │
│                 │
└────┬────────────┘
     │ 8. Create temp file
     │    /tmp/code123.bal
     ▼
┌─────────────────┐
│ utils/docker.go │
│                 │
└────┬────────────┘
     │ 9. Build Docker command
     │ 10. Set 30s timeout
     │ 11. Set resource limits
     ▼
┌─────────────────┐
│  Docker Engine  │
│                 │
└────┬────────────┘
     │ 12. Create container
     │ 13. Mount file (read-only)
     │ 14. Execute: bal run
     ▼
┌─────────────────┐
│   Ballerina     │
│   Container     │
└────┬────────────┘
     │ 15. Compile code
     │ 16. Execute
     │ 17. Generate output
     ▼
┌─────────────────┐
│  Docker Engine  │
│                 │
└────┬────────────┘
     │ 18. Capture stdout
     │ 19. Capture stderr
     │ 20. Destroy container
     ▼
┌─────────────────┐
│ utils/docker.go │
│                 │
└────┬────────────┘
     │ 21. Check timeout
     │ 22. Handle errors
     │ 23. Return output
     ▼
┌─────────────────┐
│ handler/run.go  │
│                 │
└────┬────────────┘
     │ 24. Build JSON response
     │     {output: "...", error: ""}
     ▼
┌─────────────────┐
│   main.go       │
│                 │
└────┬────────────┘
     │ 25. Add CORS headers
     │ 26. Send HTTP response
     ▼
┌─────────────────┐
│   script.js     │
│                 │
└────┬────────────┘
     │ 27. Parse JSON
     │ 28. Update UI
     ▼
┌──────────┐
│   USER   │
│ sees     │
│ output   │
└──────────┘
```

## 🛡️ Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Security Layers                                │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Frontend Validation
┌─────────────────────────────────────────────────────────────────────┐
│ • Check for empty code                                               │
│ • Basic syntax validation (future enhancement)                       │
│ • Code size limits (future enhancement)                              │
└─────────────────────────────────────────────────────────────────────┘

Layer 2: Network Security
┌─────────────────────────────────────────────────────────────────────┐
│ • CORS enabled (Access-Control-Allow-Origin)                         │
│ • POST only (no GET for code execution)                              │
│ • JSON validation                                                    │
└─────────────────────────────────────────────────────────────────────┘

Layer 3: Backend Validation
┌─────────────────────────────────────────────────────────────────────┐
│ • Request method validation                                          │
│ • JSON structure validation                                          │
│ • Code content validation                                            │
│ • Input sanitization                                                 │
└─────────────────────────────────────────────────────────────────────┘

Layer 4: Resource Management
┌─────────────────────────────────────────────────────────────────────┐
│ • Temporary file creation                                            │
│ • Automatic cleanup (defer os.Remove)                                │
│ • Unique filenames                                                   │
└─────────────────────────────────────────────────────────────────────┘

Layer 5: Execution Timeout
┌─────────────────────────────────────────────────────────────────────┐
│ • 30 second context timeout                                          │
│ • Prevents infinite loops                                            │
│ • Kills long-running processes                                       │
└─────────────────────────────────────────────────────────────────────┘

Layer 6: Docker Isolation
┌─────────────────────────────────────────────────────────────────────┐
│ • --network none        → No internet access                         │
│ • --memory 256m         → RAM limit                                  │
│ • --cpus 0.5            → CPU limit                                  │
│ • --pids-limit 50       → Process limit                              │
│ • Read-only mount       → No file modifications                      │
│ • --rm flag             → Auto-cleanup                               │
└─────────────────────────────────────────────────────────────────────┘

Layer 7: Container Isolation
┌─────────────────────────────────────────────────────────────────────┐
│ • Separate namespace                                                 │
│ • Isolated filesystem                                                │
│ • Isolated process tree                                              │
│ • No access to host system                                           │
└─────────────────────────────────────────────────────────────────────┘
```

##  Data Flow Diagram

```
Input: User Code
      │
      ▼
┌─────────────┐
│  Validate   │ ─── Empty? ───→ Return Error
└──────┬──────┘
       │ Valid
       ▼
┌─────────────┐
│ Save to     │
│ Temp File   │
│ /tmp/xyz.bal│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Build      │
│  Docker CMD │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Execute    │ ─── Timeout? ──→ Kill & Return Error
│  in Docker  │
└──────┬──────┘
       │ Success
       ▼
┌─────────────┐
│  Capture    │ ─── stdout ──→ Output
│  Output     │ ─── stderr ──→ Error
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Cleanup    │
│  Temp File  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Return     │
│  JSON       │
│ {output,err}│
└──────┬──────┘
       │
       ▼
Output: Display to User
```

## 🗂️ File Structure & Responsibilities

```
ballerina-online-playground/
│
├── frontend/                    # Client-side application
│   ├── index.html              # UI structure
│   │   ├── <header>            → Logo, title, buttons
│   │   ├── <main>              → Code editor + output panel
│   │   └── <footer>            → Credits, links
│   │
│   ├── script.js               # Client logic
│   │   ├── runButton handler   → Send code to backend
│   │   ├── clearButton handler → Reset UI
│   │   ├── Error handling      → Display errors
│   │   └── API communication   → fetch() calls
│   │
│   └── style.css               # Styling
│       ├── Layout (flexbox)    → Two-panel design
│       ├── Theme (teal)        → Colors, fonts
│       └── Responsive          → Mobile support
│
└── backend/                    # Server-side application
    │
    ├── main.go                 # Entry point
    │   ├── HTTP server setup   → Port 8081
    │   ├── Route definitions   → /run, /compile, /execute
    │   └── CORS middleware     → Security headers
    │
    ├── handler/                # Request handlers
    │   ├── run.go             # Execute code
    │   │   ├── Validate req   → Check JSON
    │   │   ├── Save to file   → Call utils
    │   │   ├── Run in Docker  → Execute
    │   │   └── Return result  → JSON response
    │   │
    │   └── compile.go         # Compile only (no run)
    │       └── Same as run.go but 'bal build'
    │
    └── utils/                  # Utility functions
        ├── docker.go          # Docker execution
        │   ├── RunInDocker()  → Main execution
        │   ├── Timeout setup  → 30s context
        │   ├── Resource limits → CPU, memory
        │   └── Error handling → Capture stderr
        │
        └── file.go            # File operations
            └── SaveToTempFile() → Create /tmp/code.bal
```

## 🔌 API Contract

### Endpoint: POST /execute

**Request:**
```json
{
  "code": "import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello\");\n}"
}
```

**Response (Success):**
```json
{
  "output": "Hello\n",
  "error": ""
}
```

**Response (Error):**
```json
{
  "output": "",
  "error": "ERROR: [main.bal:(1:1,1:7)] undefined module 'ballerin'"
}
```

**Response (Timeout):**
```json
{
  "output": "",
  "error": "execution timeout: code took longer than 30 seconds"
}
```

## ⚙️ Configuration Points

```
Frontend Configuration:
├── API_URL              → Backend server URL (script.js)
├── Sample code          → Default code shown (script.js)
└── Theme colors         → CSS variables (style.css)

Backend Configuration:
├── Server port          → :8081 (main.go)
├── CORS origin          → "*" (main.go)
├── Execution timeout    → 30s (utils/docker.go)
├── Memory limit         → 256m (utils/docker.go)
├── CPU limit            → 0.5 (utils/docker.go)
├── Process limit        → 50 (utils/docker.go)
└── Docker image         → ballerina/ballerina:latest (handler/run.go)
```

## Deployment Architecture

```
Production Deployment Options:

Option 1: Monolithic
┌─────────────────────────────────────┐
│  Server (EC2/Droplet)               │
│  ┌─────────────────────────────┐   │
│  │  Nginx (Port 80/443)        │   │
│  │  ├── /        → Frontend    │   │
│  │  └── /api/*   → Backend     │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Go Backend (Port 8081)     │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Docker Engine              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Option 2: Containerized
┌─────────────────────────────────────┐
│  Docker Compose                     │
│  ┌─────────────────────────────┐   │
│  │  frontend (Nginx)           │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  backend (Go)               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  ballerina (Image)          │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Option 3: Serverless
┌─────────────────────────────────────┐
│  Frontend: GitHub Pages/Netlify    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Backend: AWS Lambda/Cloud Func    │
│  (with Docker runtime)              │
└─────────────────────────────────────┘
```

##  Scaling Considerations

```
Single Server Setup (Current):
• 1-100 concurrent users
• Sequential execution
• Shared resources

Scaled Setup (Future):
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
   ┌───┴───┬────────┬────────┐
   ▼       ▼        ▼        ▼
┌──────┐┌──────┐┌──────┐┌──────┐
│Server││Server││Server││Server│
│  1   ││  2   ││  3   ││  4   │
└──────┘└──────┘└──────┘└──────┘
Each with own Docker engine
• 1000+ concurrent users
• Parallel execution
• Distributed resources
```

---

## 🎓 Key Architectural Decisions

### Why Go for Backend?
- Fast HTTP server
- Excellent concurrency
- Single binary deployment
- Great Docker SDK support

### Why Docker for Execution?
- Complete isolation
- Resource control
- Easy to manage
- Industry standard

### Why No Database?
- Stateless execution
- No user data to store
- Simpler architecture
- Lower maintenance

### Why CORS Enabled?
- Frontend-backend separation
- Easier development
- Flexible deployment

---

This architecture provides a **secure, scalable, and maintainable** solution for running user code online!
