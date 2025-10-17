# 🚀 Quick Start Guide - Cloudflare Turnstile

Get your Ballerina Online Playground running with Cloudflare Turnstile verification in 5 minutes!

---

## 📋 Prerequisites

- Cloudflare account
- Node.js 16+ and npm
- Go 1.19+ (for backend)

---

## 🔑 Step 1: Get Cloudflare Turnstile Keys

1. **Login to Cloudflare Dashboard:**
   - Visit: https://dash.cloudflare.com
   - Navigate to **Turnstile** section

2. **Create a New Widget:**
   ```
   Widget Name: Ballerina Playground
   Widget Mode: Managed (Recommended)
   Hostname: your-domain.pages.dev
   ```

3. **Copy Your Keys:**
   ```
   Site Key (Public):   0x4AAAAAAB6jL0I4aI-Hqryo
   Secret Key (Private): 0x4AAAAAAAxxxxxxxxxxxxxxxxxx
   ```
    **Keep the Secret Key private!** Never commit it to Git.

---

## ⚙️ Step 2: Configure Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd frontend-vite
   ```

2. **Create/Update `.env` file:**
   ```bash
   # Copy from your Cloudflare dashboard
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB6jL0I4aI-Hqryo
   VITE_ENABLE_VERIFICATION=true
   VITE_API_URL=http://localhost:8081
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

---

##  Step 3: Configure Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create/Update `.env` file:**
   ```bash
   #  IMPORTANT: Use your SECRET KEY from Cloudflare (not site key!)
   TURNSTILE_SECRET_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxxxx
   ENABLE_TURNSTILE_VERIFICATION=true
   
   # Server Configuration
   PORT=8081
   ALLOWED_ORIGIN=http://localhost:5173
   
   # Rate Limiting
   RATE_LIMIT_REQUESTS=5
   RATE_LIMIT_PERIOD=5s
   ```

3. **Install dependencies:**
   ```bash
   go mod download
   ```

4. **Run the server:**
   ```bash
   go run main.go
   ```

---

##  Step 4: Test the Implementation

1. **Open your browser:**
   ```
   http://localhost:5173
   ```

2. **You should see:**
   -  Human Verification screen
   - Turnstile challenge widget
   - Loading state while initializing

3. **Complete the verification:**
   - Click the checkbox (if shown)
   - Wait for " Verified" message
   - Playground should load

4. **Test code execution:**
   ```ballerina
   import ballerina/io;
   
   public function main() {
       io:println("Hello, Ballerina!");
   }
   ```
   - Click "▶ Run"
   - Should execute successfully
   - Fresh token generated automatically

---

## 🔍 Step 5: Verify Everything Works

### Frontend Checklist

- [ ] Verification widget appears on page load
- [ ] Verification completes successfully
- [ ] Playground loads after verification
- [ ] Session persists on page refresh (< 4 min)
- [ ] Code execution works

### Backend Checklist

- [ ] Server starts without errors
- [ ] Turnstile verification enabled log appears
- [ ] API requests include `CF-Turnstile-Token` header
- [ ] Token validation succeeds
- [ ] Invalid tokens are rejected

### Browser Console (DevTools)

Expected logs:
```
 Turnstile API loaded successfully
✓ Turnstile widget rendered
 Initial verification successful
🚀 Initializing on-demand token generator...
 Token generator ready
🎫 Generating fresh Turnstile token...
 Fresh token generated
```

### Backend Logs

Expected logs:
```
Starting Ballerina Compiler Backend...
🛡️ Turnstile verification enabled
Server started on port 8081
 Turnstile verification successful from [IP]
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Missing verification token"

**Symptoms:** API requests fail with 401 error

**Solution:**
```bash
# Check frontend .env
cat frontend-vite/.env

# Verify site key is set
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB6jL0I4aI-Hqryo
```

### Issue 2: "Invalid input secret"

**Symptoms:** Backend logs show "Invalid secret key" error

**Solution:**
```bash
# Check backend .env
cat backend/.env

# Verify you're using SECRET KEY (not site key!)
# Secret key should start with: 0x4AAAAAAAxxxxxx
TURNSTILE_SECRET_KEY=<YOUR_SECRET_KEY>
```

### Issue 3: Verification widget doesn't appear

**Symptoms:** Stuck on loading screen

**Solution:**
1. Check browser console for errors
2. Verify internet connection
3. Check if Cloudflare Turnstile API is accessible
4. Clear browser cache and reload

### Issue 4: CORS errors

**Symptoms:** Network errors in browser console

**Solution:**
```bash
# Update backend .env
ALLOWED_ORIGIN=http://localhost:5173

# Or update backend/main.go allowedOrigins array
allowedOrigins := []string{
    "http://localhost:5173",
    "https://your-domain.pages.dev",
}
```

---

## 🧪 Testing with Test Keys

For **development/testing**, use Cloudflare's test keys:

**Frontend `.env`:**
```bash
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
VITE_ENABLE_VERIFICATION=true
```

**Backend `.env`:**
```bash
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ENABLE_TURNSTILE_VERIFICATION=true
```

**Result:** All verifications will pass (useful for testing)

---

## 🚀 Production Deployment

### Cloudflare Pages (Frontend)

1. **Set Environment Variables:**
   ```
   VITE_TURNSTILE_SITE_KEY=<production_site_key>
   VITE_ENABLE_VERIFICATION=true
   VITE_API_URL=<production_backend_url>
   ```

2. **Add Hostname to Turnstile Widget:**
   - Go to Cloudflare Dashboard → Turnstile
   - Edit your widget
   - Add: `your-app.pages.dev`

### Backend Deployment

1. **Set Environment Variables:**
   ```bash
   TURNSTILE_SECRET_KEY=<production_secret_key>
   ENABLE_TURNSTILE_VERIFICATION=true
   ALLOWED_ORIGIN=https://your-app.pages.dev
   ```

2. **Update Expected Hostnames** in `backend/middleware/turnstile.go`:
   ```go
   ExpectedHostnames: []string{
       "your-app.pages.dev",
       "your-custom-domain.com",
   }
   ```

---

## 📊 Monitoring

### Cloudflare Dashboard

Check verification metrics:
```
https://dash.cloudflare.com → Turnstile → Your Widget → Analytics
```

Metrics to monitor:
- **Challenge Solve Rate:** Should be > 95%
- **Bot Detection Rate:** Higher is better
- **Failed Verifications:** Investigate if > 5%

### Application Logs

**Frontend (Browser Console):**
- Token generation time
- Verification success/failure
- API request status

**Backend (Server Logs):**
- Verification attempts
- Token validation results
- Rate limit hits

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to Git
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Rotate secret keys** every 6 months
   - Generate new secret key in Cloudflare dashboard
   - Update backend `.env`
   - Deploy changes

3. **Monitor for suspicious activity**
   - Unusual verification failure spikes
   - Multiple token reuse attempts
   - Geographic anomalies

4. **Use HTTPS** in production
   - Both frontend and backend
   - Required for Turnstile to work properly

---

## 📚 Next Steps

- Read full documentation: [TURNSTILE_PRODUCTION_IMPLEMENTATION.md](./TURNSTILE_PRODUCTION_IMPLEMENTATION.md)
- Review architecture diagrams in `/docs` folder
- Configure rate limiting for your needs
- Set up monitoring and alerting

---

## 💡 Tips

- **Development:** Use test keys for faster iteration
- **Staging:** Use production keys to test real verification
- **Production:** Monitor metrics and adjust widget mode if needed

---

## 🆘 Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/turnstile/
- GitHub Issues: Open an issue in your repository
- Cloudflare Community: https://community.cloudflare.com/

---

**Happy Coding! 🎉**
