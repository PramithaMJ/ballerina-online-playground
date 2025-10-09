# Docker Deployment Guide 🐳

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose installed (usually included with Docker Desktop)
- Ports 5173 (frontend) and 8081 (backend) available

### Start Everything with One Command

```bash
./docker-manage.sh start
```

That's it! Your Ballerina Playground is now running:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8081

---

## 📋 Management Commands

### Using the Management Script

```bash
./docker-manage.sh [command]
```

### Available Commands

| Command | Description |
|---------|-------------|
| `start` | Build and start all services |
| `stop` | Stop all services |
| `restart` | Restart all services |
| `logs` | Show logs from all services |
| `logs-f` | Follow logs in real-time |
| `status` | Show status of all services |
| `clean` | Stop and remove all containers |
| `rebuild` | Rebuild images from scratch |
| `backend` | Show backend logs only |
| `frontend` | Show frontend logs only |
| `help` | Show help message |

### Examples

**Start the application:**
```bash
./docker-manage.sh start
```

**View logs:**
```bash
./docker-manage.sh logs-f
```

**Stop everything:**
```bash
./docker-manage.sh stop
```

**Rebuild after code changes:**
```bash
./docker-manage.sh rebuild
```

**Clean up everything:**
```bash
./docker-manage.sh clean
```

---

## 🐳 Manual Docker Compose Commands

If you prefer to use Docker Compose directly:

### Start Services
```bash
docker-compose up -d --build
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

### Rebuild Containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 📦 Services Overview

### Backend Service
- **Container**: `ballerina-playground-backend`
- **Port**: 8081
- **Technology**: Go + Gin
- **Features**: 
  - Ballerina code execution
  - Docker-in-Docker support
  - Security constraints (timeouts, resource limits)
  - CORS enabled

### Frontend Service
- **Container**: `ballerina-playground-frontend`
- **Port**: 5173 (mapped from internal 80)
- **Technology**: React + Vite + Monaco Editor
- **Features**:
  - Modern code editor
  - Syntax highlighting
  - Real-time validation
  - Resizable panels
  - Fullscreen mode
  - Theme support

---

## 🔧 Configuration

### Environment Variables

**Backend** (in `docker-compose.yml`):
```yaml
environment:
  - PORT=8081
  - GIN_MODE=release
```

**Frontend** (build args in `docker-compose.yml`):
```yaml
args:
  - VITE_API_URL=http://localhost:8081
```

### Port Mapping

Change ports in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3000:80"  # Change 5173 to 3000
  
  backend:
    ports:
      - "9000:8081"  # Change 8081 to 9000
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Docker Network                    │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Frontend   │─────▶│    Backend      │ │
│  │   (Nginx)    │      │    (Go)         │ │
│  │   Port: 80   │      │    Port: 8081   │ │
│  └──────────────┘      └─────────────────┘ │
│         │                       │           │
└─────────┼───────────────────────┼───────────┘
          │                       │
     Port 5173              Port 8081
          │                       │
    ┌─────▼───────────────────────▼─────┐
    │         Host Machine              │
    │   http://localhost:5173           │
    │   http://localhost:8081           │
    └───────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Port Already in Use

**Error**: "Bind for 0.0.0.0:5173 failed: port is already allocated"

**Solution 1**: Stop the conflicting process
```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

**Solution 2**: Change the port in docker-compose.yml

### Docker Not Running

**Error**: "Cannot connect to the Docker daemon"

**Solution**: Start Docker Desktop

### Permission Denied

**Error**: "permission denied while trying to connect to Docker daemon"

**Solution**:
```bash
# Add your user to docker group (Linux)
sudo usermod -aG docker $USER

# Restart your terminal or run
newgrp docker
```

### Containers Won't Start

**Check logs**:
```bash
./docker-manage.sh logs
```

**Check status**:
```bash
./docker-manage.sh status
```

**Rebuild**:
```bash
./docker-manage.sh rebuild
```

### Frontend Shows CORS Errors

**Check**: Make sure backend is running
```bash
curl http://localhost:8081/health
```

**Fix**: Verify VITE_API_URL in frontend Dockerfile matches backend URL

---

## 📊 Health Checks

Both services have health checks configured:

**Backend Health Check**:
```bash
curl http://localhost:8081/health
```

**Frontend Health Check**:
```bash
curl http://localhost:5173
```

**Docker Health Status**:
```bash
docker ps
```

Look for "healthy" status in the STATUS column.

---

## 🔄 Development Workflow

### 1. Make Code Changes

Edit your code in `frontend-vite/` or `backend/`

### 2. Rebuild Containers

```bash
./docker-manage.sh rebuild
```

### 3. Test Changes

Visit http://localhost:5173

### 4. View Logs

```bash
./docker-manage.sh logs-f
```

### 5. Stop When Done

```bash
./docker-manage.sh stop
```

---

## 🚀 Production Deployment

### Build for Production

```bash
docker-compose build --no-cache
```

### Push to Registry

```bash
# Tag images
docker tag ballerina-playground-frontend:latest your-registry/ballerina-playground-frontend:v1.0.0
docker tag ballerina-playground-backend:latest your-registry/ballerina-playground-backend:v1.0.0

# Push to registry
docker push your-registry/ballerina-playground-frontend:v1.0.0
docker push your-registry/ballerina-playground-backend:v1.0.0
```

### Environment-Specific Configs

Create separate docker-compose files:
- `docker-compose.yml` (base)
- `docker-compose.dev.yml` (development)
- `docker-compose.prod.yml` (production)

**Use specific config**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📈 Resource Usage

### Default Limits

**Backend**:
- CPU: No limit (can be set)
- Memory: No limit (can be set)

**Frontend**:
- CPU: No limit
- Memory: No limit

### Set Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 🔐 Security Considerations

### 1. Docker Socket Access

Backend requires Docker socket access for code execution:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Security**: Only run in trusted environments!

### 2. Network Isolation

Services communicate via internal Docker network:
```yaml
networks:
  playground-network:
    driver: bridge
```

### 3. Non-Root User

Backend runs as non-root user (UID 10014)

### 4. Resource Limits

Backend enforces:
- 30s execution timeout
- 256MB memory limit per execution
- 0.5 CPU core limit
- Network disabled in execution containers

---

## 📝 File Structure

```
ballerina-online-playground/
├── docker-compose.yml          ← Main orchestration file
├── docker-manage.sh            ← Management script
├── backend/
│   ├── Dockerfile             ← Backend container config
│   ├── .dockerignore          ← Build optimization
│   └── ...                    ← Go source files
└── frontend-vite/
    ├── Dockerfile             ← Frontend container config
    ├── nginx.conf             ← Nginx configuration
    ├── .dockerignore          ← Build optimization
    └── ...                    ← React source files
```

---

## 💡 Tips & Best Practices

### 1. Use Management Script
The `docker-manage.sh` script simplifies common operations

### 2. Monitor Logs
Keep logs open while developing:
```bash
./docker-manage.sh logs-f
```

### 3. Clean Regularly
Remove unused containers and volumes:
```bash
./docker-manage.sh clean
docker system prune -a
```

### 4. Check Health
Verify services are healthy:
```bash
./docker-manage.sh status
```

### 5. Rebuild After Changes
Always rebuild when you modify code:
```bash
./docker-manage.sh rebuild
```

---

## ✅ Verification Checklist

After starting services, verify:

- [ ] Backend container running: `docker ps | grep backend`
- [ ] Frontend container running: `docker ps | grep frontend`
- [ ] Backend accessible: `curl http://localhost:8081/health`
- [ ] Frontend accessible: Open http://localhost:5173
- [ ] Can execute code: Try running Ballerina code in UI
- [ ] No errors in logs: `./docker-manage.sh logs`

---

## 🆘 Getting Help

### Check Logs First
```bash
./docker-manage.sh logs
```

### Verify Status
```bash
./docker-manage.sh status
```

### Try Clean Rebuild
```bash
./docker-manage.sh clean
./docker-manage.sh rebuild
```

### Check Docker
```bash
docker info
docker ps -a
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Ballerina Documentation](https://ballerina.io/)

---

**Status**: Ready for Docker Deployment
**Last Updated**: October 9, 2025
