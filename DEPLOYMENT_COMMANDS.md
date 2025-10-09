# 🚀 Deployment Commands Quick Reference

## Local Development

```bash
# Start both frontend and backend locally
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## EC2 Backend Deployment

### First Time Setup

```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Clone repository
git clone https://github.com/pramithamj/ballerina-online-playground.git
cd ballerina-online-playground

# 3. Run deployment script
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Update Backend

```bash
# On EC2
cd ~/ballerina-playground/ballerina-online-playground
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### View Backend Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Restart Backend

```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### Check Backend Status

```bash
docker-compose -f docker-compose.prod.yml ps
docker stats
curl http://localhost:8081/health
```

## GitHub Pages Frontend Deployment

### Automatic Deployment

Just push to main branch:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

GitHub Actions will automatically build and deploy to GitHub Pages.

### Manual Trigger

1. Go to GitHub repository
2. Click **Actions** tab
3. Select "Deploy to GitHub Pages" workflow
4. Click **Run workflow**

## Nginx Setup on EC2

```bash
# Install Nginx
sudo apt install nginx -y

# Copy configuration
sudo cp nginx-ec2.conf /etc/nginx/sites-available/ballerina-backend

# Edit configuration (update IP/domain)
sudo nano /etc/nginx/sites-available/ballerina-backend

# Enable site
sudo ln -s /etc/nginx/sites-available/ballerina-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## SSL Setup with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (requires domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Monitoring Commands

### Check Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h

# Memory
free -h
```

### Check Logs

```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/ballerina-access.log
sudo tail -f /var/log/nginx/ballerina-error.log

# System logs
sudo journalctl -u ballerina-backend.service -f
```

## Troubleshooting Commands

### Backend Not Responding

```bash
# Check if container is running
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild
docker-compose -f docker-compose.prod.yml up --build -d
```

### Port Issues

```bash
# Check what's using port 8081
sudo lsof -i :8081

# Kill process
sudo kill -9 <PID>
```

### Disk Space Issues

```bash
# Clean Docker
docker system prune -a

# Clean old images
docker image prune -a

# Check disk space
df -h
```

### Network Issues

```bash
# Check firewall
sudo ufw status

# Check security group in AWS Console
# Ensure ports 80, 8081 are open

# Test connectivity
curl http://localhost:8081/health
curl http://YOUR_EC2_IP:8081/health
```

## GitHub Actions Debugging

### View Build Logs

1. Go to GitHub repository
2. Click **Actions** tab
3. Click on the failed workflow run
4. Click on the failed job
5. Expand the failed step

### Common Fixes

```bash
# If build fails, check:
# 1. VITE_API_URL secret is set correctly
# 2. package-lock.json is committed
# 3. vite.config.js base path is correct

# Re-run failed workflow
# Click "Re-run all jobs" button in Actions tab
```

## Emergency Procedures

### Backend Down

```bash
# Quick restart
docker-compose -f docker-compose.prod.yml restart

# Full rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

### High CPU Usage

```bash
# Check what's using CPU
docker stats

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Out of Memory

```bash
# Check memory
free -h

# Clean up
docker system prune -a

# Restart
sudo reboot
```

## Backup & Restore

### Backup Configuration

```bash
# Backup directory
tar -czf backup-$(date +%Y%m%d).tar.gz \
    docker-compose.prod.yml \
    nginx-ec2.conf \
    backend/

# Download backup
scp -i your-key.pem ubuntu@YOUR_EC2_IP:~/backup-*.tar.gz ./
```

### Restore

```bash
# Upload backup
scp -i your-key.pem backup-*.tar.gz ubuntu@YOUR_EC2_IP:~/

# Extract
tar -xzf backup-*.tar.gz

# Redeploy
./deploy-ec2.sh
```

## Useful Aliases (Add to ~/.bashrc on EC2)

```bash
# Add these to ~/.bashrc
alias dcup='docker-compose -f docker-compose.prod.yml up -d'
alias dcdown='docker-compose -f docker-compose.prod.yml down'
alias dclogs='docker-compose -f docker-compose.prod.yml logs -f'
alias dcps='docker-compose -f docker-compose.prod.yml ps'
alias dcrestart='docker-compose -f docker-compose.prod.yml restart'
alias health='curl http://localhost:8081/health'

# Reload
source ~/.bashrc
```

## URLs Reference

- **Local Frontend**: http://localhost:80
- **Local Backend**: http://localhost:8081
- **EC2 Backend**: http://YOUR_EC2_IP:8081
- **GitHub Pages**: https://YOUR_USERNAME.github.io/ballerina-online-playground/
- **Health Check**: http://YOUR_EC2_IP:8081/health

---

For detailed instructions, see:

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
