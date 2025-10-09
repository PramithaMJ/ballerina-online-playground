# 🔍 Understanding the HTTPS/CORS Issue

## Current Architecture (NOT WORKING ❌)

```
┌─────────────────────────────────────────┐
│  User's Browser                         │
│                                         │
│  Visits: https://pramithamj.github.io  │
│          ↓ (HTTPS - Secure)            │
│  ┌───────────────────────────────┐     │
│  │  GitHub Pages (HTTPS)         │     │
│  │  - Static React App           │     │
│  │  - Tries to call API:         │     │
│  │    http://54.160.240.225:8081 │     │
│  └───────────────────────────────┘     │
│          ↓                              │
│          ❌ BLOCKED!                    │
│          (Mixed Content Error)          │
└─────────────────────────────────────────┘
          ↓
    🚫 Browser Security Policy blocks:
       HTTPS page → HTTP request

┌─────────────────────────────────────────┐
│  EC2 Backend (AWS)                      │
│                                         │
│  http://54.160.240.225:8081            │
│  ✅ Running fine                        │
│  ✅ Health check works                  │
│  ❌ Can't be reached from HTTPS page    │
└─────────────────────────────────────────┘
```

## Fixed Architecture (WILL WORK ✅)

```
┌─────────────────────────────────────────┐
│  User's Browser                         │
│                                         │
│  Visits: https://pramithamj.github.io  │
│          ↓ (HTTPS - Secure)            │
│  ┌───────────────────────────────┐     │
│  │  GitHub Pages (HTTPS)         │     │
│  │  - Static React App           │     │
│  │  - Calls API via HTTPS:       │     │
│  │    https://api.domain.com     │     │
│  └───────────────────────────────┘     │
│          ↓                              │
│          ✅ ALLOWED!                    │
│          (Both HTTPS - Secure)          │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  Cloudflare Tunnel / Nginx with SSL    │
│                                         │
│  https://api.domain.com                │
│  - SSL/TLS Certificate                  │
│  - HTTPS (443)                          │
│          ↓                              │
│     Forwards to ↓                       │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│  EC2 Backend (AWS)                      │
│                                         │
│  http://localhost:8081                 │
│  (Internal - not exposed)               │
│  ✅ Receives request via tunnel         │
│  ✅ Executes Ballerina code             │
│  ✅ Returns response via HTTPS          │
└─────────────────────────────────────────┘
```

## Why Browser Blocks HTTP from HTTPS?

### Security Reasons:

1. **Man-in-the-Middle Attacks**
   - HTTP traffic can be intercepted and modified
   - Attacker could inject malicious code
   - User thinks they're on secure site, but data leaks

2. **Mixed Content Vulnerability**
   - HTTPS encrypts the page
   - HTTP requests expose data in plain text
   - Breaks the security promise of HTTPS

3. **Data Integrity**
   - HTTPS ensures data hasn't been tampered with
   - Mixing HTTP defeats this guarantee

## Browser Error Message Explained

**What you see in Console:**
```
Mixed Content: The page at 'https://pramithamj.github.io/...' 
was loaded over HTTPS, but requested an insecure XMLHttpRequest 
endpoint 'http://54.160.240.225:8081/execute'. 
This request has been blocked; the content must be served over HTTPS.
```

**Translation:**
- Your page uses HTTPS (secure, locked padlock)
- It tried to load HTTP resource (insecure, vulnerable)
- Browser said: "Nope! Security violation! 🚫"

## Solutions Comparison

### Option 1: Cloudflare Tunnel ⭐ RECOMMENDED
```
Pros:
✅ FREE
✅ 5-minute setup
✅ Auto-renewing certificates
✅ No DNS configuration needed
✅ Built-in DDoS protection
✅ CDN included

Cons:
❌ Requires Cloudflare account
❌ Traffic goes through Cloudflare

Cost: $0
Time: 5 minutes
Difficulty: ⭐ Easy
```

### Option 2: Let's Encrypt + Nginx
```
Pros:
✅ FREE
✅ Industry standard
✅ Full control
✅ Direct connection to EC2

Cons:
❌ Requires domain name
❌ Manual nginx configuration
❌ DNS setup required
❌ Certificate renewal setup

Cost: $0 (+ domain ~$10/year)
Time: 20-30 minutes
Difficulty: ⭐⭐⭐ Medium
```

### Option 3: AWS Application Load Balancer
```
Pros:
✅ Native AWS integration
✅ Highly scalable
✅ Health checks included
✅ SSL offloading

Cons:
❌ COSTS MONEY (~$16/month)
❌ More complex setup
❌ Requires domain + ACM certificate

Cost: ~$16-20/month
Time: 30-45 minutes
Difficulty: ⭐⭐⭐⭐ Advanced
```

## Network Flow Diagrams

### Current (Broken):
```
Browser → GitHub Pages (HTTPS) → ❌ → EC2 (HTTP)
   |                                      
   └─→ "Mixed Content Blocked!"
```

### Fixed (Working):
```
Browser → GitHub Pages (HTTPS) 
   ↓
Cloudflare/SSL (HTTPS)
   ↓
EC2 Backend (HTTP internally)
   ↓
Response via HTTPS back to browser
```

## CORS is Also Required

Even with HTTPS, you need CORS headers (already configured):

**Your Backend (`main.go`):**
```go
w.Header().Set("Access-Control-Allow-Origin", "*")
w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
```

This allows:
- ✅ GitHub Pages domain to call your API
- ✅ POST/GET requests
- ✅ JSON content type

**Without CORS + HTTPS:**
- ❌ HTTPS blocks HTTP (Mixed Content)
- ❌ CORS blocks cross-origin (Different domains)

**With CORS + HTTPS:**
- ✅ Both secure (HTTPS → HTTPS)
- ✅ CORS headers allow cross-origin
- ✅ Everything works! 🎉

## Test Your Understanding

### Q: Why can't I just change GitHub Pages to HTTP?
**A:** GitHub Pages ONLY supports HTTPS. You can't downgrade it.

### Q: Can I disable browser security to test?
**A:** Yes, but:
- Only works locally
- Won't work for real users
- Bad practice
- Use proper HTTPS instead

### Q: My backend has CORS enabled, why still failing?
**A:** CORS and HTTPS are TWO separate issues:
1. First: Browser blocks HTTP from HTTPS (Mixed Content)
2. Then: Browser checks CORS headers (Cross-Origin)

You need BOTH to work.

### Q: Can I use IP address with HTTPS?
**A:** Technically yes, but:
- Hard to get SSL certificate for IP
- Most providers require domain
- Cloudflare Tunnel handles this for you

## Real-World Example

```
✅ WORKS:
https://facebook.com → https://api.facebook.com
(Both HTTPS, CORS enabled)

❌ BLOCKED:
https://facebook.com → http://api.facebook.com
(HTTPS → HTTP blocked by browser)

❌ BLOCKED:
https://facebook.com → https://api.facebook.com
(Would work if no CORS headers - CORS error)

✅ WORKS:
Your setup after HTTPS:
https://pramithamj.github.io → https://api.yourdomain.com
```

## Next Steps

1. **Read:** `HTTPS_QUICK_FIX.md` for fast Cloudflare setup
2. **Or Read:** `HTTPS_SETUP_GUIDE.md` for all options
3. **Setup HTTPS** on your EC2 backend (5-30 mins depending on option)
4. **Update GitHub Secret:** `VITE_API_URL` to HTTPS URL
5. **Redeploy:** Push to trigger GitHub Actions
6. **Test:** Visit GitHub Pages and run Ballerina code
7. **Success!** 🎉

---

**Bottom Line:** Your backend works perfectly. You just need HTTPS tunnel/proxy in front of it. Use Cloudflare Tunnel - it's the easiest! 🚀
