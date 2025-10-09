# 🚨 EC2 Deployment Fix - Quick Commands

## The Problem
You're getting a `KeyError: 'ContainerConfig'` error because docker-compose v1.29.2 has compatibility issues with existing containers.

## ✅ Solution (Run these commands on EC2)

### Option 1: Quick Fix (Recommended)
```bash
# Navigate to project
cd ~/ballerina-online-playground

# Pull latest changes (includes fixed docker-compose.prod.yml)
git pull

# Run emergency fix script
chmod +x emergency-fix.sh
./emergency-fix.sh
```

### Option 2: Manual Fix
```bash
# Navigate to project
cd ~/ballerina-online-playground

# Pull latest code
git pull

# Stop and remove ALL containers
sudo docker stop $(sudo docker ps -aq)
sudo docker rm $(sudo docker ps -aq)

# Clean up
sudo docker container prune -f
sudo docker volume prune -f

# Start fresh (without --build flag initially)
sudo docker-compose -f docker-compose.prod.yml up -d

# Check status
sudo docker-compose -f docker-compose.prod.yml ps

# Test health
curl http://localhost:8081/health
```

### Option 3: Nuclear Option (If above fails)
```bash
cd ~/ballerina-online-playground
git pull

# Stop everything
sudo docker-compose -f docker-compose.prod.yml down -v

# Remove all Docker resources
sudo docker system prune -af --volumes

# Start fresh
sudo docker-compose -f docker-compose.prod.yml up -d

# Wait and test
sleep 15
curl http://localhost:8081/health
```

## 📊 After Fix - Verify It's Working

```bash
# Check container status
sudo docker-compose -f docker-compose.prod.yml ps

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f backend

# Test health endpoint
curl http://localhost:8081/health

# Should return: {"status":"healthy","service":"ballerina-compiler-backend"}
```

## 🔍 Understanding the Changes

The fixed `docker-compose.prod.yml` now uses:
- `mem_limit` instead of `deploy.resources.limits.memory`
- `cpus` instead of `deploy.resources.limits.cpus`
- `mem_reservation` instead of `deploy.resources.reservations.memory`

This is compatible with docker-compose v1.29.2.

## 🎯 Next Time

Always use the `--remove-orphans` flag:
```bash
sudo docker-compose -f docker-compose.prod.yml up -d --remove-orphans
```

Or better yet, use the deployment script:
```bash
./deploy-ec2.sh
```

## 🆘 Still Having Issues?

1. Check Docker version:
   ```bash
   docker --version
   docker-compose --version
   ```

2. Check if port 8081 is free:
   ```bash
   sudo lsof -i :8081
   ```

3. Check Docker logs:
   ```bash
   sudo docker-compose -f docker-compose.prod.yml logs backend
   ```

4. Restart Docker daemon:
   ```bash
   sudo systemctl restart docker
   ```

## ✅ Success Indicators

You'll know it's working when:
- Container status shows "Up"
- Health check returns JSON response
- No errors in logs
- Can execute Ballerina code from frontend

---

**Run Option 1 (emergency-fix.sh) first - it should fix everything! 🚀**
