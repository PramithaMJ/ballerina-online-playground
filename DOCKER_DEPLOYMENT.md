# Docker Deployment Guide - High-Performance Container Pool

## Overview

This deployment uses an optimized container pooling system that:
- **Pre-pulls all Ballerina Docker images** at startup
- **Pre-initializes a pool of running containers** (3 per version)
- **Reuses containers** instead of creating new ones for each request
- **Reduces execution time from 20+ seconds to 2-5 seconds**

## Architecture

```
┌─────────────────────────────────────────────┐
│  Backend Container (Go Application)        │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Container Pool Manager               │ │
│  │  - Pre-pulled images                  │ │
│  │  - 3 containers per version           │ │
│  │  - Health monitoring                  │ │
│  │  - Auto-replacement of unhealthy ones │ │
│  └───────────────────────────────────────┘ │
│                   ↓                         │
│  ┌───────────────────────────────────────┐ │
│  │  Pooled Ballerina Containers          │ │
│  │  • 2201.12.0 (3 containers)           │ │
│  │  • 2201.11.0 (3 containers)           │ │
│  │  • 2201.10.5 (3 containers)           │ │
│  │  • 2201.10.0 (3 containers)           │ │
│  │  • 2201.9.0  (3 containers)           │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Prerequisites

1. **Docker & Docker Compose** installed on your system
2. **Sufficient resources**:
   - Minimum: 4GB RAM, 2 CPU cores
   - Recommended: 8GB RAM, 4 CPU cores
3. **Docker socket access** (`/var/run/docker.sock`)

## Quick Start

### Development Environment

```bash
# 1. Build and start services
docker-compose up --build

# 2. Check logs to see pool initialization
docker-compose logs -f backend

# Expected output:
# 🚀 Initializing container pool...
#  Pre-pulling image: ballerina/ballerina:2201.12.0
#  Successfully pulled image: ballerina/ballerina:2201.12.0
#  Pre-initialized container 1/3 for version 2201.12.0
# ...
#  Container pool initialization complete!
#  Container Pool Statistics:
#   Version 2201.12.0: 3 total (3 available, 0 in use)
```

### Production Environment

```bash
# 1. Use production docker-compose file
docker-compose -f docker-compose.prod.yml up -d --build

# 2. Monitor startup
docker-compose -f docker-compose.prod.yml logs -f backend

# 3. Check health
curl http://localhost:8081/health
```

## Configuration

### Environment Variables

| Variable | Description | Default | Production |
|----------|-------------|---------|------------|
| `PORT` | Backend port | 8081 | 8081 |
| `TEMP_DIR` | Container temp directory | `/tmp/ballerina-playground` | `/tmp/ballerina-playground` |
| `HOST_TEMP_DIR` | Host temp directory | `/tmp/ballerina-playground` | `/tmp/ballerina-playground` |
| `GOMAXPROCS` | Go max processors | 2 | 2-4 |
| `ALLOWED_ORIGIN` | CORS origin | `*` | Your domain |

### Container Pool Configuration

Edit `backend/utils/container_pool.go` to customize:

```go
// Supported versions to pre-initialize
SupportedVersions = []string{
    "2201.12.0", // Latest
    "2201.11.0",
    "2201.10.5",
    "2201.10.0",
    "2201.9.0",
}

// Pool configuration
PoolSizePerVersion = 3  // Number of containers per version
MaxUseCount        = 50 // Recycle container after 50 uses
```

### Resource Limits

#### Backend Container Resources:
- **Memory**: 2GB limit, 512MB reservation
- **CPU**: 2 cores
- **Container Pool**: ~1.5GB for pooled containers

#### Per-Version Pool Resources:
- Each Ballerina container: ~150-200MB
- 3 containers × 5 versions = ~2.5-3GB total

## Performance Optimizations

### 1. Image Pre-pulling
All Ballerina images are pulled during startup, eliminating pull time during execution.

### 2. Container Reuse
Containers stay running and are reused via Docker exec, avoiding startup overhead:
- **Traditional**: Create → Start → Execute → Stop → Remove (8-12 seconds)
- **Pooled**: Get from pool → Execute → Return (0.5-2 seconds)

### 3. Health Monitoring
Background process checks container health every 30 seconds and auto-replaces failed containers.

### 4. Result Caching
Identical code executions are cached for 5 minutes in both backend and frontend.

## Monitoring

### View Pool Statistics

Check logs for pool statistics:
```bash
docker-compose logs backend | grep ""
```

### Check Container Pool Status

```bash
# List all running Ballerina containers
docker ps | grep ballerina

# Check pool health
docker-compose exec backend curl http://localhost:8081/health
```

### Performance Metrics

Monitor execution times in logs:
```bash
docker-compose logs backend | grep "⚡"
```

Expected output:
```
⚡ Execution completed in 1.2s using pooled container
```

## Troubleshooting

### Issue: Pool initialization fails

**Symptom**: Backend starts but no containers are created

**Solution**:
```bash
# 1. Check Docker socket access
docker-compose exec backend ls -la /var/run/docker.sock

# 2. Verify Docker is accessible
docker-compose exec backend docker ps

# 3. Check logs for specific errors
docker-compose logs backend | grep ""
```

### Issue: High memory usage

**Symptom**: System running out of memory

**Solution**:
1. Reduce pool size in `container_pool.go`:
   ```go
   PoolSizePerVersion = 2  // Reduce from 3 to 2
   ```

2. Reduce supported versions:
   ```go
   SupportedVersions = []string{
       "2201.12.0", // Keep only latest
       "2201.11.0",
   }
   ```

3. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Issue: Containers not being recycled

**Symptom**: Old containers accumulate

**Solution**:
1. Check health monitor is running:
   ```bash
   docker-compose logs backend | grep "⚠️"
   ```

2. Manually trigger cleanup:
   ```bash
   docker-compose restart backend
   ```

## Scaling

### Horizontal Scaling

For multiple backend instances:

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - INSTANCE_ID=${HOSTNAME}
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up --scale backend=3
```

### Vertical Scaling

For higher load on single instance:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
```

Update pool size:
```go
PoolSizePerVersion = 5  // Increase pool size
```

## Maintenance

### Graceful Shutdown

```bash
# Send SIGTERM for graceful shutdown
docker-compose down

# Container pool will:
# 1. Stop accepting new requests
# 2. Wait for ongoing executions
# 3. Clean up all pooled containers
# 4. Shutdown within 30 seconds
```

### Update Ballerina Versions

1. Edit `backend/utils/container_pool.go`:
   ```go
   SupportedVersions = []string{
       "2201.13.0", // Add new version
       "2201.12.0",
       // ... keep or remove old versions
   }
   ```

2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Clear Old Images

```bash
# Remove unused Ballerina images
docker images | grep ballerina | grep -v "2201.12.0\|2201.11.0" | awk '{print $3}' | xargs docker rmi
```

## Security Considerations

### Container Isolation
- Network disabled in execution containers
- Read-only root filesystem
- All capabilities dropped
- No privilege escalation
- Running as nobody user (65534:65534)

### Resource Limits
- Memory limits prevent DoS
- CPU limits prevent resource exhaustion
- Process limits (100 per container)
- Execution timeout (60 seconds)

## Performance Benchmarks

### Before Optimization (Docker run)
- First execution: 20-25 seconds
- Subsequent executions: 18-22 seconds
- Image pull: 30-60 seconds (first time)

### After Optimization (Container Pool)
- First execution: 2-5 seconds
- Subsequent executions: 1-3 seconds
- Image pull: 0 seconds (pre-pulled at startup)
- Cached executions: <100ms

**Performance Improvement: 85-90% faster** ⚡

## Production Checklist

- [ ] Set appropriate `ALLOWED_ORIGIN` for CORS
- [ ] Configure resource limits based on server capacity
- [ ] Set up monitoring and alerting
- [ ] Enable Docker logging driver
- [ ] Configure automatic restarts
- [ ] Set up health checks
- [ ] Test failover scenarios
- [ ] Document backup/restore procedures
- [ ] Configure SSL/TLS termination (nginx/traefik)
- [ ] Set up rate limiting at load balancer level

## Support

For issues or questions:
1. Check logs: `docker-compose logs backend`
2. Verify pool status: Look for  emoji in logs
3. Check container health: `docker ps | grep ballerina`
4. Review this guide's troubleshooting section

## License

Same as main project.
