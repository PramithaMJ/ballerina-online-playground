# 🚀 Quick Start - Optimized Deployment

## Run with Performance Optimizations

```bash
./deploy-optimized.sh
```

This will:
- ✅ Stop existing containers
- ✅ Clean up temp directories
- ✅ Build with all optimizations enabled
- ✅ Start on port 80 with nginx
- ✅ Perform health checks
- ✅ Display service status

## Manual Deployment

```bash
# Stop existing containers
docker-compose down

# Build and start with optimizations
docker-compose up --build -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

## Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8081

## Performance Features

### ⚡ Nginx Optimizations
- Auto-scaling worker processes
- 4096 connections per worker
- Gzip compression (level 6)
- Static asset caching (1 year)
- Zero-copy file transfers (sendfile)

### 🔧 Backend Optimizations
- HTTP server timeouts configured
- Middleware chain for efficiency
- Request logging with timing
- Resource limits for stability

### 🐳 Docker Optimizations
- CPU and memory limits
- Proper resource reservations
- Health checks for reliability
- Optimized network MTU

## Monitoring

### View Resource Usage
```bash
docker stats
```

### View Container Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Check Health
```bash
# Backend health
curl http://localhost:8081/health

# Frontend health
curl http://localhost:80/health
```

## Performance Testing

### Test Compression
```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:80
# Should see: Content-Encoding: gzip
```

### Test Response Time
```bash
time curl http://localhost:80
```

### Load Testing (with Apache Bench)
```bash
# Install apache bench
brew install httpd  # macOS

# Run load test
ab -n 1000 -c 10 http://localhost:80/
```

## Troubleshooting

### Port 80 Already in Use
```bash
# Find process using port 80
sudo lsof -i :80

# Kill the process or change port in docker-compose.yml
```

### Container Not Starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart backend
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check if health checks are passing
docker inspect ballerina-playground-backend | grep -A 10 Health
docker inspect ballerina-playground-frontend | grep -A 10 Health
```

## Production Deployment

For production, consider:

1. **SSL/TLS**: Add HTTPS with Let's Encrypt
2. **Domain**: Configure with your domain name
3. **CDN**: Use CloudFlare for static assets
4. **Monitoring**: Set up Prometheus + Grafana
5. **Scaling**: Use Kubernetes or Docker Swarm

## Documentation

- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) - Detailed optimization guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify health checks: `docker-compose ps`
3. Review resource usage: `docker stats`
4. Check network: `docker network inspect ballerina-online-playground_playground-network`
