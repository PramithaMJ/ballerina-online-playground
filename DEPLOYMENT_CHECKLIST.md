# 🚀 Quick Deployment Checklist

Use this checklist to ensure a smooth deployment of your Ballerina Playground.

## 📋 Pre-Deployment Checklist

### Repository Setup
- [ ] Repository is public (or have GitHub Pages enabled for private repo)
- [ ] Code is pushed to GitHub
- [ ] Main branch is up to date

### AWS Account Setup
- [ ] AWS account created and verified
- [ ] Payment method added
- [ ] IAM user with EC2 permissions (optional but recommended)

## 🖥️ EC2 Backend Deployment

### 1. Launch EC2 Instance
- [ ] Instance Type: t3.medium or larger
- [ ] AMI: Ubuntu 22.04 LTS
- [ ] Storage: 20GB gp3
- [ ] Key pair created/downloaded
- [ ] Security group configured:
  - [ ] Port 22 (SSH) - Your IP
  - [ ] Port 80 (HTTP) - 0.0.0.0/0
  - [ ] Port 8081 (API) - 0.0.0.0/0
- [ ] Instance launched successfully
- [ ] Public IP noted: `____________________`

### 2. Connect to EC2
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```
- [ ] Successfully connected to EC2

### 3. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/ballerina-online-playground.git
cd ballerina-online-playground
```
- [ ] Repository cloned

### 4. Run Deployment Script
```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Backend container running
- [ ] Health check passing

### 5. Test Backend
```bash
curl http://localhost:8081/health
```
- [ ] Backend responds with healthy status
- [ ] Can access from public IP: `http://YOUR_EC2_IP:8081/health`

### 6. Optional: Setup Nginx (Recommended)
```bash
sudo apt install nginx -y
sudo cp nginx-ec2.conf /etc/nginx/sites-available/ballerina-backend
# Edit the file and replace YOUR_EC2_IP_OR_DOMAIN and YOUR_USERNAME
sudo nano /etc/nginx/sites-available/ballerina-backend
sudo ln -s /etc/nginx/sites-available/ballerina-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```
- [ ] Nginx installed and configured
- [ ] Nginx serving backend on port 80

### 7. Setup Auto-Start
```bash
# Copy from DEPLOYMENT_GUIDE.md
sudo nano /etc/systemd/system/ballerina-backend.service
sudo systemctl daemon-reload
sudo systemctl enable ballerina-backend.service
sudo systemctl start ballerina-backend.service
```
- [ ] Systemd service created
- [ ] Service enabled on boot

## 🌐 GitHub Pages Frontend Deployment

### 1. Update Repository Settings
- [ ] Go to **Settings** → **Pages**
- [ ] Source: **GitHub Actions**

### 2. Add Secrets
- [ ] Go to **Settings** → **Secrets and variables** → **Actions**
- [ ] Add secret: `VITE_API_URL` = `http://YOUR_EC2_IP:8081`

### 3. Update Configuration Files
- [ ] Update `vite.config.js` base path to your repo name
- [ ] Verify `.github/workflows/deploy-github-pages.yml` exists

### 4. Update Repository Name in Files
Replace `ballerina-online-playground` with your actual repo name in:
- [ ] `frontend-vite/vite.config.js` (base path)
- [ ] `.github/workflows/deploy-github-pages.yml` (if needed)

### 5. Push Changes
```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```
- [ ] Changes pushed to GitHub

### 6. Monitor Deployment
- [ ] Go to **Actions** tab
- [ ] Watch "Deploy to GitHub Pages" workflow
- [ ] Wait for green checkmark ✅

### 7. Test Frontend
- [ ] Visit: `https://YOUR_USERNAME.github.io/ballerina-online-playground/`
- [ ] Page loads correctly
- [ ] No console errors

## 🔗 Integration Testing

### Test Complete Flow
- [ ] Frontend loads from GitHub Pages
- [ ] Can write Ballerina code in editor
- [ ] Click "Run" button
- [ ] Code executes on EC2 backend
- [ ] See output in frontend
- [ ] No CORS errors in browser console

### Test Sample Code
```ballerina
import ballerina/io;

public function main() {
    io:println("Hello from GitHub Pages + EC2!");
}
```
- [ ] Sample code runs successfully
- [ ] Output displayed correctly

## 🔒 Security Hardening (Optional but Recommended)

### Backend Security
- [ ] Configure UFW firewall
- [ ] Set up rate limiting in Nginx
- [ ] Update CORS to specific domain (not *)
- [ ] Enable fail2ban for SSH protection

### SSL/TLS Setup
- [ ] Register domain name (optional)
- [ ] Point domain to EC2 IP
- [ ] Install certbot
- [ ] Get SSL certificate
- [ ] Update Nginx for HTTPS
- [ ] Update GitHub secret to HTTPS URL
- [ ] Test HTTPS connection

## 📊 Monitoring Setup (Optional)

- [ ] Set up CloudWatch alarms
- [ ] Configure log rotation
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure backup snapshots

## 📝 Documentation

- [ ] Note backend URL: `____________________`
- [ ] Note frontend URL: `____________________`
- [ ] Save EC2 SSH key safely
- [ ] Document any custom configurations

## ✅ Final Verification

### Smoke Test
1. [ ] Open frontend URL
2. [ ] Write and run code
3. [ ] Verify output appears
4. [ ] Test on mobile device
5. [ ] Test on different browsers

### Performance Check
- [ ] Page loads in < 3 seconds
- [ ] Code execution < 5 seconds
- [ ] No memory leaks in browser

### Availability
- [ ] Backend health check: `http://YOUR_EC2_IP/health`
- [ ] Service auto-restarts on EC2 reboot
- [ ] Logs are accessible

## 🎉 Post-Deployment

### Share Your Work
- [ ] Update README with live demo link
- [ ] Share on social media
- [ ] Add to portfolio

### Maintenance Plan
- [ ] Schedule weekly backend updates
- [ ] Monitor AWS billing
- [ ] Review logs monthly
- [ ] Update dependencies quarterly

---

## 📞 Support Resources

- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Performance Guide**: [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🐛 Common Issues

### "502 Bad Gateway"
- Check backend is running: `docker-compose -f docker-compose.prod.yml ps`
- Check logs: `docker-compose -f docker-compose.prod.yml logs backend`

### "CORS Error"
- Verify `VITE_API_URL` secret is correct
- Check backend CORS configuration
- Ensure Nginx CORS headers are set

### "GitHub Pages 404"
- Verify base path in vite.config.js
- Wait 5-10 minutes for deployment
- Clear browser cache

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Notes**: _______________________________________________
