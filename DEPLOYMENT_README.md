# 📚 Deployment Documentation Index

This repository contains everything you need to deploy the Ballerina Online Playground to production.

## 🎯 Architecture

**Frontend**: GitHub Pages (Free, Static Hosting)  
**Backend**: AWS EC2 (Ubuntu + Docker + Go API)  
**Communication**: REST API over HTTP/HTTPS

---

## 📖 Documentation Files

### 🚀 Getting Started
1. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**  
   Step-by-step checklist for deployment. Start here!
   
2. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**  
   Comprehensive guide with detailed instructions for both EC2 and GitHub Pages deployment.

3. **[DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)**  
   Quick reference for common deployment commands.

### ⚡ Performance
4. **[PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)**  
   All performance optimizations implemented (Nginx, Docker, Go).

5. **[QUICKSTART_OPTIMIZED.md](./QUICKSTART_OPTIMIZED.md)**  
   Quick start guide for optimized local deployment.

### 🏗️ Architecture & Development
6. **[ARCHITECTURE.md](./ARCHITECTURE.md)**  
   System architecture and component overview.

7. **[DEVELOPMENT.md](./DEVELOPMENT.md)**  
   Local development setup and guidelines.

---

## 🔧 Configuration Files

### Deployment Scripts
- **`deploy-ec2.sh`** - Automated EC2 backend deployment
- **`deploy-optimized.sh`** - Optimized local deployment
- **`.github/workflows/deploy-github-pages.yml`** - GitHub Actions for frontend

### Docker Configuration
- **`docker-compose.yml`** - Local development
- **`docker-compose.prod.yml`** - Production EC2 deployment
- **`backend/Dockerfile`** - Backend container
- **`frontend-vite/Dockerfile`** - Frontend container

### Nginx Configuration
- **`frontend-vite/nginx.conf`** - Frontend nginx (local/container)
- **`nginx-ec2.conf`** - Backend nginx reverse proxy (EC2)

### Build Configuration
- **`frontend-vite/vite.config.js`** - Vite build settings with GitHub Pages support

---

## 🎬 Quick Start

### Option 1: Following the Checklist (Recommended for First Time)
```bash
# Read and follow:
cat DEPLOYMENT_CHECKLIST.md
```

### Option 2: Automated EC2 Deployment
```bash
# On EC2 instance:
git clone https://github.com/YOUR_USERNAME/ballerina-online-playground.git
cd ballerina-online-playground
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Option 3: Manual Setup
Follow **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed manual setup.

---

## 📊 Deployment Workflow

```
┌─────────────────────────────────────────────────┐
│ 1. Setup EC2 Instance                           │
│    - Launch t3.medium Ubuntu 22.04             │
│    - Configure security groups                  │
│    - Install Docker & Docker Compose           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 2. Deploy Backend on EC2                        │
│    - Run deploy-ec2.sh                         │
│    - Test: http://EC2_IP:8081/health           │
│    - (Optional) Setup Nginx reverse proxy       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 3. Configure GitHub Repository                  │
│    - Enable GitHub Pages                        │
│    - Add VITE_API_URL secret                   │
│    - Update vite.config.js                     │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 4. Deploy Frontend via GitHub Actions           │
│    - Push to main branch                        │
│    - GitHub Actions auto-deploys                │
│    - Access: github.io/username/repo           │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 5. Test & Verify                                │
│    - Test frontend loads                        │
│    - Test code execution                        │
│    - Check CORS configuration                   │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Prerequisites

### AWS Account
- Active AWS account
- EC2 permissions
- Payment method configured

### GitHub Account
- Repository with admin access
- GitHub Actions enabled (free for public repos)

### Local Machine
- Git installed
- SSH client
- Text editor

---

## 💰 Cost Estimate

### AWS EC2
- **t3.medium**: ~$30-35/month
- **Elastic IP**: Free when associated
- **Data Transfer**: First 100GB/month free, then ~$0.09/GB

### GitHub Pages
- **Free** for public repositories
- Unlimited bandwidth

**Total Monthly Cost**: ~$30-35

---

## 🔒 Security Considerations

### Implemented
✅ CORS configuration  
✅ Rate limiting (Nginx)  
✅ Security headers  
✅ Resource limits (Docker)  
✅ Firewall rules (UFW)  
✅ Health checks  

### Recommended (Optional)
🔐 SSL/TLS with Let's Encrypt  
🔐 Domain name with HTTPS  
🔐 fail2ban for SSH protection  
🔐 CloudFlare CDN  
🔐 AWS CloudWatch monitoring  

---

## 📈 Performance Features

### Frontend (Nginx)
- Auto-scaling workers
- Gzip compression
- Static asset caching (1 year)
- Health checks

### Backend (Go + Docker)
- HTTP timeouts configured
- Middleware chain
- Resource limits
- Log rotation

### Expected Results
- Page load: < 3 seconds
- Code execution: < 5 seconds
- 2-3x higher throughput
- 60-70% reduced server load

---

## 🆘 Getting Help

### Common Issues

**Port 80 already in use on EC2:**
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # If Apache is running
```

**GitHub Pages 404:**
- Check `base` path in vite.config.js
- Wait 5-10 minutes for deployment
- Clear browser cache

**CORS errors:**
- Verify `VITE_API_URL` secret
- Check backend CORS configuration
- Check browser console for details

**Backend health check fails:**
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Support Resources
- [GitHub Issues](https://github.com/YOUR_USERNAME/ballerina-online-playground/issues)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

## ✅ Post-Deployment

### Monitoring
```bash
# Check backend health
curl http://YOUR_EC2_IP:8081/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resources
docker stats
```

### Updates

**Backend Updates:**
```bash
cd ~/ballerina-playground/ballerina-online-playground
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

**Frontend Updates:**
```bash
# Just push to GitHub - auto-deploys via Actions
git push origin main
```

---

## 🎯 Next Steps After Deployment

1. ✅ Test the complete flow
2. 🔒 Set up SSL/TLS (if using domain)
3. 📊 Configure monitoring (CloudWatch, Uptime Robot)
4. 🔄 Set up automated backups
5. 📝 Update README with live demo link
6. 🎉 Share your project!

---

## 📞 Contact & Contributing

- **Issues**: Report bugs via GitHub Issues
- **Pull Requests**: Contributions welcome!
- **Documentation**: Help improve these guides

---

## 📄 License

See [LICENSE](./LICENSE) file for details.

---

**Last Updated**: October 2025  
**Maintainer**: Your Name

---

🚀 **Ready to deploy? Start with [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)!**
