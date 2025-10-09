# 🎯 Deployment Quick Reference Card

## 🚀 One-Command Deployments

### EC2 Backend (First Time)
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
git clone https://github.com/YOUR_USERNAME/ballerina-online-playground.git
cd ballerina-online-playground && chmod +x deploy-ec2.sh && ./deploy-ec2.sh
```

### GitHub Pages Frontend (First Time)
```bash
# 1. Go to GitHub repo Settings → Pages → Enable GitHub Actions
# 2. Add secret: VITE_API_URL = http://YOUR_EC2_IP:8081
# 3. Push to main branch
git push origin main
```

---

## 📍 Important URLs

| Service | URL Template | Example |
|---------|--------------|---------|
| Frontend | `https://USERNAME.github.io/REPO/` | `https://john.github.io/ballerina-playground/` |
| Backend | `http://EC2_IP:8081` | `http://54.160.240.225:8081` |
| Health Check | `http://EC2_IP:8081/health` | `http://54.160.240.225:8081/health` |

---

## 🔑 Critical Configuration Points

### 1. GitHub Secrets
```
Settings → Secrets and variables → Actions → New secret
Name: VITE_API_URL
Value: http://YOUR_EC2_IP:8081
```

### 2. vite.config.js
```javascript
base: '/YOUR_REPO_NAME/'  // Must match repository name
```

### 3. EC2 Security Group
- Port 22 (SSH) - Your IP
- Port 80 (HTTP) - 0.0.0.0/0
- Port 8081 (API) - 0.0.0.0/0

---

## ⚡ Common Commands

### EC2 Backend
```bash
# Status
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart

# Update
git pull && docker-compose -f docker-compose.prod.yml up --build -d

# Health
curl http://localhost:8081/health
```

### GitHub Pages
```bash
# Deploy (automatic on push)
git push origin main

# Manual trigger: Actions tab → Run workflow
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not responding | `docker-compose -f docker-compose.prod.yml restart` |
| CORS errors | Check `VITE_API_URL` secret and backend CORS config |
| GitHub Pages 404 | Check `base` in vite.config.js, wait 5-10 mins |
| Port in use | `sudo lsof -i :8081` then `sudo kill -9 PID` |

---

## 📊 Resource Requirements

### Minimum (Development)
- EC2: t3.micro (1 vCPU, 1GB RAM) - ~$7/month
- Works but slower

### Recommended (Production)
- EC2: t3.medium (2 vCPU, 4GB RAM) - ~$30/month
- Better performance and concurrency

### Optimal (High Traffic)
- EC2: t3.large (2 vCPU, 8GB RAM) - ~$60/month
- Handles 100+ concurrent users

---

## 🔒 Security Checklist

- [ ] EC2 Security Group configured
- [ ] UFW firewall enabled
- [ ] CORS restricted to GitHub Pages domain
- [ ] Rate limiting enabled (Nginx)
- [ ] SSL/TLS configured (optional)
- [ ] Regular updates scheduled

---

## 📈 Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Page Load | < 3 sec | _____ |
| Code Execution | < 5 sec | _____ |
| API Response | < 1 sec | _____ |
| Uptime | > 99% | _____ |

---

## 🆘 Emergency Contacts

| Issue | Action | Command |
|-------|--------|---------|
| Backend down | Restart | `docker-compose -f docker-compose.prod.yml restart` |
| High CPU | Check | `docker stats` |
| Out of disk | Clean | `docker system prune -a` |
| Can't SSH | Check | AWS Console → Security Groups |

---

## 📞 Support Resources

- **Full Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Commands**: [DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)
- **Architecture**: [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)

---

## 💾 Save These!

```bash
# EC2 Connection
ssh -i YOUR_KEY.pem ubuntu@YOUR_EC2_IP

# Your EC2 IP
EC2_IP=___________________

# Your GitHub Pages URL
GITHUB_URL=___________________

# Backend URL
BACKEND_URL=___________________
```

---

**Print this page and keep it handy!** 📄
