# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the Ballerina Online Playground to protect against malicious code execution and system vulnerabilities.

## Security Layers

### 1. Frontend Security Validation

**Location:** `frontend-vite/src/utils/ballerina-validator.util.js`

#### Implemented Protections:

- ✅ **Code Size Limits**: Maximum 50KB per submission
- ✅ **Line Count Limits**: Maximum 1,000 lines
- ✅ **Loop Count Limits**: Maximum 10 loops to prevent excessive iterations
- ✅ **Forbidden Imports Detection**: Blocks dangerous module imports
- ✅ **Infinite Loop Detection**: Prevents `while(true)` patterns
- ✅ **Java Interop Blocking**: Prevents Java interoperability

#### Forbidden Operations:

```javascript
❌ import ballerina/file      // File system access
❌ import ballerina/http      // HTTP operations
❌ import ballerina/tcp       // Network operations
❌ import ballerina/sql       // Database access
❌ import ballerina/java      // Java interop
❌ import ballerina/os        // OS operations
❌ @docker:                   // Docker annotations
❌ @kubernetes:               // Kubernetes annotations
```

### 2. Backend Security Validation

**Location:** `backend/utils/validator.go`

#### Comprehensive Code Analysis:

- ✅ **Input Size Validation**: Enforces 50KB maximum
- ✅ **Pattern Matching**: Regex-based detection of dangerous imports
- ✅ **Complexity Analysis**: Detects excessive functions and loops
- ✅ **Annotation Blocking**: Prevents deployment annotations
- ✅ **Output Sanitization**: Removes file paths and sensitive data

#### Security Functions:

```go
ValidateCode(code string) error
  - Checks code size, line count, forbidden patterns
  - Returns detailed error messages

SanitizeErrorOutput(output string) string
  - Removes file system paths
  - Redacts IP addresses
  - Masks usernames
```

### 3. Docker Container Isolation

**Location:** `backend/utils/docker.go`

#### Container Security Hardening:

```bash
docker run \
  --rm                                    # Auto-remove container
  --network none                          # No network access
  --memory 256m                           # Memory limit
  --memory-swap 256m                      # No swap
  --cpus 0.5                             # CPU limit
  --pids-limit 50                        # Process limit
  --read-only                            # Read-only filesystem
  --tmpfs /tmp:rw,noexec,nosuid,size=50m # Limited temp space
  --security-opt no-new-privileges       # No privilege escalation
  --cap-drop ALL                         # Drop all capabilities
  -u 65534:65534                         # Run as nobody user
  -v /path:/app:ro                       # Read-only mount
  ballerina/ballerina:2201.10.2
```

#### Key Security Features:

- ✅ **Network Isolation**: `--network none` prevents all network access
- ✅ **Resource Limits**: Prevents resource exhaustion attacks
- ✅ **Non-root User**: Runs as `nobody` (UID 65534)
- ✅ **Read-only Filesystem**: Prevents file modification
- ✅ **No Privilege Escalation**: Blocks privilege escalation attempts
- ✅ **Capability Dropping**: Removes all Linux capabilities
- ✅ **Execution Timeout**: 10-second maximum execution time

### 4. Rate Limiting

**Location:** `backend/middleware/ratelimit.go`

#### Token Bucket Implementation:

- ✅ **Rate**: 5 requests per 5 seconds per IP
- ✅ **Burst**: 5 requests burst capacity
- ✅ **Per-IP Tracking**: Individual limits per client
- ✅ **Automatic Cleanup**: Removes stale visitor data

#### Configuration:

```go
rateLimiter := NewRateLimiter(5*time.Second, 5)
```

### 5. HTTP Security Headers

**Location:** `backend/main.go`

#### Security Headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 6. Request Timeout & Size Limits

#### Server Configuration:

```go
ReadTimeout:    15 * time.Second
WriteTimeout:   15 * time.Second
IdleTimeout:    60 * time.Second
MaxHeaderBytes: 1 << 20  // 1 MB
```

## Attack Prevention Matrix


| Attack Type               | Prevention Method                       | Implementation                         |
| ------------------------- | --------------------------------------- | -------------------------------------- |
| **Remote Code Execution** | Docker isolation, network blocking      | `--network none`, no dangerous imports |
| **File System Access**    | Read-only filesystem, forbidden imports | `--read-only`, import validation       |
| **Network Attacks**       | Network disabled in containers          | `--network none`                       |
| **Resource Exhaustion**   | CPU/memory limits, timeouts             | `--memory 256m`, `--cpus 0.5`          |
| **Infinite Loops**        | Pattern detection, timeouts             | Regex validation, 10s timeout          |
| **Container Escape**      | Security options, capability drop       | `--cap-drop ALL`, `no-new-privileges`  |
| **DDoS**                  | Rate limiting                           | Token bucket algorithm                 |
| **SQL Injection**         | Import blocking                         | No database imports allowed            |
| **Path Traversal**        | Output sanitization                     | Path redaction in errors               |
| **Privilege Escalation**  | Non-root user, security opts            | `nobody` user, security options        |

## Remaining Risks & Mitigations

### Known Limitations:

1. **Local Resource Exhaustion**

   - **Risk**: Multiple simultaneous requests could overwhelm server
   - **Mitigation**: Rate limiting (5 req/5s per IP)
   - **Future**: Add global queue system
2. **Ballerina Language Bugs**

   - **Risk**: Unknown vulnerabilities in Ballerina runtime
   - **Mitigation**: Using stable version (2201.10.2)
   - **Future**: Regular version updates
3. **Docker Daemon Security**

   - **Risk**: Docker daemon vulnerabilities
   - **Mitigation**: Run backend in isolated environment
   - **Future**: Consider gVisor or Kata Containers

## Security Checklist

### Deployment Checklist:

- [ ]  Set `ALLOWED_ORIGIN` environment variable to your frontend domain
- [ ]  Run backend as non-root user
- [ ]  Use HTTPS for all communications
- [ ]  Enable firewall rules to restrict Docker daemon access
- [ ]  Implement logging and monitoring
- [ ]  Set up alerts for rate limit violations
- [ ]  Regular security audits
- [ ]  Keep Docker and dependencies updated
- [ ]  Implement request logging with IP tracking
- [ ]  Set up automated backups

### Monitoring:

```bash
# Monitor Docker container creation
docker events --filter 'event=create'

# Monitor rate limit violations (check application logs)
grep "rate limit exceeded" /var/log/ballerina-playground.log

# Monitor resource usage
docker stats
```

## 🔍 Testing Security

### Test Malicious Code:

```ballerina
// This should be blocked:
import ballerina/http;  // ❌ Blocked by validation

// This should be blocked:
import ballerina/file;  // ❌ Blocked by validation

// This should be blocked:
while (true) { }        // ❌ Blocked by infinite loop detection
```

### Test Rate Limiting:

```bash
# Send 10 requests rapidly
for i in {1..10}; do
  curl -X POST http://localhost:8081/run \
    -H "Content-Type: application/json" \
    -d '{"code":"import ballerina/io;\npublic function main() { io:println(\"test\"); }"}' &
done
```

## 📚 Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Code Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html)
- [Ballerina Security Documentation](https://ballerina.io/learn/security/)

---

**Last Updated:** October 10, 2025
**Security Version:** 1.0.0
**Status:** ✅ Production Ready
