# 🏗️ Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         BALLERINA ONLINE PLAYGROUND                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                             USER'S BROWSER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  https://YOUR_USERNAME.github.io/ballerina-online-playground/       │  │
│  │                                                                     │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐          │  │  |
│  │  │   Header    │  │ Code Editor  │  │  Output Panel   │          │  │  |
│  │  │   (React)   │  │  (CodeMirror)│  │     (React)     │          │  │  |
│  │  └─────────────┘  └──────────────┘  └─────────────────┘          │  │  |
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ HTTPS
                                │
                    ┌───────────▼──────────┐
                    │   GitHub CDN Edge    │
                    │    (Automatic)       │
                    └──────────────────────┘
                                │
                                │
        ┌───────────────────────┴──────────────────────┐
        │                                              │
        │         FRONTEND DEPLOYMENT FLOW             │
        │                                              │
        │  ┌─────────────────────────────────────────┐ │
        │  │  1. Developer pushes to GitHub          │ │
        │  │     git push origin main                │ │
        │  └─────────────┬───────────────────────────┘ │
        │                │                             │
        │  ┌─────────────▼───────────────────────────┐ │
        │  │  2. GitHub Actions Triggers             │ │
        │  │     - npm install                       │ │
        │  │     - npm run build                     │ │
        │  │     - Build with VITE_API_URL           │ │
        │  └─────────────┬───────────────────────────┘ │
        │                │                             │
        │  ┌─────────────▼───────────────────────────┐ │
        │  │  3. Deploy to GitHub Pages              │ │
        │  │     - Upload dist/ folder               │ │
        │  │     - Publish to github.io              │ │
        │  └─────────────────────────────────────────┘ │
        └──────────────────────────────────────────────┘


                    API REQUEST (POST /run)
                    ─────────────────────►

┌───────────────────────────────────────────────────────────────────────────┐
│                       AWS EC2 INSTANCE (Ubuntu)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    NGINX Reverse Proxy (Port 80)                    │  │
│  │  - Rate limiting (10 req/s)                                         │  │
│  │  - CORS headers                                                     │  │
│  │  - SSL termination (if configured)                                  │  │
│  │  - Security headers                                                 │  │
│  └────────────────────────┬────────────────────────────────────────────┘  │
│                           │                                               │
│                           │ Proxy to localhost:8081                       │
│                           │                                               │
│  ┌────────────────────────▼───────────────────────────────────────────┐   │
│  │              Docker Container: Backend (Port 8081)                 │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Go API Server                              │ │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐  │ │   │
│  │  │  │  Endpoints:                                             │  │ │   │
│  │  │  │  - POST /run        (Execute Ballerina code)            │  │ │   │
│  │  │  │  - POST /compile    (Compile Ballerina code)            │  │ │   │
│  │  │  │  - GET  /health     (Health check)                      │  │ │   │
│  │  │  └─────────────────────────────────────────────────────────┘  │ │   │
│  │  │                                                               │ │   │
│  │  │  Middleware Chain:                                            │ │   │
│  │  │  → CORS → Performance → Logging → Handler                     │ │   │
│  │  └───────────────────────┬───────────────────────────────────────┘ │   │
│  │                          │                                         │   │
│  │                          │ Spawn Docker Container                  │   │
│  │                          │                                         │   │
│  │  ┌───────────────────────▼───────────────────────────────────────┐ │   │
│  │  │      Ballerina Execution Container (Temporary)                │ │   │
│  │  │  ┌───────────────────────────────────────────────────────┐    │ │   │
│  │  │  │  Image: ballerina/ballerina:2201.10.2                 │    │ │   │
│  │  │  │  Command: bal run main.bal                            │    │ │   │
│  │  │  │  Resources:                                           │    │ │   │
│  │  │  │  - Memory: 512MB                                      │    │ │   │
│  │  │  │  - CPU: 1.0 core                                      │    │ │   │
│  │  │  │  - Network: none (isolated)                           │    │ │   │
│  │  │  │  - Timeout: 30 seconds                                │    │ │   │
│  │  │  └───────────────────────────────────────────────────────┘    │ │   │
│  │  │                                                               │ │   │
│  │  │  Returns: stdout + stderr                                     │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  Storage:                                                                 │
│  - /tmp/ballerina-playground (temporary code files)                       │
│  - /var/run/docker.sock (Docker daemon socket)                            │
│                                                                           │
│  Resources:                                                               │
│  - t3.medium (2 vCPU, 4GB RAM)                                            │
│  - 20GB SSD storage                                                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

                    API RESPONSE (JSON)
                    ◄─────────────────────

┌───────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE FLOW                                     │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Backend Response (JSON):                                           │  │
│  │  {                                                                  │  │
│  │    "output": "Hello, Ballerina!\nResult: 20\nWelcome, Developer!",  │  │
│  │    "error": ""                                                      │  │
│  │  }                                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Frontend displays output in OutputPanel component                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                        DEPLOYMENT COMPONENTS
═══════════════════════════════════════════════════════════════════════════

Frontend (GitHub Pages):
├── Static HTML/CSS/JS files
├── React application (built)
├── CodeMirror editor
├── Vite build system
└── Served via GitHub CDN

Backend (AWS EC2):
├── Ubuntu 22.04 LTS
├── Docker Engine
├── Docker Compose
├── Nginx (reverse proxy)
├── UFW Firewall
├── Systemd service (auto-start)
└── Go API server

Security:
├── CORS configuration
├── Rate limiting (Nginx)
├── Resource limits (Docker)
├── Network isolation (Ballerina containers)
├── Security headers
└── Firewall rules (AWS Security Groups + UFW)

Monitoring:
├── Health checks (Docker + Nginx)
├── Log rotation
├── Docker stats
└── System logs (journalctl)


═══════════════════════════════════════════════════════════════════════════
                            DATA FLOW
═══════════════════════════════════════════════════════════════════════════

1. User writes Ballerina code in browser
   └─► Code stored in React state

2. User clicks "Run" button
   └─► POST request to EC2 backend

3. Nginx receives request
   └─► Checks rate limit
   └─► Adds security headers
   └─► Forwards to Go API (localhost:8081)

4. Go API receives request
   └─► CORS middleware validates origin
   └─► Performance middleware adds headers
   └─► Logging middleware records request
   └─► Handler processes request

5. Handler creates Ballerina package
   └─► Creates temp directory
   └─► Writes Ballerina.toml
   └─► Writes main.bal with user code

6. Docker container spawned
   └─► Mounts temp directory
   └─► Runs: bal run main.bal
   └─► Captures stdout/stderr
   └─► Container auto-removed after execution

7. Response sent back to frontend
   └─► JSON: {output, error}
   └─► Through Nginx
   └─► Through GitHub Pages CDN
   └─► To user's browser

8. Frontend displays result
   └─► Output shown in OutputPanel
   └─► Errors shown in red


═══════════════════════════════════════════════════════════════════════════
                       NETWORK CONFIGURATION
═══════════════════════════════════════════════════════════════════════════

AWS Security Group (EC2):
├── Port 22  (SSH)     - Your IP only
├── Port 80  (HTTP)    - 0.0.0.0/0 (public)
└── Port 8081 (API)    - 0.0.0.0/0 (public, or via Nginx on 80)

UFW Firewall (EC2):
├── Port 22  - Allow
├── Port 80  - Allow
└── Port 8081 - Allow

GitHub Pages:
└── Automatic HTTPS via GitHub CDN


═══════════════════════════════════════════════════════════════════════════
                        COST BREAKDOWN
═══════════════════════════════════════════════════════════════════════════

AWS EC2 (t3.medium):
├── Instance: $30-35/month
├── Elastic IP: $0 (when associated)
├── Data Transfer: First 100GB free, then $0.09/GB
└── Storage (20GB): Included

GitHub Pages:
└── $0 (free for public repos)

Total: ~$30-35/month


═══════════════════════════════════════════════════════════════════════════
                    PERFORMANCE CHARACTERISTICS
═══════════════════════════════════════════════════════════════════════════

Frontend (GitHub Pages):
├── Page Load: < 3 seconds
├── Global CDN distribution
└── Unlimited bandwidth

Backend (EC2):
├── Code Execution: < 5 seconds
├── Container Spin-up: ~2-3 seconds
├── Concurrent Users: 50-100 (with rate limiting)
└── Request Timeout: 30 seconds

Optimization Features:
├── Gzip compression
├── Static asset caching (1 year)
├── Docker image caching
├── Nginx worker optimization
└── HTTP/2 support (with SSL)
```
