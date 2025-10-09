# 🚨 CORS/HTTPS Issue - Quick Fix

## Current Status
- ✅ Backend running: http://54.160.240.225:8081/health
- ✅ Frontend deployed: https://pramithamj.github.io/ballerina-online-playground/
- ❌ Connection blocked: HTTPS → HTTP mixed content error

## Problem
Browser blocks HTTPS (GitHub Pages) from calling HTTP (EC2 backend) for security reasons.

## 🎯 Solution: Enable HTTPS on Backend

### Fastest Option: Cloudflare Tunnel (5 mins, FREE)

```bash
# On EC2 - Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create ballerina-backend

# Create config
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

**Add to config.yml** (replace YOUR_TUNNEL_ID and domain):
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ballerina-api.yourdomain.com
    service: http://localhost:8081
  - service: http_status:404
```

```bash
# Setup DNS
cloudflared tunnel route dns ballerina-backend ballerina-api.yourdomain.com

# Install as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Update GitHub Repository Secret

1. Go to: https://github.com/PramithaMJ/ballerina-online-playground/settings/secrets/actions
2. Find `VITE_API_URL` secret
3. Update value to: `https://ballerina-api.yourdomain.com`
4. Trigger redeploy:
   ```bash
   git commit --allow-empty -m "Update API URL to HTTPS"
   git push
   ```

### Test
```bash
# Test backend with HTTPS
curl https://ballerina-api.yourdomain.com/health

# Should return:
# {"status":"healthy","service":"ballerina-compiler-backend"}
```

Then visit: https://pramithamj.github.io/ballerina-online-playground/

## Alternative: If You Don't Have a Domain

### Option A: Use Cloudflare's Free Subdomain
Cloudflare can provide a free `*.trycloudflare.com` subdomain automatically!

```bash
# On EC2 - Run tunnel without config
cloudflared tunnel --url http://localhost:8081
```

This gives you a temporary HTTPS URL like: `https://random-name.trycloudflare.com`

**For Permanent URL:**
```bash
# Run with name
cloudflared tunnel --name ballerina run --url http://localhost:8081
```

Update `VITE_API_URL` to the provided URL.

### Option B: Use AWS CloudFront (Free Tier)
See full guide in `HTTPS_SETUP_GUIDE.md`

## Why This Happens

```
GitHub Pages (HTTPS)
       ↓
   🚫 BLOCKED by browser security
       ↓
   EC2 Backend (HTTP)
```

**Browsers block "mixed content" (HTTPS → HTTP requests) for security.**

## ✅ Success Checklist

- [ ] Backend accessible via HTTPS
- [ ] `curl https://your-backend-url/health` returns JSON
- [ ] Updated `VITE_API_URL` GitHub secret
- [ ] Redeployed frontend (git push)
- [ ] Tested from GitHub Pages URL
- [ ] Can execute Ballerina code successfully

## 🆘 Quick Troubleshooting

### Cloudflare Tunnel Not Starting?
```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

### Still Getting CORS Error After HTTPS?
Your backend already has CORS enabled, but verify:
```bash
curl -I https://your-backend-url/health | grep Access-Control
```

Should see: `Access-Control-Allow-Origin: *`

### Frontend Not Picking Up New API URL?
```bash
# Clear GitHub Actions cache
# Go to: https://github.com/PramithaMJ/ballerina-online-playground/actions
# Click on workflow → Delete workflow run
# Push again to trigger fresh build
```

## 📚 Full Documentation
See `HTTPS_SETUP_GUIDE.md` for:
- Detailed Cloudflare setup
- Let's Encrypt with Nginx
- AWS Load Balancer setup
- Troubleshooting guide

---

**Recommended: Use Cloudflare Tunnel - It's the fastest and easiest! 🚀**
