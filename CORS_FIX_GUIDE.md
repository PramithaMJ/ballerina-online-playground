# CORS Error Fix Guide

## Problem

You're seeing this error:
```
Access to fetch at 'https://experience-expansion-wear-asthma.trycloudflare.com/execute' 
from origin 'https://ballerina-online-playground.pages.dev' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Root Cause

The backend URL `https://experience-expansion-wear-asthma.trycloudflare.com` is a **Cloudflare tunnel** which has CORS restrictions and doesn't properly forward the CORS headers from your backend server.

## Solution Options

### Option 1: Use Production Server's Direct URL (RECOMMENDED)

Instead of using the Cloudflare tunnel, use your production server's actual domain or IP address.

#### Step 1: Get Your Server's Public IP/Domain

SSH to your server:
```bash
ssh your-username@bal-server-20251014-054132

# Get public IP
curl ifconfig.me

# Or check your domain
# Example: api.ballerina-playground.com
```

#### Step 2: Update Frontend Environment Variable

**For Cloudflare Pages:**

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages**
3. Select **ballerina-online-playground**
4. Go to **Settings** → **Environment variables**
5. Add/Update:
   ```
   VITE_API_URL = http://YOUR_SERVER_IP:8081
   # or
   VITE_API_URL = https://api.ballerina-playground.com
   ```

**For Local Development:**

Update `frontend-vite/.env`:
```bash
VITE_API_URL=http://YOUR_SERVER_IP:8081
# or
VITE_API_URL=https://api.ballerina-playground.com
```

#### Step 3: Ensure Backend Allows Your Domain

Your backend already has the correct CORS configuration in `backend/main.go`:
```go
origins := []string{
    "https://ballerina-online-playground.pages.dev",
    "https://pramithamj.github.io",
    "http://localhost:5173",
    "http://localhost:8080",
}
```

This should work once you're using the direct backend URL!

---

### Option 2: Keep Cloudflare Tunnel BUT Fix CORS

If you want to keep using the Cloudflare tunnel, you need to configure it properly.

#### Step 1: Update Cloudflare Tunnel Config

On your server, edit the tunnel configuration:

```bash
# Find your tunnel config
cd ~/.cloudflared/
cat config.yml
```

Add origin request configuration:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /path/to/credentials.json

ingress:
  - hostname: experience-expansion-wear-asthma.trycloudflare.com
    service: http://localhost:8081
    originRequest:
      noTLSVerify: true
      originServerName: experience-expansion-wear-asthma.trycloudflare.com
      # These don't always work with tunnels
      httpHostHeader: experience-expansion-wear-asthma.trycloudflare.com
  - service: http_status:404
```

**Note:** Cloudflare tunnels often strip/modify CORS headers, making this unreliable.

---

### Option 3: Add Reverse Proxy with Cloudflare Pages Functions (ADVANCED)

Create a proxy in Cloudflare Pages to forward requests to your backend.

#### Create `frontend-vite/functions/api/[[path]].js`:

```javascript
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const backendUrl = context.env.BACKEND_URL || 'http://YOUR_SERVER_IP:8081';
  
  // Forward the request to your backend
  const backendRequest = new URL(url.pathname, backendUrl);
  backendRequest.search = url.search;
  
  const response = await fetch(backendRequest, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });
  
  // Add CORS headers
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, CF-Turnstile-Token');
  
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
```

Then set frontend to use `/api` as backend:
```bash
VITE_API_URL=/api
```

---

## Recommended Solution

**Use Option 1** - Direct server URL. It's:
- ✅ Most reliable
- ✅ Better performance (no tunnel overhead)
- ✅ Proper CORS support
- ✅ Easier to debug

## Quick Fix Steps

1. **Get your server's public IP:**
   ```bash
   ssh bal-server-20251014-054132
   curl ifconfig.me
   # Output: YOUR_IP_ADDRESS
   ```

2. **Update Cloudflare Pages environment variable:**
   - Go to Cloudflare Dashboard
   - Set: `VITE_API_URL = http://YOUR_IP_ADDRESS:8081`

3. **Redeploy frontend:**
   ```bash
   git commit --allow-empty -m "Trigger redeployment"
   git push
   ```

4. **Verify backend is accessible:**
   ```bash
   curl http://YOUR_IP_ADDRESS:8081/health
   ```

5. **Test from production:**
   - Visit https://ballerina-online-playground.pages.dev/
   - Complete Turnstile
   - Run code
   - Should work! ✅

---

## Troubleshooting

### Backend not accessible from outside

If your backend is only listening on localhost, update `backend/main.go`:

```go
// Change from:
log.Fatal(http.ListenAndServe(":8081", nil))

// To:
log.Fatal(http.ListenAndServe("0.0.0.0:8081", nil))
```

Then restart:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Firewall blocking port 8081

Open the port:
```bash
sudo ufw allow 8081/tcp
sudo ufw reload
```

### Need HTTPS for production

Use a reverse proxy (Nginx/Caddy) with Let's Encrypt:

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/ballerina-api

# Add:
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/ballerina-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d api.your-domain.com
```

Then use: `VITE_API_URL=https://api.your-domain.com`

---

## Summary

**Current Issue:** Cloudflare tunnel CORS blocking  
**Best Fix:** Use direct server URL  
**Alternative:** Set up proper reverse proxy with SSL  

**Expected result:** No more CORS errors, Turnstile verification works, code execution succeeds! ✅
