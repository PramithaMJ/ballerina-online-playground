# 🔒 Enable HTTPS on EC2 Backend

## Problem
GitHub Pages (HTTPS) cannot connect to EC2 backend (HTTP) due to browser security (Mixed Content blocking).

## Solution Options

---

## ⭐ Option 1: Use Cloudflare Tunnel (FREE & EASIEST)

### Why Cloudflare Tunnel?
-  FREE HTTPS certificate
-  No need to configure nginx/SSL
-  Automatic certificate renewal
-  DDoS protection included
-  Takes 5 minutes to setup

### Steps:

#### 1. Install Cloudflare Tunnel on EC2
```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify installation
cloudflared --version
```

#### 2. Authenticate with Cloudflare
```bash
cloudflared tunnel login
```
This will open a browser - login to Cloudflare and select your domain.

#### 3. Create a Tunnel
```bash
# Create tunnel named "ballerina-backend"
cloudflared tunnel create ballerina-backend

# Note the Tunnel ID from output
```

#### 4. Configure the Tunnel
Create config file:
```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Add this content (replace YOUR_TUNNEL_ID with actual ID):
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.yourdomain.com  # Change to your subdomain
    service: http://localhost:8081
  - service: http_status:404
```

#### 5. Create DNS Record
```bash
cloudflared tunnel route dns ballerina-backend api.yourdomain.com
```

#### 6. Run as Service
```bash
# Install as system service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

#### 7. Update GitHub Secrets
Go to: `https://github.com/PramithaMJ/ballerina-online-playground/settings/secrets/actions`

Update `VITE_API_URL` to: `https://api.yourdomain.com`

#### 8. Redeploy Frontend
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

 Done! Your backend now has HTTPS via Cloudflare.

---

## Option 2: Let's Encrypt with Nginx (Traditional Way)

### Prerequisites
- A domain name pointing to your EC2 IP
- Port 80 and 443 open in EC2 security group

### Steps:

#### 1. Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Configure Nginx
Create nginx config:
```bash
sudo nano /etc/nginx/sites-available/ballerina-backend
```

Add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ballerina-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. Get SSL Certificate
```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow prompts:
- Enter email
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

#### 4. Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
```

#### 5. Update GitHub Secrets
Update `VITE_API_URL` to: `https://api.yourdomain.com`

---

## Option 3: AWS Application Load Balancer (AWS Native)

### Steps:

#### 1. Create Target Group
```bash
# In AWS Console:
EC2 → Target Groups → Create target group
- Type: Instances
- Protocol: HTTP
- Port: 8081
- Health check path: /health
- Register your EC2 instance
```

#### 2. Request SSL Certificate (AWS Certificate Manager)
```bash
# In AWS Console:
Certificate Manager → Request certificate
- Fully qualified domain name: api.yourdomain.com
- Validation method: DNS
- Add CNAME record to your DNS
```

#### 3. Create Application Load Balancer
```bash
# In AWS Console:
EC2 → Load Balancers → Create load balancer
- Type: Application Load Balancer
- Listener: HTTPS (443)
- SSL certificate: Select from ACM
- Target group: Select created target group
```

#### 4. Update DNS
Point `api.yourdomain.com` to ALB DNS name

#### 5. Update GitHub Secrets
Update `VITE_API_URL` to: `https://api.yourdomain.com`

---

## ⚡ Option 4: Quick Test (HTTP - NOT for Production)

If you just want to test quickly (not secure):

### Update Frontend to Allow HTTP

#### 1. Modify GitHub Actions Workflow
```bash
# Edit: .github/workflows/deploy-github-pages.yml
# Add to build step:
env:
  VITE_API_URL: http://54.160.240.225:8081
  VITE_ALLOW_HTTP: true
```

#### 2. Update App.jsx to Allow HTTP
This requires adding special handling in your frontend code, but browsers will still block it by default.

**This won't work reliably due to browser security policies!**

---

## 🏆 Recommendation

**Use Cloudflare Tunnel (Option 1)** because:
1.  Completely FREE
2.  Easiest to setup (5 minutes)
3.  No domain DNS configuration needed
4.  Auto-renewing certificates
5.  Built-in DDoS protection
6.  Better performance with CDN

---

## 📝 After HTTPS is Setup

Test your backend:
```bash
curl https://api.yourdomain.com/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "ballerina-compiler-backend"
}
```

Then test from frontend at: https://pramithamj.github.io/ballerina-online-playground/

---

## 🆘 Troubleshooting

### Cloudflare Tunnel Not Working?
```bash
# Check tunnel status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared
```

### Certificate Issues?
```bash
# Check certificate
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Still Getting CORS Errors?
Your backend already has CORS enabled (`Access-Control-Allow-Origin: *`), so HTTPS should fix it.

If not, check:
```bash
# Test CORS headers
curl -I https://api.yourdomain.com/health
```

Should see:
```
Access-Control-Allow-Origin: *
```

---

## 🎯 Next Steps

1. **Choose Option 1 (Cloudflare Tunnel)** - Recommended
2. Setup takes ~5 minutes
3. Update GitHub Secret `VITE_API_URL`
4. Redeploy frontend
5. Test! 
