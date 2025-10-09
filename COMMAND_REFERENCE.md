# 🚀 Complete Command Reference

All commands you need to deploy and maintain the Ballerina Online Playground.

---

## 📋 Table of Contents
1. [EC2 Backend Commands](#ec2-backend-commands)
2. [Cloudflare HTTPS Setup](#cloudflare-https-setup)
3. [GitHub Actions Commands](#github-actions-commands)
4. [Docker Management](#docker-management)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting Commands](#troubleshooting-commands)

---

## EC2 Backend Commands

### Initial Deployment
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@54.160.240.225

# Navigate to project
cd ~/ballerina-online-playground

# Pull latest code
git pull origin main

# Start backend (production mode)
sudo docker-compose -f docker-compose.prod.yml up -d --build

# Check status
sudo docker-compose -f docker-compose.prod.yml ps

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f backend
```

### Quick Deploy Script
```bash
# Use the deployment script
./deploy-ec2.sh

# Or emergency fix if having issues
./emergency-fix.sh
```

### Stop/Restart Backend
```bash
# Stop
sudo docker-compose -f docker-compose.prod.yml down

# Restart
sudo docker-compose -f docker-compose.prod.yml restart

# Stop and remove volumes
sudo docker-compose -f docker-compose.prod.yml down -v
```

---

## Cloudflare HTTPS Setup

### Install Cloudflared
```bash
# Download
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify
cloudflared --version
```

### Authenticate & Create Tunnel
```bash
# Login (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create ballerina-backend

# Note the tunnel ID from output
# Example output:
# Created tunnel ballerina-backend with id: abc123def456
```

### Configure Tunnel
```bash
# Create config directory
sudo mkdir -p /etc/cloudflared

# Create config file
sudo nano /etc/cloudflared/config.yml
```

**Add this content (replace values):**
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ballerina-api.yourdomain.com
    service: http://localhost:8081
  - service: http_status:404
```

### Setup DNS & Start Service
```bash
# Create DNS record
cloudflared tunnel route dns ballerina-backend ballerina-api.yourdomain.com

# Install as system service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Quick Test with Temporary URL
```bash
# Run tunnel without config (gives temporary URL)
cloudflared tunnel --url http://localhost:8081

# This gives you a temporary URL like:
# https://random-name.trycloudflare.com
# Use this for quick testing!
```

---

## GitHub Actions Commands

### Update API URL Secret
```bash
# Via GitHub CLI (if installed)
gh secret set VITE_API_URL --body "https://ballerina-api.yourdomain.com"

# Or manually:
# Go to: https://github.com/PramithaMJ/ballerina-online-playground/settings/secrets/actions
# Update VITE_API_URL value
```

### Trigger Deployment
```bash
# From local machine
git add .
git commit -m "Update API URL to HTTPS"
git push origin main

# Or trigger empty commit
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### View Workflow Status
```bash
# Via GitHub CLI
gh run list
gh run view --log

# Or visit:
# https://github.com/PramithaMJ/ballerina-online-playground/actions
```

---

## Docker Management

### Container Operations
```bash
# List all containers
sudo docker ps -a

# Stop specific container
sudo docker stop ballerina-playground-backend

# Remove specific container
sudo docker rm ballerina-playground-backend

# Remove all stopped containers
sudo docker container prune -f
```

### Image Management
```bash
# List images
sudo docker images

# Pull Ballerina image
sudo docker pull ballerina/ballerina:2201.10.2

# Remove unused images
sudo docker image prune -a -f

# Check image size
sudo docker images | grep ballerina
```

### Volume Management
```bash
# List volumes
sudo docker volume ls

# Remove unused volumes
sudo docker volume prune -f

# Remove specific volume
sudo docker volume rm volume_name
```

### System Cleanup
```bash
# Remove everything (nuclear option)
sudo docker system prune -a --volumes -f

# Check disk usage
sudo docker system df

# Detailed disk usage
sudo docker system df -v
```

### View Logs
```bash
# Follow logs (Ctrl+C to exit)
sudo docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
sudo docker-compose -f docker-compose.prod.yml logs backend

# Last 100 lines
sudo docker-compose -f docker-compose.prod.yml logs --tail=100

# With timestamps
sudo docker-compose -f docker-compose.prod.yml logs -t
```

---

## Testing & Verification

### Backend Health Check
```bash
# HTTP (before HTTPS setup)
curl http://localhost:8081/health
curl http://54.160.240.225:8081/health

# HTTPS (after Cloudflare setup)
curl https://ballerina-api.yourdomain.com/health

# Expected output:
# {"status":"healthy","service":"ballerina-compiler-backend"}
```

### Test Code Execution
```bash
# Create test file
cat > test.json << 'EOF'
{
  "code": "import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello from API!\");\n}"
}
EOF

# Test execute endpoint (HTTP)
curl -X POST http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d @test.json

# Test execute endpoint (HTTPS)
curl -X POST https://ballerina-api.yourdomain.com/execute \
  -H "Content-Type: application/json" \
  -d @test.json
```

### Test CORS Headers
```bash
# Check CORS headers
curl -I https://ballerina-api.yourdomain.com/health

# Should include:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: POST, GET, OPTIONS

# Test preflight request
curl -X OPTIONS https://ballerina-api.yourdomain.com/execute \
  -H "Origin: https://pramithamj.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Frontend Testing
```bash
# Open in browser
open https://pramithamj.github.io/ballerina-online-playground/

# Or use curl to check if page loads
curl -I https://pramithamj.github.io/ballerina-online-playground/
```

### Network Connectivity
```bash
# Check if port is open
sudo lsof -i :8081

# Check if process is listening
sudo netstat -tuln | grep 8081

# Test from EC2 to internet
curl -I https://www.google.com

# Check DNS resolution
nslookup ballerina-api.yourdomain.com
```

---

## Troubleshooting Commands

### Check System Resources
```bash
# CPU and memory usage
top

# Or use htop (install if needed)
sudo apt install htop -y
htop

# Disk usage
df -h

# Check Docker disk usage
sudo docker system df
```

### Check Logs
```bash
# Docker daemon logs
sudo journalctl -u docker -f

# Cloudflare tunnel logs
sudo journalctl -u cloudflared -f

# System logs
sudo journalctl -xe

# Check last 100 lines of syslog
sudo tail -100 /var/log/syslog
```

### Network Diagnostics
```bash
# Check firewall status (UFW)
sudo ufw status

# Check iptables rules
sudo iptables -L

# Test connection to Docker container
curl http://localhost:8081/health

# Check which process uses port
sudo lsof -i :8081
sudo fuser -v 8081/tcp
```

### Docker Issues
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Check Docker status
sudo systemctl status docker

# Docker daemon info
sudo docker info

# Check Docker events
sudo docker events

# Inspect container
sudo docker inspect ballerina-playground-backend

# Container logs with timestamps
sudo docker logs -t ballerina-playground-backend
```

### Cloudflare Tunnel Issues
```bash
# Restart tunnel
sudo systemctl restart cloudflared

# Stop tunnel
sudo systemctl stop cloudflared

# Tunnel status
sudo systemctl status cloudflared

# View tunnel config
sudo cat /etc/cloudflared/config.yml

# List tunnels
cloudflared tunnel list

# Delete tunnel (if needed)
cloudflared tunnel delete ballerina-backend
```

### GitHub Actions Issues
```bash
# Via GitHub CLI - view failed runs
gh run list --status failure

# View specific run
gh run view RUN_ID

# Re-run failed jobs
gh run rerun RUN_ID

# Or manually:
# Go to Actions tab in GitHub
# Click on failed workflow
# Click "Re-run jobs"
```

### Reset Everything
```bash
# Complete reset (use with caution!)

# 1. Stop all containers
sudo docker stop $(sudo docker ps -aq)

# 2. Remove all containers
sudo docker rm $(sudo docker ps -aq)

# 3. Remove all images
sudo docker rmi $(sudo docker images -q)

# 4. Remove all volumes
sudo docker volume rm $(sudo docker volume ls -q)

# 5. Clean everything
sudo docker system prune -a --volumes -f

# 6. Restart Docker
sudo systemctl restart docker

# 7. Start fresh
cd ~/ballerina-online-playground
git pull
./emergency-fix.sh
```

---

## Maintenance Commands

### Update System
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io -y

# Update Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Backup
```bash
# Backup Docker volumes
sudo docker run --rm -v ballerina_data:/data -v $(pwd):/backup alpine tar czf /backup/ballerina-backup.tar.gz /data

# Backup config files
tar czf config-backup.tar.gz \
  /etc/cloudflared/config.yml \
  ~/ballerina-online-playground/docker-compose.prod.yml \
  ~/ballerina-online-playground/backend/main.go
```

### Monitor Continuously
```bash
# Watch container status (refreshes every 2 seconds)
watch -n 2 'sudo docker-compose -f docker-compose.prod.yml ps'

# Monitor logs in real-time
sudo docker-compose -f docker-compose.prod.yml logs -f --tail=50

# Monitor system resources
watch -n 1 'free -h && df -h'
```

---

## Quick Reference Card

```bash
# Start backend
sudo docker-compose -f docker-compose.prod.yml up -d

# Stop backend
sudo docker-compose -f docker-compose.prod.yml down

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f

# Restart backend
sudo docker-compose -f docker-compose.prod.yml restart

# Check health
curl http://localhost:8081/health

# Emergency fix
./emergency-fix.sh

# Update code
git pull && sudo docker-compose -f docker-compose.prod.yml up -d --build

# System cleanup
sudo docker system prune -af --volumes
```

---

## Environment Variables

### Required GitHub Secrets
```bash
VITE_API_URL=https://ballerina-api.yourdomain.com
```

### EC2 Environment
```bash
# These are set in docker-compose.prod.yml
DOCKER_TIMEOUT=300s
BALLERINA_VERSION=2201.10.2
PORT=8081
```

---

## Important File Paths

```bash
# EC2
~/ballerina-online-playground/           # Project root
~/ballerina-online-playground/backend/   # Backend code
/etc/cloudflared/config.yml              # Cloudflare config
/var/lib/docker/                         # Docker data

# Logs
/var/log/syslog                          # System logs
sudo docker logs ballerina-playground-backend  # Container logs
sudo journalctl -u cloudflared           # Cloudflare logs
```

---

## Support & Documentation

- **Main README:** `README.md`
- **Deployment Guide:** `DEPLOYMENT_NOTES.md`
- **HTTPS Setup:** `HTTPS_SETUP_GUIDE.md`
- **Quick HTTPS Fix:** `HTTPS_QUICK_FIX.md`
- **Understanding HTTPS:** `UNDERSTANDING_HTTPS_ISSUE.md`
- **EC2 Fix Guide:** `EC2_FIX_GUIDE.md`
- **Progress Tracking:** `PROGRESS_CHECKLIST.md`
- **Docker Guide:** `DOCKER_GUIDE.md`

---

**💡 Pro Tip:** Bookmark this file! It contains all the commands you'll need for deployment and maintenance.

**🚨 Need Help?** Check the troubleshooting section first, then refer to the detailed guides.
