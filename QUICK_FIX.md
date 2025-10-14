# Quick Fix Checklist - Turnstile Widget Not Showing

## The Problem
✅ Backend working (verification enabled)  
✅ Frontend code updated  
❌ **Widget not appearing** → Missing Cloudflare Pages environment variable

## The Solution (5 Minutes)

### 1️⃣ Open Cloudflare Dashboard
🔗 https://dash.cloudflare.com/

### 2️⃣ Navigate to Your Project
- Click "Workers & Pages" (left sidebar)
- Click "ballerina-online-playground"
- Click "Settings" tab

### 3️⃣ Add Environment Variable
- Scroll to "Environment variables"
- Click "Add variable"

**Add this:**
```
Variable name: VITE_TURNSTILE_SITE_KEY
Value:         0x4AAAAAAB6jL0I4aI-Hqryo
Environment:   Production
```

- Click "Save"

### 4️⃣ Redeploy
- Go to "Deployments" tab
- Find latest deployment
- Click "..." → "Retry deployment"

**OR** just wait (GitHub already pushed, will auto-deploy)

### 5️⃣ Verify (2-3 minutes)
Wait for deployment, then:
- Open: https://ballerina-online-playground.pages.dev/
- Press F12 (open console)
- Look for: `🔧 Turnstile Configuration: { siteKey: "0x4..." }`
- **Widget should now appear!** ✅

## Expected Result

**Before Fix:**
```
┌─────────────────────────┐
│  Human Verification     │
│                         │
│  [empty space here] ⬅️  │  ← No widget!
│                         │
└─────────────────────────┘
```

**After Fix:**
```
┌─────────────────────────┐
│  Human Verification     │
│                         │
│  [✓ I'm human]      ⬅️  │  ← Widget appears!
│                         │
└─────────────────────────┘
```

## Troubleshooting

### "How do I know if it worked?"

**Check deployment status:**
1. Cloudflare Dashboard → Workers & Pages → ballerina-online-playground
2. Deployments tab
3. Wait for "Success" ✅

**Check console logs:**
1. Open site: https://ballerina-online-playground.pages.dev/
2. Press F12
3. Console tab
4. Look for:
   ```
   ✅ Turnstile script loaded
   🎨 Rendering Turnstile widget...
   ✅ Turnstile widget rendered with ID: 0
   ```

### "Widget still not showing after deployment"

**Clear browser cache:**
1. Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (Ctrl+Shift+R or Cmd+Shift+R)

**Check environment variable was saved:**
1. Cloudflare Dashboard → Workers & Pages → Settings
2. Scroll to "Environment variables"
3. Verify `VITE_TURNSTILE_SITE_KEY` is listed
4. Value should start with `0x4...`

### "I don't see Environment variables section"

You might be looking at the wrong page. Make sure:
- You're on the **Settings** tab (not Overview or Deployments)
- You're inside your project (not the main Workers & Pages list)
- You have permission to edit settings

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend | ✅ Working | Logs show "Turnstile verification enabled" |
| Frontend Code | ✅ Updated | Latest changes pushed to GitHub |
| Cloudflare Pages Env | ⚠️ **NEEDS SETUP** | Add `VITE_TURNSTILE_SITE_KEY` |
| Auto-Deploy | 🔄 Ready | Will deploy when env var is added |

## After Setup

Once the environment variable is added and deployed:

1. **First-time visitors**: See Turnstile challenge → Complete → Enter playground
2. **Returning visitors (< 5min)**: Automatically enter (no challenge)
3. **Token refresh**: Automatic background refresh every 4 minutes
4. **Multiple runs**: Work perfectly (no more timeout-or-duplicate errors)

## Need Help?

If you're stuck at any step, check:
- `CLOUDFLARE_PAGES_SETUP.md` - Detailed instructions with screenshots
- Browser console (F12) - Look for error messages
- Cloudflare Pages build logs - Check for build errors

---

**Time to fix**: ~5 minutes  
**Difficulty**: Easy (just add one environment variable)  
**Impact**: Widget will appear and everything will work! 🎉
