# Concurrency & Multi-User Handling

## How Multiple Users are Handled

The Ballerina Online Playground is designed to handle multiple concurrent users safely and efficiently. Here's how it works:

### 1. **Isolated Execution Per Request**

Each user's code execution is completely isolated:

```
User A submits code → Creates unique temp dir (ballerina-pkg-123456)
User B submits code → Creates unique temp dir (ballerina-pkg-789012)
```

- **Unique Temporary Directories**: Each request creates a unique temporary directory using `os.MkdirTemp()` with a random suffix
- **File System Isolation**: Each user's code is stored in their own directory under `/tmp/ballerina-playground/`
- **Automatic Cleanup**: Directories are automatically cleaned up after execution using `defer os.RemoveAll()`

### 2. **Docker Container Isolation**

Each code execution runs in its own Docker container:

```go
docker run --rm \
  --network none \          # Network isolation
  --memory 512m \            # Memory limit per container
  --cpus 1.0 \              # CPU limit per container
  --pids-limit 50 \         # Process limit
  -v /path/to/user-code:/home/ballerina/app \
  ballerina/ballerina:latest bal run
```

**Key Isolation Features:**
- ✅ **Process Isolation**: Each container is a separate process
- ✅ **Network Isolation**: `--network none` prevents network access
- ✅ **Resource Limits**: Memory (512MB), CPU (1.0 core), and process limits
- ✅ **Automatic Removal**: `--rm` flag ensures containers are removed after execution
- ✅ **Timeout Protection**: 30-second timeout prevents runaway processes

### 3. **Stateless Backend**

The Go backend is stateless, meaning:
- No shared state between requests
- Each HTTP request is handled independently
- Concurrent requests are handled by Go's built-in HTTP server concurrency

### 4. **Security Measures**

```go
// Resource Limits
--memory 512m              // Prevents memory exhaustion
--cpus 1.0                // Prevents CPU monopolization
--pids-limit 50           // Prevents fork bombs
--network none            // Prevents network attacks

// Timeouts
context.WithTimeout(30s)   // Prevents infinite loops
```

## Concurrency Flow Example

```
Time 0s:
  User A: Submit Code → Create temp dir A → Start Docker container A

Time 0.5s:
  User B: Submit Code → Create temp dir B → Start Docker container B

Time 1s:
  User A: Container A executing... (isolated)
  User B: Container B executing... (isolated)

Time 5s:
  User A: Execution complete → Return output → Cleanup temp dir A → Remove container A
  User B: Still executing... (unaffected by User A)

Time 7s:
  User B: Execution complete → Return output → Cleanup temp dir B → Remove container B
```

## Scalability

### Current Configuration
- **Max Concurrent Executions**: Limited by system resources
- **Timeout**: 30 seconds per execution
- **Memory per execution**: 512MB
- **CPU per execution**: 1.0 core

### Estimated Capacity
On a system with:
- 8 GB RAM → ~12-15 concurrent executions
- 4 CPU cores → ~4 concurrent executions at full CPU

**Bottleneck**: Usually CPU for compilation-heavy code

## Ballerina Version

### Current Version
- **Docker Image**: `ballerina/ballerina:latest`
- **Actual Version**: Ballerina 2201.12.2 (Swan Lake Update 12)
- **Language Specification**: 2024R1

### Checking Version
```bash
# In production
docker run --rm ballerina/ballerina:latest bal version

# Output:
# Ballerina 2201.12.2 (Swan Lake Update 12)
# Language specification 2024R1
```

### Version Management
The version is controlled by:
1. Docker image tag in `backend/utils/docker.go` (currently `latest`)
2. Distribution in `Ballerina.toml` (currently `2201.10.0` but overridden by Docker image)

**Note**: The Docker image version takes precedence over the `distribution` field in `Ballerina.toml`.

## Potential Issues & Solutions

### Issue 1: Too Many Concurrent Users
**Problem**: System runs out of resources
**Solution**: 
- Implement a rate limiter
- Add a queue system
- Scale horizontally with load balancer

### Issue 2: Slow Execution
**Problem**: First execution is slow (image pull)
**Solution**:
- Pre-pull Ballerina image: `docker pull ballerina/ballerina:latest`
- Use image caching

### Issue 3: Disk Space
**Problem**: Temp directories filling up disk
**Solution**:
- Already handled with `defer os.RemoveAll()`
- Add periodic cleanup cron job for orphaned files

## Monitoring Recommendations

```bash
# Check running containers
docker ps | grep ballerina

# Check resource usage
docker stats

# Check temp directory size
du -sh /tmp/ballerina-playground

# Monitor backend logs
docker logs -f ballerina-playground-backend
```

## Improvements for Production

1. **Rate Limiting**: Add per-IP rate limiting
2. **Queue System**: Use Redis queue for high traffic
3. **Horizontal Scaling**: Deploy multiple backend instances
4. **Monitoring**: Add Prometheus metrics
5. **Caching**: Cache compiled packages
6. **CDN**: Serve frontend via CDN
7. **Database**: Log executions for analytics

