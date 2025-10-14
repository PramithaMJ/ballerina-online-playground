# Cloudflare Pages Environment Variables Setup

## Problem: Turnstile Widget Not Loading

If you see the verification page but the Turnstile checkbox/widget doesn't appear (just empty space), it means the **Cloudflare Pages environment variable is not set**.

## Solution: Add Environment Variable in Cloudflare Dashboard

### Step 1: Get Your Turnstile Site Key

You already have it in your local `.env` file:
```
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB6jL0I4aI-Hqryo
```

### Step 2: Add to Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/

2. **Open Workers & Pages**
   - Click "Workers & Pages" in the left sidebar

3. **Select Your Project**
   - Find and click "ballerina-online-playground"

4. **Go to Settings**
   - Click the "Settings" tab at the top

5. **Add Environment Variable**
   - Scroll down to "Environment variables" section
   - Click "Add variable"
   
   **For Production:**
   - Variable name: `VITE_TURNSTILE_SITE_KEY`
   - Value: `0x4AAAAAAB6jL0I4aI-Hqryo`
   - Environment: **Production**
   - Click "Save"

   **For Preview (optional):**
   - Add another variable with the same name and value
   - Environment: **Preview**
   - Click "Save"

6. **Save Changes**
   - Click "Save" at the bottom of the page

### Step 3: Redeploy

After adding the environment variable, you need to trigger a new deployment:

**Option A: Trigger from Dashboard**
1. Go to "Deployments" tab
2. Click the "..." menu on the latest deployment
3. Click "Retry deployment"

**Option B: Push a Commit (Recommended)**
```bash
# Make a small change to trigger rebuild
cd ~/ballerina-online-playground
git commit --allow-empty -m "Trigger rebuild with environment variables"
git push
```

This will automatically trigger a new deployment with the environment variable.

### Step 4: Verify

1. Wait for deployment to complete (check "Deployments" tab)
2. Open https://ballerina-online-playground.pages.dev/
3. Open browser console (F12 → Console tab)
4. Look for this log:
   ```
   🔧 Turnstile Configuration: {
     siteKey: "0x4AAAAAAB6jL0I4aI-Hqryo",
     isTestKey: false,
     mode: "production"
   }
   ```

5. You should now see the Turnstile checkbox appear!

## Troubleshooting

### Widget Still Not Showing

**Check console logs:**
```javascript
// Open browser console (F12) and look for:
📥 Loading Turnstile script...
✅ Turnstile script loaded
🎨 Rendering Turnstile widget...
✅ Turnstile widget rendered with ID: 0
```

**If you see an error:**
```javascript
❌ Error rendering Turnstile: [error message]
```

**Common issues:**

1. **"Invalid sitekey"**
   - Your site key is incorrect or not set
   - Make sure you copied it correctly from Cloudflare Turnstile dashboard

2. **"Cannot render Turnstile"**
   - Script didn't load properly
   - Check internet connection
   - Check browser console for script loading errors

3. **Widget shows but is empty**
   - Using wrong domain
   - Check Turnstile dashboard → Domains → Make sure `ballerina-online-playground.pages.dev` is allowed

### Test with Test Key First

If you want to test quickly:

1. In Cloudflare Pages environment variables:
   - Change `VITE_TURNSTILE_SITE_KEY` to `1x00000000000000000000AA`
   - This is Cloudflare's "always passes" test key

2. Redeploy

3. Widget should appear immediately (always succeeds)

4. Once confirmed working, change back to real key

## Expected Behavior After Fix

### First Visit
1. User sees verification page
2. Turnstile widget loads (checkbox appears)
3. User completes challenge (click checkbox)
4. Widget shows checkmark
5. Page redirects to playground
6. **Token stored in session (5min validity)**

### Returning Visit (within 5 minutes)
1. User returns to site
2. Session token still valid
3. **Automatically enters playground** (no verification shown)

### Returning Visit (after 5+ minutes or new browser)
1. User sees verification page again
2. Process repeats

## Backend Configuration (Already Done)

Your backend is already configured correctly:
- `backend/.env` has `TURNSTILE_SECRET_KEY`
- Backend logs show: `✅ Turnstile verification enabled`
- Backend validates tokens properly

## Current Status

✅ **Backend**: Configured and working
✅ **Frontend Code**: Updated with better logging and widget handling
✅ **Local `.env`**: Has correct site key
❌ **Cloudflare Pages**: Environment variable NOT SET (needs to be done)

## Next Steps

1. **Add `VITE_TURNSTILE_SITE_KEY` to Cloudflare Pages** (see Step 2 above)
2. **Trigger redeployment** (see Step 3 above)
3. **Test** - Visit https://ballerina-online-playground.pages.dev/
4. **Verify console logs** - Should show widget rendering

## Get Production Site Key (if needed)

If you don't have a production site key yet:

1. Go to https://dash.cloudflare.com/
2. Click "Turnstile" in the left sidebar
3. Click "Add site"
4. Fill in:
   - **Site name**: Ballerina Online Playground
   - **Domains**: `ballerina-online-playground.pages.dev`
   - **Widget mode**: Managed
5. Click "Create"
6. Copy the **Site Key** (starts with `0x...`)
7. Use this key in Cloudflare Pages environment variables

## Support

If issues persist:
1. Check Cloudflare Pages build logs
2. Check browser console for errors
3. Verify environment variable is set correctly
4. Try test key first to isolate issues

---

**Last Updated**: October 14, 2025
**Status**: Waiting for Cloudflare Pages environment variable configuration
