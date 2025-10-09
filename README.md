# Ballerina Online Playground

A web-based interactive playground for writing and executing Ballerina code in real-time.

## 🏗️ Architecture

```
┌─────────────┐      HTTP POST      ┌──────────────┐      Docker API     ┌─────────────────-┐
│   Frontend  │ ─────────────────►  │   Go Backend │ ──────────────────► │  Ballerina       │
│  (HTML/JS)  │                     │   (Port 8081)│                     │  Docker Container│
└─────────────┘ ◄─────────────────  └──────────────┘ ◄────────────────── └────────────────-─┘
                   JSON Response                         Execution Output
```

## 🚀 Features

- ✅ Real-time Ballerina code execution
- ✅ Secure Docker-based sandboxed environment
- ✅ Resource limits (CPU, Memory, Network)
- ✅ Execution timeout protection (30s)
- ✅ Clean, modern UI
- ✅ Error handling and feedback

## 📋 Prerequisites

- **Docker** (for running Ballerina code in containers)
- **Go 1.23+** (for backend server)
- **Modern web browser** (for frontend)

## 🛠️ Setup & Installation

### 1. Clone the Repository

```bash
cd ballerina-online-playground
```

### 2. Pull Ballerina Docker Image

```bash
docker pull ballerina/ballerina:latest
```

### 3. Start the Backend Server

#### Option A: Using Go directly

```bash
cd backend
go mod download
go run main.go
```

The server will start on `http://localhost:8081`

#### Option B: Using Docker Compose

```bash
cd backend
docker-compose up --build
```

### 4. Open the Frontend

Simply open `frontend/index.html` in your web browser, or serve it using a simple HTTP server:

```bash
cd frontend
python3 -m http.server 3000
```

Then visit `http://localhost:3000`

## 📡 API Endpoints

### POST `/execute` or `/run`

Execute Ballerina code

**Request:**

```json
{
  "code": "import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello!\");\n}"
}
```

**Response:**

```json
{
  "output": "Hello!\n",
  "error": ""
}
```

### POST `/compile`

Compile Ballerina code (without execution)

Same request/response format as `/execute`

## 🔒 Security Features

1. **Network Isolation**: Containers run with `--network none`
2. **Resource Limits**:
   - Memory: 256MB max
   - CPU: 0.5 core max
   - Process limit: 50
3. **Execution Timeout**: 30 seconds max
4. **Read-only Filesystem**: Code mounted as read-only
5. **Temporary File Cleanup**: Auto-cleanup after execution

## 🧪 Testing

Test the backend API directly:

```bash
curl -X POST http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello, World!\");\n}"}'
```

## 📁 Project Structure

```
ballerina-online-playground/
├── backend/
│   ├── main.go              # Entry point, HTTP server setup
│   ├── handler/
│   │   ├── run.go          # Code execution handler
│   │   └── compile.go      # Code compilation handler
│   ├── utils/
│   │   ├── docker.go       # Docker execution utilities
│   │   └── file.go         # File handling utilities
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── go.mod
└── frontend/
    ├── index.html          # Main UI
    ├── script.js           # Frontend logic
    └── style.css           # Styling
```

## 🎯 Usage

1. **Write Code**: Enter your Ballerina code in the left panel
2. **Run Code**: Click the "Run" button
3. **View Output**: See the execution result in the right panel
4. **Clear**: Use the "Clear" button to reset

## 🐛 Troubleshooting

### "Connection Error" in Frontend

- Ensure backend server is running on port 8081
- Check CORS is enabled in backend

### "Docker not found"

- Install Docker Desktop
- Ensure Docker daemon is running
- Check `docker ps` works in terminal

### "Execution timeout"

- Code is taking longer than 30s
- Optimize your code or increase timeout in `utils/docker.go`

### "Permission denied"

- On Linux, add user to docker group: `sudo usermod -aG docker $USER`

## 🔧 Configuration

### Change Backend Port

Edit `backend/main.go`:

```go
log.Fatal(http.ListenAndServe(":8081", nil))  // Change 8081 to your port
```

Edit `frontend/script.js`:

```javascript
const API_URL = 'http://localhost:8081';  // Update to match
```

### Adjust Resource Limits

Edit `backend/utils/docker.go`:

```go
"--memory", "256m",   // Increase memory
"--cpus", "0.5",      // Increase CPU
```

### Change Execution Timeout

Edit `backend/utils/docker.go`:

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)  // Change 30s
```

## 🚀 Production Deployment

### Security Recommendations:

1. **CORS**: Change from `*` to specific domain in `main.go`
2. **Rate Limiting**: Add rate limiting middleware
3. **Authentication**: Add user authentication if needed
4. **HTTPS**: Use reverse proxy (nginx) with SSL
5. **Monitoring**: Add logging and monitoring tools

### Example nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:8081/;
        proxy_set_header Host $host;
    }

    location / {
        root /path/to/frontend;
        index index.html;
    }
}
```

## 📝 License

[Add your license here]

## 👨‍💻 Author

**Pramitha** - [GitHub](https://github.com/PramithaMJ)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
