# Ballerina Online Playground - Backend Architecture Flow

## System Startup and Initialization

Based on the terminal logs, here's the detailed backend architecture flow for the Ballerina Online Playground:

```
┌─────────────────────────────────────────────────────────────────┐
│                  Backend Initialization Flow                    │
└─────────────────────────────────────────────────────────────────┘

1. Docker Compose starts backend container
   ↓
2. Backend service starts on port 8081
   ↓
3. Container Pool Initialization
   │
   ├── Phase 1: Pre-pull 26 Ballerina Docker images
   │   • Images from 2201.3.0 to 2201.12.0
   │   • Parallel pulling to optimize startup time
   │   • Takes ~10 minutes to complete
   │
   ├── Phase 2: Create container pools
   │   • 62 total containers across all versions
   │   • Resource allocation based on version popularity
   │   • More containers (4-6) for newer versions
   │   • Fewer containers (2) for older versions
   │
   └── Phase 3: Warm up containers
       • Pre-compile dummy code in each container
       • Measure file copy performance
       • Prepare containers for immediate use
```

## Container Pool Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Container Pool Management                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Version     │     │ Version     │     │ Version     │
│ 2201.12.0   │     │ 2201.11.0   │     │ 2201.10.5   │
│ (6 containers) │  │ (4 containers) │  │ (4 containers) │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Version     │     │ Version     │     │ Version     │
│ 2201.10.0   │     │ 2201.9.0    │     │ 2201.8.x    │
│ (3 containers) │  │ (3 containers) │  │ (2 containers) │
└─────────────┘     └─────────────┘     └─────────────┘

     ... and so on for all 26 supported versions ...

Container Allocation Strategy:
• Latest versions (2201.12.0): 6 containers
• Recent versions (2201.11.0): 4 containers 
• Older versions: 2-3 containers
• Based on system memory (4GB detected)
```

## Execution Flow for Code Requests

```
┌─────────────────────────────────────────────────────────────────┐
│                Request Processing Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. HTTP Request
   • POST /execute with code and Ballerina version
   ↓
2. Rate Limit Check
   • 5 requests per 5 seconds per client
   ↓
3. Code Validation
   • Size checks
   • Security scanning
   ↓
4. Container Acquisition
   • Get pre-warmed container from pool for requested version
   ↓
5. File Operations
   • CreateBallerinaPackage() creates proper package structure
   • Write code to main.bal in package
   • Copy files to container volume
   ↓
6. Code Execution
   • Run code in isolated container
   • Capture stdout/stderr
   • Apply 60-second timeout
   ↓
7. Response Generation
   • Format output and errors
   • Return as JSON response
   ↓
8. Container Management
   • Return container to pool for reuse
   • Clean up temporary files
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Security Implementation                       │
└─────────────────────────────────────────────────────────────────┘

Request Level Security
• Rate limiting: 5 requests per 5 seconds
• Input validation and sanitization
• Maximum code size enforcement

Container Level Security
• Network disabled (--network none)
• Resource limits enforced:
  - Memory limits
  - CPU limits 
  - Process limits
• Read-only filesystem except for code directory
• 60-second execution timeout

System Level Security
• Non-root user execution (appuser:appgroup, uid:10014)
• Isolated Docker daemon access
• Dedicated container per request
• Clean container state between executions
```

## File System Operations

```
┌─────────────────────────────────────────────────────────────────┐
│                   File Operations Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. Temporary Directory Creation
   • Create temp directory with proper permissions
   ↓
2. Ballerina Package Structure
   • Create Ballerina.toml with optimized settings:
     org = "playground"
     name = "playground" 
     version = "0.1.0"
     distribution = "<version>"
     [build-options]
     observabilityIncluded = false
     offline = true
   ↓
3. Source File Creation
   • Write user code to main.bal
   ↓
4. Container Mount
   • Mount directory into container at /home/ballerina/code
   ↓
5. Execution
   • cd /home/ballerina/code && bal run --offline main.bal
   ↓
6. Cleanup
   • Remove temporary files and directories
```

## Networking and Exposure

```
┌─────────────────────────────────────────────────────────────────┐
│                 External Access Architecture                    │
└─────────────────────────────────────────────────────────────────┘

Internal Service
• Go backend running on port 8081
• Docker container networking
↓
Cloudflare Tunnel
• Cloudflared agent running in screen session
• Establishes secure outbound connection to Cloudflare
↓
Public Endpoint
• https://acceptance-brakes-sort-drawn.trycloudflare.com
• TLS termination at Cloudflare
• No inbound ports opened on server
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────────┐
│                 Performance Optimizations                       │
└─────────────────────────────────────────────────────────────────┘

1. Container Pooling
   • Pre-created containers avoid startup overhead
   • Version-specific allocation based on popularity

2. Container Warming
   • Pre-compiled Ballerina runtime in each container
   • First request performance improvement

3. File System Performance
   • Measured file copy operations (~150-800ms)
   • Optimized package structure 

4. Build Options
   • offline = true to avoid network dependencies
   • observabilityIncluded = false for smaller builds
```

## Complete System Design

The backend architecture represents a highly optimized containerized execution environment for Ballerina code, with careful attention to:

1. **Security**: Multi-layered isolation prevents harmful code execution
2. **Performance**: Container pooling and pre-warming reduces execution latency
3. **Scalability**: Version-specific resource allocation maximizes server utilization
4. **Reliability**: Clean container state for each execution prevents cross-request interference

This design allows the Ballerina Online Playground to securely execute user-submitted code while maintaining good performance and isolation between requests.
