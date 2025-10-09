# 🚀 Deployment Guide - GitHub Pages + EC2

This guide will help you deploy the Ballerina Online Playground with the frontend on GitHub Pages and the backend on AWS EC2.

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Part 1: EC2 Backend Deployment](#part-1-ec2-backend-deployment)
- [Part 2: GitHub Pages Frontend Deployment](#part-2-github-pages-frontend-deployment)
- [Part 3: Configuration & Testing](#part-3-configuration--testing)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────┐
│   GitHub Pages      │
│   (Frontend)        │
│   Static HTML/JS    │
└──────────┬──────────┘
           │
           │ HTTPS/HTTP
           │
┌──────────▼──────────┐
│   AWS EC2           │
│   (Backend)         │
│   Go API Server     │
│   Docker Engine     │
└─────────────────────┘
```

---

## ✅ Prerequisites

### For EC2 Deployment:
- AWS Account
- EC2 instance (t3.medium or larger recommended)
- Ubuntu 22.04 LTS (recommended)
- SSH key pair for EC2 access
- Elastic IP (optional but recommended)

### For GitHub Pages:
- GitHub account
- Repository with admin access
- GitHub Actions enabled

### Local Requirements:
- Git installed
- SSH client
- Text editor

---

## 🖥️ Part 1: EC2 Backend Deployment

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Configure Instance:**
   - **Name**: `ballerina-playground-backend`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: `t3.medium` (2 vCPU, 4 GB RAM)
   - **Key Pair**: Create or select existing
   - **Network Settings**:
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere (0.0.0.0/0)
     - Allow Custom TCP (port 8081) from anywhere (0.0.0.0/0)
   - **Storage**: 20 GB gp3

3. **Launch Instance** and note down:
   - Public IP address
   - Private key file location

### Step 2: Allocate Elastic IP (Recommended)

```bash
# In AWS Console:
# EC2 → Elastic IPs → Allocate Elastic IP address
# Then associate it with your instance
```

### Step 3: Connect to EC2

```bash
# Update permissions on your key file
chmod 400 your-key.pem

# Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 4: Install Docker on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

### Step 5: Set Up Backend on EC2

```bash
# Reconnect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Create project directory
mkdir -p ~/ballerina-playground
cd ~/ballerina-playground

# Clone your repository
git clone https://github.com/YOUR_USERNAME/ballerina-online-playground.git
cd ballerina-online-playground

# Create temp directory for Ballerina
sudo mkdir -p /tmp/ballerina-playground
sudo chmod 777 /tmp/ballerina-playground
```

### Step 6: Create EC2 Docker Compose File

Create a production docker-compose file for EC2:

```bash
nano docker-compose.prod.yml
```

Add this content:

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ballerina-playground-backend
    ports:
      - "8081:8081"
    environment:
      - PORT=8081
      - GIN_MODE=release
      - TEMP_DIR=/tmp/ballerina-playground
      - HOST_TEMP_DIR=/tmp/ballerina-playground
      - GOMAXPROCS=2
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /tmp/ballerina-playground:/tmp/ballerina-playground:rw
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8081/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Step 7: Deploy Backend

```bash
# Build and start the backend
docker-compose -f docker-compose.prod.yml up --build -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Test backend
curl http://localhost:8081/health
```

### Step 8: Set Up Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ballerina-backend
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # Replace with your IP or domain

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ballerina-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### Step 9: Configure Firewall

```bash
# Enable UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 8081/tcp  # Backend API
sudo ufw enable

# Check status
sudo ufw status
```

### Step 10: Set Up Auto-Start on Reboot

```bash
# Create systemd service
sudo nano /etc/systemd/system/ballerina-backend.service
```

Add:

```ini
[Unit]
Description=Ballerina Playground Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/ballerina-playground/ballerina-online-playground
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ballerina-backend.service
sudo systemctl start ballerina-backend.service
sudo systemctl status ballerina-backend.service
```

---

## 🌐 Part 2: GitHub Pages Frontend Deployment

### Step 1: Configure Repository

1. Go to your GitHub repository
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch OR GitHub Actions (recommended)

### Step 2: Add Backend URL Secret

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_API_URL`
4. Value: `http://YOUR_EC2_PUBLIC_IP:8081` (or `http://YOUR_DOMAIN`)
5. Click **Add secret**

### Step 3: Update vite.config.js

Make sure your `frontend-vite/vite.config.js` has the base path:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ballerina-online-playground/',  // Replace with your repo name
  server: {
    port: 5173,
    host: true
  }
})
```

### Step 4: Push to GitHub

```bash
# From your local machine
git add .
git commit -m "Configure deployment settings"
git push origin main
```

### Step 5: Monitor Deployment

1. Go to **Actions** tab in GitHub
2. Watch the "Deploy to GitHub Pages" workflow
3. Once complete, visit: `https://YOUR_USERNAME.github.io/ballerina-online-playground/`

---

## ⚙️ Part 3: Configuration & Testing

### Update CORS on Backend

Update the backend to allow your GitHub Pages domain:

```go
// In backend/main.go
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Allow your GitHub Pages domain
        origin := r.Header.Get("Origin")
        allowedOrigins := []string{
            "https://YOUR_USERNAME.github.io",
            "http://localhost:5173",  // For local development
        }
        
        for _, allowed := range allowedOrigins {
            if origin == allowed {
                w.Header().Set("Access-Control-Allow-Origin", origin)
                break
            }
        }
        
        w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next(w, r)
    }
}
```

Rebuild on EC2:

```bash
cd ~/ballerina-playground/ballerina-online-playground
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### Test the Complete Setup

1. **Test Backend**:
   ```bash
   curl http://YOUR_EC2_IP:8081/health
   ```

2. **Test Frontend**:
   Visit `https://YOUR_USERNAME.github.io/ballerina-online-playground/`

3. **Test Integration**:
   - Write Ballerina code in the frontend
   - Click "Run"
   - Should see output from EC2 backend

---

## 🔒 Security Enhancements (Recommended)

### 1. Add SSL/TLS with Let's Encrypt

```bash
# On EC2
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 2. Update GitHub Pages to Use HTTPS

Update `VITE_API_URL` secret to: `https://your-domain.com`

### 3. Restrict CORS

Update backend CORS to only allow your GitHub Pages domain.

---

## 📊 Monitoring & Maintenance

### Monitor Backend

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats

# Check system resources
htop
```

### Update Backend

```bash
cd ~/ballerina-playground/ballerina-online-playground
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### Update Frontend

Just push to GitHub - automatic deployment via GitHub Actions!

---

## 🐛 Troubleshooting

### Backend Issues

**Container won't start:**
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker ps -a
```

**Port already in use:**
```bash
sudo lsof -i :8081
sudo kill -9 <PID>
```

**Docker socket permission denied:**
```bash
sudo chmod 666 /var/run/docker.sock
```

### Frontend Issues

**GitHub Pages not updating:**
- Check Actions tab for build errors
- Clear browser cache
- Wait 5-10 minutes for CDN propagation

**API calls failing:**
- Check browser console for CORS errors
- Verify `VITE_API_URL` secret is correct
- Ensure EC2 security group allows port 8081

**404 on GitHub Pages:**
- Verify `base` path in `vite.config.js` matches repo name
- Check repository settings → Pages is enabled

---

## 💰 Cost Estimation

### AWS EC2:
- **t3.medium**: ~$30-35/month
- **Elastic IP**: Free (when associated)
- **Data Transfer**: ~$0.09/GB (first 100GB/month free)

### GitHub Pages:
- **Free** for public repositories
- Unlimited bandwidth

---

## 🎯 Next Steps

1. **Domain Name**: Register a custom domain
2. **SSL**: Set up HTTPS with Let's Encrypt
3. **Monitoring**: Add CloudWatch or Prometheus
4. **Backup**: Set up automated EC2 snapshots
5. **CDN**: Add CloudFlare for better performance
6. **CI/CD**: Automate EC2 deployments

---

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🆘 Support

If you encounter issues:
1. Check logs on EC2: `docker-compose -f docker-compose.prod.yml logs -f`
2. Check GitHub Actions for build errors
3. Verify security groups and firewall rules
4. Test backend health: `curl http://YOUR_EC2_IP:8081/health`

Happy Deploying! 🚀
