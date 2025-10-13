# Ballerina Online Playground - Backend System Architecture Flow

## Overview Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Go Backend Server                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       main.go                             │  │
│  │  • HTTP server initialization                             │  │
│  │  • Route configuration                                    │  │
│  │  • Docker client initialization                           │  │
│  │  • Environment setup                                      │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Middleware                             │  │
│  │  • CORS handling                                          │  │
│  │  • Rate limiting (middleware/ratelimit.go)                │  │
│  │  • Request validation                                     │  │
│  │  • Error handling                                         │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 Request Handlers                          │  │
│  │  • /compile (handler/compile.go)                          │  │
│  │  • /run (handler/run.go)                                  │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Container Management                         │  │
│  │  • container_pool.go: Manages Docker container pool       │  │
│  │  • docker.go: Docker operations interface                 │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                File Operations                            │  │
│  │  • file.go: Temporary file and package management         │  │
│  │  • validator.go: Code validation utilities                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Execution Flow

### 1. HTTP Request Handling

```
┌───────────┐          ┌───────────┐          ┌───────────┐
│  Client   │          │  Server   │          │ Middleware│
└─────┬─────┘          └─────┬─────┘          └─────┬─────┘
      │                      │                      │
      │ POST /run            │                      │
      │ {code, version}      │                      │
      │─────────────────────>│                      │
      │                      │                      │
      │                      │ Request              │
      │                      │─────────────────────>│
      │                      │                      │
      │                      │                      │ Rate limit check
      │                      │                      │───────┐
      │                      │                      │       │
      │                      │                      │<──────┘
      │                      │                      │
      │                      │ Validated request    │
      │                      │<─────────────────────│
      │                      │                      │
      │                      │                      │
```

### 2. Code Validation and Execution Process

```
┌───────────┐        ┌───────────┐        ┌───────────┐        ┌───────────┐
│  Handler  │        │ Validator │        │ FileUtils │        │ DockerSvc │
└─────┬─────┘        └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
      │                    │                    │                    │
      │ Parse request      │                    │                    │
      │────────┐           │                    │                    │
      │        │           │                    │                    │
      │<───────┘           │                    │                    │
      │                    │                    │                    │
      │ Validate code      │                    │                    │
      │───────────────────>│                    │                    │
      │                    │                    │                    │
      │ Validation result  │                    │                    │
      │<───────────────────│                    │                    │
      │                    │                    │                    │
      │ Create package     │                    │                    │
      │───────────────────────────────────────> │                    │
      │                    │                    │                    │
      │                    │                    │ Create temp dir    │
      │                    │                    │────────┐           │
      │                    │                    │        │           │
      │                    │                    │<───────┘           │
      │                    │                    │                    │
      │                    │                    │ Write Ballerina.toml│
      │                    │                    │────────┐           │
      │                    │                    │        │           │
      │                    │                    │<───────┘           │
      │                    │                    │                    │
      │                    │                    │ Write main.bal     │
      │                    │                    │────────┐           │
      │                    │                    │        │           │
      │                    │                    │<───────┘           │
      │                    │                    │                    │
      │ Package path       │                    │                    │
      │<────────────────────────────────────-───│                    │
      │                    │                    │                    │
      │ Execute in container                    │                    │
      │─────────────────────────────────────────────────--──────────>│
      │                    │                    │                    │
      │                    │                    │                    │ Pull image
      │                    │                    │                    │────────┐
      │                    │                    │                    │        │
      │                    │                    │                    │<───────┘
      │                    │                    │                    │
      │                    │                    │                    │ Create container
      │                    │                    │                    │────────┐
      │                    │                    │                    │        │
      │                    │                    │                    │<───────┘
      │                    │                    │                    │
      │                    │                    │                    │ Mount volume
      │                    │                    │                    │────────┐
      │                    │                    │                    │        │
      │                    │                    │                    │<───────┘
      │                    │                    │                    │
      │                    │                    │                    │ Start container
      │                    │                    │                    │────────┐
      │                    │                    │                    │        │
      │                    │                    │                    │<───────┘
      │                    │                    │                    │
      │                    │                    │                    │ Capture output
      │                    │                    │                    │────────┐
      │                    │                    │                    │        │
      │                    │                    │                    │<───────┘
      │                    │                    │                    │
      │ Execution result   │                    │                    │
      │<──────────────────────────────────────--─────────────────────│
      │                    │                    │                    │
      │ Cleanup temp files │                    │                    │
      │────────────────────────────-───────────>│                    │
      │                    │                    │                    │
```

### 3. Docker Container Execution Details

```
┌───────────────────────────────────────────────────────────────┐
│                 Container Creation Process                    │
└───────────────────────────────────────────────────────────────┘

1. Pull Ballerina Docker image for requested version
   • ballerina/ballerina:<version>

2. Configure container with security constraints:
   • --network none (no network access)
   • --memory=256m (memory limit)
   • --cpus=0.5 (CPU limit)
   • --pids-limit=50 (process limit)
   • --read-only (read-only filesystem except mounted volumes)
   • --mount type=bind,src=<temp_dir>,dst=/home/ballerina/code
   • --ulimit nofile=64:64 (file descriptor limit)
   • --ulimit nproc=50:50 (process limit)

3. Set execution timeout (30 seconds)

4. Execute command in container:
   • cd /home/ballerina/code && bal run --offline main.bal

5. Capture stdout and stderr

6. Remove container after execution
```

### 4. File System Management

```
┌───────────────────────────────────────────────────────────────┐
│                 File System Operations                        │
└───────────────────────────────────────────────────────────────┘

1. Temporary Directory Creation
   • Use TEMP_DIR environment variable or system temp directory
   • Create directory with permissions 0777
   • Structure: ballerina-pkg-{random}

2. Ballerina Package Structure
   • Ballerina.toml - Project configuration
     - org = "playground"
     - name = "playground" 
     - version = "0.1.0"
     - Build options for optimization
   • main.bal - User submitted code

3. Cleanup Process
   • After execution, delete temporary directory
   • Handle cleanup errors gracefully
```

### 5. Error Handling and Response Flow

```
┌───────────────────────────────────────────────────────────────┐
│                 Error Handling Process                        │
└───────────────────────────────────────────────────────────────┘

1. Request Validation Errors
   • Invalid JSON format → 400 Bad Request
   • Code size exceeds limit → 413 Payload Too Large
   • Rate limit exceeded → 429 Too Many Requests

2. Execution Errors
   • Ballerina compilation errors → 200 OK with error message
   • Container creation failure → 500 Internal Server Error
   • Execution timeout → 200 OK with timeout message

3. Response Format
   • Success: {"output": "...", "error": ""}
   • Compile Error: {"output": "", "error": "compilation error..."}
   • Runtime Error: {"output": "partial output...", "error": "runtime error..."}
   • System Error: {"output": "", "error": "Internal server error"}
```

## Key Components and Responsibilities

### 1. Main Entry Point (`main.go`)

- Server initialization and configuration
- Route registration
- Docker client setup
- Environment variables processing
- Signal handling for graceful shutdown

### 2. Handlers

- `compile.go`: Handles code compilation requests
- `run.go`: Handles code execution requests
- Parses request body
- Coordinates validation, file operations, and Docker execution
- Formats and returns response

### 3. Container Management

- `docker.go`: Docker operations wrapper
- `container_pool.go`: Pre-initialization of containers for performance
- Image pulling and caching
- Resource constraint enforcement
- Execution timeout management

### 4. File System Operations (file.go)

- Temporary file and directory management
- Ballerina package structure creation
- File cleanup operations
- Secure file permission handling

### 5. Validation (`validator.go`)

- Code size validation
- Syntax pre-validation
- Security checks for prohibited operations
- Input sanitization

## Security Measures

1. **Container Isolation**

   - Network access disabled
   - Memory limited to 256MB
   - CPU limited to 0.5 cores
   - Process count limited to 50
   - Read-only filesystem except for code directory
   - File descriptor limits
2. **Request Validation**

   - Rate limiting by IP address
   - Maximum code size enforcement
   - Input sanitization
3. **Resource Management**

   - Execution timeout (30 seconds)
   - Container cleanup after execution
   - Temporary file cleanup
4. **Error Handling**

   - Graceful handling of all error conditions
   - Limited error details in responses to prevent information leakage

This backend architecture provides a secure, efficient way to execute user-provided Ballerina code in an isolated environment, with proper resource constraints and error handling.



## Overview

The Ballerina Online Playground is a web application that allows users to write, compile, and execute Ballerina code in their browser. The system follows a client-server architecture with frontend running React/Vite and backend running Go, with Docker for secure code execution.

## System Components

### 1. Frontend Architecture (React + Vite)

```
v  ┌──────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Header   │  │  CodeEditor  │  │ OutputPanel  │             │
│  └────────────┘  └──────────────┘  └──────────────┘             │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐           │
│  │            ResizablePanels                       │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOOKS LAYER                                │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│  │   useTheme      │  │  useFullscreen   │  │useCodeExecution│  │
│  └─────────────────┘  └──────────────────┘  └───────────────┘   │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│  │ useBallerinaVer │  │useResizablePanels│  │useLocalStorage│   │
│  └─────────────────┘  └──────────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│                                                                 │
│  ┌────────────────────┐  ┌─────────────────────┐                │
│  │   apiService       │  │  fullscreenService  │                │
│  │  ・executeCode()    │  │  ・enter()/exit()   │                │
│  └────────────────────┘  └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Components:

- **Components**: UI elements (`Header`, `CodeEditor`, `OutputPanel`, `VersionSelector`)
- **Hooks**: State management (`useCodeExecution`, `useBallerinaVersion`)
- **Services**: API communication (`api.service.js`)
- **Utils**: Helper functions (`ballerina-validator.util.js`)

### 2. Backend Architecture (Go)

```
┌─────────────────────────────────────────────────────────────────┐
│                       Go Backend Server                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       main.go                             │  │
│  │  • HTTP server setup (Port 8081)                          │  │
│  │  • Middleware chain                                       │  │
│  │  • Route handlers                                         │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               Middleware Chain                            │  │
│  │  • CORS → Performance → Logging → Handler                 │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │             handler/run.go, handler/compile.go            │  │
│  │  • Parse request                                          │  │
│  │  • Validate code                                          │  │
│  │  • Create temp files                                      │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            utils/docker.go, utils/file.go                 │  │
│  │  • Save code to file                                      │  │
│  │  • Execute in Docker container                            │  │
│  │  • Return output/errors                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Components:

- **Main Entry**: `main.go` - Sets up HTTP server, routes, and middleware
- **Handlers**: `run.go`, `compile.go` - Process API requests
- **Utilities**: `docker.go`, `file.go` - Execute code in containers
- **Middleware**: CORS, rate limiting, logging

### 3. Docker Execution Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                Docker Engine (Host Machine)                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  utils/docker.go                                          │  │
│  │  • Ballerina container execution                          │  │
│  │  • Security constraints                                   │  │
│  │    - No network access                                    │  │
│  │    - Memory limit (256MB)                                 │  │
│  │    - CPU limit (0.5 cores)                                │  │
│  │    - Process limit (50)                                   │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │             Ballerina Execution Container                 │  │
│  │  • ballerina/ballerina:<version> image                    │  │
│  │  • Executes: bal run main.bal                             │  │
│  │  • Captures stdout/stderr                                 │  │
│  │  • Container removed after execution                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

```
┌──────────┐         ┌───────────┐         ┌───────────┐         ┌───────────┐
│  User    │         │  Frontend │         │  Backend  │         │  Docker   │
└────┬─────┘         └─────┬─────┘         └─────┬─────┘         └─────┬─────┘
     │                     │                     │                     │
     │ 1. Write code       │                     │                     │
     │ & select version    │                     │                     │
     ├────────────────────>│                     │                     │
     │                     │                     │                     │
     │ 2. Click Run        │                     │                     │
     ├────────────────────>│                     │                     │
     │                     │                     │                     │
     │                     │ 3. POST /execute    │                     │
     │                     │ {code, version}     │                     │
     │                     ├────────────────────>│                     │
     │                     │                     │                     │
     │                     │                     │ 4. Save code to file│
     │                     │                     ├────────────────────>│
     │                     │                     │                     │
     │                     │                     │ 5. Run container    │
     │                     │                     │ with version image  │
     │                     │                     ├────────────────────>│
     │                     │                     │                     │
     │                     │                     │ 6. Execute code     │
     │                     │                     │<───────────-────────┤
     │                     │                     │                     │
     │                     │ 7. Return output    │                     │
     │                     │ {output, error}     │                     │
     │                     │<────────────────────┤                     │
     │                     │                     │                     │
     │ 8. Display output   │                     │                     │
     │<────────────────────┤                     │                     │
     │                     │                     │                     │
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Security Layers                                │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Frontend Validation (ballerina-validator.util.js)
┌─────────────────────────────────────────────────────────────────────┐
│ • Code size limits (50KB max)                                       │
│ • Line count limits (1,000 lines)                                   │
│ • Forbidden imports detection                                       │
│ • Infinite loop detection                                           │
└─────────────────────────────────────────────────────────────────────┘

Layer 2: Network Security (main.go, middleware)
┌─────────────────────────────────────────────────────────────────────┐
│ • CORS configuration                                                │
│ • Rate limiting (5 req/5 seconds)                                   │
│ • Request validation                                                │
└─────────────────────────────────────────────────────────────────────┘

Layer 3: Docker Isolation (docker.go)
┌─────────────────────────────────────────────────────────────────────┐
│ • No network access (--network none)                                │
│ • Memory limit (256MB)                                              │
│ • CPU limit (0.5 core)                                              │
│ • Process limit (50)                                                │
│ • 30s execution timeout                                             │
│ • Read-only filesystem                                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Version Selector Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    Frontend State Management                       │
└────────────────────────────────────────────────────────────────────┘

useBallerinaVersion Hook
    ↓
┌─────────────────────────────────────────┐
│  useState(storedVersion)                │
│  • Current selected version in memory   │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  useLocalStorage('ballerina-version')   │
│  • Persisted version in browser storage │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  Header Component                       │
│  • Renders VersionSelector              │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  API Service                            │
│  • executeCode(code, version)           │
│  • Sends version to backend             │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
Option 1: Monolithic (EC2/VPS)
┌────────────────────────────────────────┐
│  Server                                │
│  ┌─────────────────────────────────┐   │
│  │  Nginx (Port 80/443)            │   │
│  │  • Reverse proxy                │   │
│  │  • Rate limiting                │   │
│  │  • CORS headers                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Go Backend (Port 8081)         │   │
│  │  • Code execution               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Docker Engine                  │   │
│  │  • Ballerina containers         │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘

Option 2: Containerized (Docker Compose)
┌────────────────────────────────────────┐
│  Docker Compose                        │
│  ┌─────────────────────────────────┐   │
│  │  frontend (Nginx)               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  backend (Go)                   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  ballerina (Images)             │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

## Key Files and Responsibilities

### Frontend

- `App.jsx`: Main application component, orchestrates all features
- `Header.jsx`: Contains controls, version selector
- `api.service.js`: Handles API communication with backend
- `useCodeExecution.js`: Manages code execution state and logic
- `useBallerinaVersion.js`: Manages selected Ballerina version

### Backend

- `main.go`: Entry point, HTTP server setup, middleware chain
- `handler/run.go`: Execute Ballerina code endpoint
- `utils/docker.go`: Manages Docker container execution
- `utils/file.go`: Handles file operations for code execution

## API Contract

### POST `/execute`

**Request:**

```json
{
  "code": "import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello\");\n}",
  "version": "2201.12.0"
}
```

**Response:**

```json
{
  "output": "Hello\n",
  "error": ""
}
```

## Performance and Security Features

- **Frontend Optimizations**: Code splitting, lazy loading, caching
- **Backend Security**: Docker isolation, resource limits, rate limiting
- **Resource Limits**: Memory (256MB), CPU (0.5 cores), processes (50)
- **Timeout Protection**: 30-second execution limit
- **Monitoring**: Health checks, Docker stats, system logs

This architecture provides a secure, scalable solution for running user code online with proper isolation and resource management.
