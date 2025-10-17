#  Implementation Checklist

Use this checklist to deploy your Cloudflare Turnstile implementation.

---

##  Pre-Deployment Setup

### 1. Cloudflare Dashboard Configuration

- [ ] Login to https://dash.cloudflare.com
- [ ] Navigate to **Turnstile** section
- [ ] Create new widget:
  - **Name:** Ballerina Playground
  - **Mode:** Managed (recommended)
  - **Hostname:** `ballerina-online-playground.pages.dev`
- [ ] Copy **Site Key** (starts with `0x4AAAAAAB...`)
- [ ] Copy **Secret Key** (starts with `0x4AAAAAAA...`)
- [ ]  **IMPORTANT:** Site Key ≠ Secret Key (they are different!)

### 2. Frontend Configuration

File: `frontend-vite/.env`

- [ ] Set `VITE_TURNSTILE_SITE_KEY` to your **Site Key**
- [ ] Set `VITE_ENABLE_VERIFICATION=true`
- [ ] Set `VITE_API_URL` to your backend URL
- [ ]  **DO NOT** use Secret Key in frontend!

Example:
```bash
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB6jL0I4aI-Hqryo
VITE_ENABLE_VERIFICATION=true
VITE_API_URL=https://your-backend.trycloudflare.com
```

### 3. Backend Configuration

File: `backend/.env`

- [ ] Set `TURNSTILE_SECRET_KEY` to your **Secret Key**
- [ ] Set `ENABLE_TURNSTILE_VERIFICATION=true`
- [ ] Set `ALLOWED_ORIGIN` to your frontend URL
- [ ]  **DO NOT** commit `.env` file to Git!

Example:
```bash
TURNSTILE_SECRET_KEY=0x4AAAAAAA<your-secret-key-here>
ENABLE_TURNSTILE_VERIFICATION=true
ALLOWED_ORIGIN=https://ballerina-online-playground.pages.dev
```

### 4. Update Backend Hostnames

File: `backend/middleware/turnstile.go`

- [ ] Add your production hostname to `ExpectedHostnames`:

```go
ExpectedHostnames: []string{
    "ballerina-online-playground.pages.dev",
    "your-custom-domain.com", // Add your domain here
    "localhost",
    "127.0.0.1",
}
```

### 5. Update Frontend CORS

File: `backend/main.go`

- [ ] Add your frontend URL to `allowedOrigins`:

```go
allowedOrigins := []string{
    "https://ballerina-online-playground.pages.dev",
    "https://your-custom-domain.com", // Add your domain here
    "http://localhost:5173",
}
```

---

## 🧪 Local Testing

### Test with Development Keys

Use Cloudflare's test keys that always pass:

**Frontend** (`.env`):
```bash
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
VITE_ENABLE_VERIFICATION=true
VITE_API_URL=http://localhost:8081
```

**Backend** (`.env`):
```bash
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ENABLE_TURNSTILE_VERIFICATION=true
ALLOWED_ORIGIN=http://localhost:5173
```

### Start Services

#### Terminal 1: Backend
```bash
cd backend
go run main.go
```

Expected output:
```
Starting Ballerina Compiler Backend...
🛡️ Turnstile verification enabled
Server started on port 8081
```

#### Terminal 2: Frontend
```bash
cd frontend-vite
npm install
npm run dev
```

Expected output:
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Verification Checklist

- [ ] Open http://localhost:5173
- [ ] Verification screen appears
- [ ] Turnstile widget loads
- [ ] Complete verification (automatic with test keys)
- [ ] Playground loads successfully
- [ ] Write sample Ballerina code
- [ ] Click "Run" button
- [ ] Code executes successfully
- [ ] No errors in browser console
- [ ] No errors in backend logs

### Browser Console Checks

Expected logs:
```
 Turnstile API loaded successfully
✓ Turnstile widget rendered
 Initial verification successful
🚀 Initializing on-demand token generator...
 Token generator ready
[ApiService] 📤 API Request #1 starting...
[ApiService] 🎫 Token attached to request #1
[ApiService]  Request #1 completed successfully
```

### Backend Logs Checks

Expected logs:
```
 Turnstile verification successful from 127.0.0.1 (hostname: localhost)
POST /execute - 1.234s
```

---

## 🚀 Production Deployment

### 1. Cloudflare Pages (Frontend)

#### Set Environment Variables

In Cloudflare Pages dashboard:

- [ ] Go to **Settings** → **Environment Variables**
- [ ] Add variable:
  - **Name:** `VITE_TURNSTILE_SITE_KEY`
  - **Value:** Your production site key
  - **Type:** Plaintext
- [ ] Add variable:
  - **Name:** `VITE_ENABLE_VERIFICATION`
  - **Value:** `true`
  - **Type:** Plaintext
- [ ] Add variable:
  - **Name:** `VITE_API_URL`
  - **Value:** Your production backend URL
  - **Type:** Plaintext

#### Deploy

- [ ] Push code to your Git repository
- [ ] Cloudflare Pages will auto-deploy
- [ ] Verify build succeeds
- [ ] Test the deployed site

### 2. Backend Deployment

#### Set Environment Variables

In your hosting platform (Heroku/Railway/AWS/etc):

- [ ] Add `TURNSTILE_SECRET_KEY` with your production secret key
- [ ] Add `ENABLE_TURNSTILE_VERIFICATION=true`
- [ ] Add `ALLOWED_ORIGIN` with your frontend URL
- [ ] Add other required environment variables

#### Deploy

- [ ] Deploy backend to your hosting platform
- [ ] Verify server starts successfully
- [ ] Check logs for "Turnstile verification enabled"
- [ ] Test API endpoint is accessible

### 3. Cloudflare Turnstile Widget

#### Update Hostnames

- [ ] Go to https://dash.cloudflare.com → Turnstile
- [ ] Edit your widget
- [ ] Add production hostname: `ballerina-online-playground.pages.dev`
- [ ] Add custom domain (if applicable)
- [ ] Save changes

---

##  Post-Deployment Verification

### Frontend Checks

- [ ] Visit your production URL
- [ ] Verification screen appears
- [ ] Turnstile widget loads (not test widget)
- [ ] Complete verification
- [ ] Playground loads
- [ ] No console errors
- [ ] Code execution works
- [ ] Session persists on refresh (< 4 min)

### Backend Checks

- [ ] Check server logs
- [ ] Verify "Turnstile verification enabled" message
- [ ] Test API endpoints return expected responses
- [ ] Verify tokens are being validated
- [ ] Check for any error logs

### Security Checks

- [ ] `.env` files NOT committed to Git
- [ ] Secret key NOT exposed in frontend
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] Invalid tokens rejected

### Monitoring Setup

- [ ] Check Cloudflare Turnstile Analytics
- [ ] Verify challenges being served
- [ ] Monitor solve rate (should be >95%)
- [ ] Set up alerts for verification failures
- [ ] Monitor backend logs for suspicious activity

---

## 📊 Health Check Endpoints

### Backend Health

Test: `GET https://your-backend-url.com/health`

Expected response:
```json
{
  "status": "healthy",
  "service": "ballerina-compiler-backend",
  "security": "enabled"
}
```

---

## 🐛 Troubleshooting

### Issue: "Missing verification token"

**Fix:**
- [ ] Check `VITE_TURNSTILE_SITE_KEY` is set in frontend
- [ ] Verify token generator initialized
- [ ] Check browser console for errors

### Issue: "Invalid input secret"

**Fix:**
- [ ] Verify `TURNSTILE_SECRET_KEY` in backend `.env`
- [ ] Confirm you're using SECRET KEY (not site key)
- [ ] Check Cloudflare dashboard for correct key

### Issue: Verification widget doesn't appear

**Fix:**
- [ ] Check internet connection
- [ ] Verify site key is correct
- [ ] Clear browser cache
- [ ] Check browser console for errors

### Issue: CORS errors

**Fix:**
- [ ] Update `ALLOWED_ORIGIN` in backend `.env`
- [ ] Add frontend URL to `allowedOrigins` in `main.go`
- [ ] Verify both HTTP and HTTPS if applicable

### Issue: "Token already used"

**Expected behavior** - This is normal! Each token is single-use.

**If happening frequently:**
- [ ] Check if frontend is reusing tokens
- [ ] Verify token generator is creating fresh tokens
- [ ] Check for unnecessary API retries

---

## 📈 Success Metrics

After deployment, monitor these metrics:

### Cloudflare Dashboard
- **Challenge Solve Rate:** Target >95%
- **Bot Detection Rate:** Higher is better
- **Failed Verifications:** Should be <5%

### Application Metrics
- **API Success Rate:** Target >99%
- **Token Generation Time:** Target <3 seconds
- **Verification Errors:** Should be minimal

---

## 🎓 Documentation Review

Before going live, review:

- [ ] [TURNSTILE_PRODUCTION_IMPLEMENTATION.md](./TURNSTILE_PRODUCTION_IMPLEMENTATION.md) - Full guide
- [ ] [TURNSTILE_QUICK_START.md](./TURNSTILE_QUICK_START.md) - Quick reference
- [ ] [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Overview
- [ ] Cloudflare Turnstile docs: https://developers.cloudflare.com/turnstile/

---

##  Security Checklist

- [ ] Secret key stored securely (not in Git)
- [ ] HTTPS enabled on production
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Hostname validation active
- [ ] Token replay prevention working
- [ ] Server-side validation enabled
- [ ] Monitoring and logging active

---

## 🎉 Launch!

Once all items are checked:

- [ ] **Deploy frontend** to Cloudflare Pages
- [ ] **Deploy backend** to your hosting platform
- [ ] **Test thoroughly** with production keys
- [ ] **Monitor metrics** in Cloudflare dashboard
- [ ] **Announce launch** 🚀

---

## 📝 Notes

- Verification session lasts **4 minutes**
- Tokens are **single-use only**
- Fresh token generated for **each API request**
- Rate limit: **5 requests per 5 seconds**
- Secret key should be rotated **every 6 months**

---

## 💡 Pro Tips

1. Use **test keys** during development
2. Test with **production keys** in staging
3. Monitor **Cloudflare Analytics** daily for first week
4. Set up **alerts** for verification failure spikes
5. Keep **documentation updated** as you make changes

---

**Ready to Launch?** You've got this! 🚀

**Last Updated:** October 17, 2025
