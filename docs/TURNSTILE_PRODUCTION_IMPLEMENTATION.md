# Cloudflare Turnstile Production Implementation

##  Industry-Standard Human Verification System

This document describes the **production-ready Cloudflare Turnstile implementation** for the Ballerina Online Playground. This implementation follows Cloudflare's best practices and industry standards for bot protection.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Flow](#implementation-flow)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Configuration](#configuration)
6. [Security Features](#security-features)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │ Initial Verification│───────▶│ Token Generator      │    │
│  │ (Page Load)        │        │ (On-Demand)          │    │
│  └────────────────────┘        └──────────────────────┘    │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
               │ 1. Initial Token         │ 2. Fresh Token per Request
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Cloudflare Turnstile API                       │
│            (challenges.cloudflare.com)                       │
└──────────────┬──────────────────────────┬──────────────────┘
               │                          │
               │ 3. Validate Initial      │ 4. Validate Per-Request Token
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Go)                       │
│  ┌────────────────────┐        ┌──────────────────────┐    │
│  │ Turnstile          │        │ Token Cache          │    │
│  │ Middleware         │───────▶│ (Prevent Replay)     │    │
│  └────────────────────┘        └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Implementation Flow

### 1. **Initial Verification (Page Load)**

```javascript
User Loads Page
     │
     ├─ Check sessionStorage for valid verification
     │  └─ If valid (< 4 min old) → Skip verification
     │
     ├─ Show Turnstile Challenge Widget
     │  └─ User completes challenge
     │
     ├─ Store verification status in sessionStorage
     │  ├─ turnstile_verified: true
     │  └─ turnstile_timestamp: [current time]
     │
     └─ Initialize On-Demand Token Generator
```

### 2. **API Request Flow (Each Code Execution)**

```javascript
User Clicks "Run Code"
     │
     ├─ Check if user is verified
     │  └─ If not → Show error, ask to refresh
     │
     ├─ Generate fresh token on-demand
     │  ├─ Execute invisible Turnstile widget
     │  └─ Wait for token (max 15s)
     │
     ├─ Attach token to HTTP header
     │  └─ CF-Turnstile-Token: [fresh_token]
     │
     ├─ Send request to backend
     │
     └─ Backend validates token
        ├─ Call Cloudflare siteverify API
        ├─ Check token hasn't been used before
        ├─ Verify token age (< 5 minutes)
        └─ Process request if valid
```

---

## 💻 Frontend Implementation

### Key Files

1. **`TurnstileChallenge.jsx`** - Initial verification component
2. **`turnstile-token-generator.util.js`** - On-demand token generator
3. **`api.service.js`** - API calls with token handling
4. **`App.jsx`** - Application orchestration

### TurnstileChallenge Component

**Location:** `frontend-vite/src/components/TurnstileChallenge.jsx`

**Features:**
-  Explicit rendering with full lifecycle control
-  Session persistence (4-minute validity)
-  Comprehensive error handling
-  Retry logic with exponential backoff
-  Accessibility (ARIA labels, keyboard navigation)
-  Loading states and visual feedback

**Configuration:**
```javascript
widgetId = turnstile.render(container, {
  sitekey: 'YOUR_SITE_KEY',
  theme: 'light',
  size: 'normal',
  callback: handleSuccess,
  'error-callback': handleError,
  'expired-callback': handleExpired,
  'timeout-callback': handleTimeout,
  retry: 'auto',
  'retry-interval': 8000,
  execution: 'render',
  appearance: 'always',
});
```

### On-Demand Token Generator

**Location:** `frontend-vite/src/utils/turnstile-token-generator.util.js`

**Features:**
-  Invisible widget for background token generation
-  Queue management for concurrent requests
-  15-second timeout per token
-  Automatic retry on failure
-  Memory-efficient design

**Usage:**
```javascript
import { turnstileTokenGenerator } from './utils/turnstile-token-generator.util';

// Initialize after initial verification
await turnstileTokenGenerator.initialize();

// Generate token when needed
const token = await turnstileTokenGenerator.generateToken();
```

### API Service

**Location:** `frontend-vite/src/services/api.service.js`

**Flow:**
```javascript
async executeCode(code, version, signal) {
  // 1. Validate user verification status
  const isVerified = sessionStorage.getItem('turnstile_verified');
  
  // 2. Generate fresh token
  const token = await this.getTurnstileToken();
  
  // 3. Attach to request header
  headers['CF-Turnstile-Token'] = token;
  
  // 4. Make API call
  const response = await fetch(API_URL, { headers, ... });
  
  // 5. Handle verification errors
  if (response.status === 401) {
    // Clear verification, ask user to refresh
  }
}
```

---

##  Backend Implementation

### Key Files

1. **`middleware/turnstile.go`** - Verification middleware
2. **`main.go`** - Server configuration

### Turnstile Middleware

**Location:** `backend/middleware/turnstile.go`

**Features:**
-  Server-side validation with Cloudflare API
-  Token replay attack prevention
-  Retry logic with exponential backoff
-  Token cache (prevent duplicate validation)
-  Hostname validation
-  Token age verification
-  Comprehensive error handling

### Verification Flow

```go
func VerifyTurnstile(config TurnstileConfig) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // 1. Get token from header
            token := r.Header.Get("CF-Turnstile-Token")
            
            // 2. Check if token was already used (replay attack)
            if cache.isUsed(token) {
                respondWithError(w, 401, "Token already used")
                return
            }
            
            // 3. Verify with Cloudflare (with retry)
            isValid, resp, err := verifyTokenWithRetry(token, remoteIP, config)
            
            // 4. Validate hostname
            if !isExpectedHostname(resp.Hostname) {
                respondWithError(w, 401, "Invalid origin")
                return
            }
            
            // 5. Check token age
            if age > 5*time.Minute {
                respondWithError(w, 401, "Token expired")
                return
            }
            
            // 6. Mark token as used
            cache.markUsed(token)
            
            // 7. Proceed to next handler
            next.ServeHTTP(w, r)
        })
    }
}
```

### Cloudflare Siteverify API

```go
func verifyToken(token, remoteIP string, config TurnstileConfig) (bool, *TurnstileResponse, error) {
    // Prepare request
    payload := map[string]string{
        "secret":   config.SecretKey,
        "response": token,
        "remoteip": remoteIP,
    }
    
    // Call Cloudflare API
    resp, err := http.Post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        "application/json",
        jsonPayload,
    )
    
    // Parse response
    var result TurnstileResponse
    json.Unmarshal(body, &result)
    
    return result.Success, &result, nil
}
```

---

## ⚙️ Configuration

### Frontend Configuration

**File:** `frontend-vite/.env`

```bash
# Cloudflare Turnstile Site Key (Public)
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB6jL0I4aI-Hqryo

# Enable/Disable Verification
VITE_ENABLE_VERIFICATION=true

# Backend API URL
VITE_API_URL=https://your-backend.trycloudflare.com
```

### Backend Configuration

**File:** `backend/.env`

```bash
# Cloudflare Turnstile Secret Key (Private!)
TURNSTILE_SECRET_KEY=<YOUR_SECRET_KEY>

# Enable/Disable Verification
ENABLE_TURNSTILE_VERIFICATION=true

# Rate Limiting
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_PERIOD=5s
```

### Cloudflare Dashboard Setup

1. **Create Turnstile Widget:**
   - Go to: https://dash.cloudflare.com → Turnstile
   - Click "Add widget"
   - Name: "Ballerina Playground"

2. **Configure Hostname:**
   - Add your domain: `ballerina-online-playground.pages.dev`
   - Add custom domains if applicable

3. **Select Widget Mode:**
   - **Managed** (Recommended): Cloudflare decides when to show challenge
   - **Non-interactive**: Purely background challenge
   - **Invisible**: No visible widget (used for on-demand tokens)

4. **Get Keys:**
   - **Site Key**: Copy to frontend `.env` as `VITE_TURNSTILE_SITE_KEY`
   - **Secret Key**: Copy to backend `.env` as `TURNSTILE_SECRET_KEY`

---

## 🛡️ Security Features

### 1. **Token Lifecycle Management**

-  **Single-use tokens**: Each token can only be validated once
-  **5-minute expiry**: Tokens automatically expire
-  **4-minute safety margin**: Frontend warns before expiry

### 2. **Replay Attack Prevention**

```go
// Token cache prevents reuse
type tokenCache struct {
    tokens  map[string]time.Time
    maxSize int
}

// Check before validation
if cache.isUsed(token) {
    return errors.New("token already used")
}

// Mark after successful validation
cache.markUsed(token)
```

### 3. **Origin Validation**

```go
ExpectedHostnames: []string{
    "ballerina-online-playground.pages.dev",
    "pramithamj.github.io",
    "localhost",
}
```

### 4. **Rate Limiting**

```go
// 5 requests per 5 seconds per IP
rateLimiter := middleware.NewRateLimiter(5*time.Second, 5)
```

### 5. **Token Age Verification**

```go
age := time.Since(challengeTime)
if age > 5*time.Minute {
    return errors.New("token expired")
}
```

---

## 🧪 Testing

### Test Keys (Development)

**Site Key:** `1x00000000000000000000AA`  
**Secret Key:** `1x0000000000000000000000000000000AA`  
**Result:** Always passes (visible token)

**Site Key:** `2x00000000000000000000AB`  
**Secret Key:** `2x0000000000000000000000000000000AB`  
**Result:** Always fails

**Site Key:** `3x00000000000000000000FF`  
**Secret Key:** `3x0000000000000000000000000000000FF`  
**Result:** Token with "XXXX.DUMMY.TOKEN.XXXX"

### Testing Checklist

- [ ] Initial verification appears on page load
- [ ] Verification succeeds and playground loads
- [ ] Session persists after refresh (< 4 minutes)
- [ ] Code execution generates fresh tokens
- [ ] Tokens are validated by backend
- [ ] Error handling works for expired tokens
- [ ] Error handling works for network failures
- [ ] Rate limiting prevents abuse
- [ ] Replay attacks are blocked
- [ ] Invalid hostnames are rejected

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **"Missing verification token"**

**Cause:** Token not sent in request header

**Solution:**
```javascript
// Check token generator is initialized
await turnstileTokenGenerator.initialize();

// Verify token is attached to request
headers['CF-Turnstile-Token'] = token;
```

#### 2. **"Token already used"**

**Cause:** Token was reused (replay attack prevention)

**Solution:** Generate fresh token for each request

#### 3. **"Invalid input secret"**

**Cause:** Wrong secret key in backend

**Solution:** 
- Check `backend/.env` has correct `TURNSTILE_SECRET_KEY`
- Verify it matches your Cloudflare dashboard secret key

#### 4. **"Hostname mismatch"**

**Cause:** Request from unauthorized domain

**Solution:**
- Add domain to Cloudflare Turnstile widget settings
- Add domain to `ExpectedHostnames` in `turnstile.go`

#### 5. **"Token generation timeout"**

**Cause:** Slow network or Turnstile API issues

**Solution:**
- Check internet connection
- Verify Cloudflare Turnstile API is accessible
- Increase timeout in `turnstile-token-generator.util.js`

---

##  Best Practices

### Frontend

1. **Always check verification status before API calls**
2. **Generate fresh tokens for each request** (never reuse)
3. **Handle token expiration gracefully**
4. **Provide clear error messages to users**
5. **Use loading states during token generation**

### Backend

1. **Always validate tokens server-side** (never trust client)
2. **Implement token caching** to prevent replay attacks
3. **Use retry logic** for Cloudflare API calls
4. **Log verification failures** for monitoring
5. **Rotate secret keys periodically** (every 6 months)

### Security

1. **Never expose secret key** in frontend code
2. **Use HTTPS** for all communications
3. **Implement rate limiting** to prevent abuse
4. **Monitor verification patterns** for suspicious activity
5. **Keep Turnstile library updated**

---

## 📊 Monitoring

### Key Metrics to Track

1. **Verification Success Rate**
   - Target: > 95%
   - Alert if < 90%

2. **Token Generation Time**
   - Target: < 3 seconds
   - Alert if > 10 seconds

3. **Verification Failures**
   - Monitor for patterns
   - Alert on sudden spikes

4. **Token Reuse Attempts**
   - Should be rare (< 0.1%)
   - Alert on increase (possible attack)

### Cloudflare Analytics

Access metrics at: https://dash.cloudflare.com → Turnstile → Analytics

- Total challenges served
- Challenge solve rate
- Interactive vs non-interactive challenges
- Top countries
- Bot detection rate

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Replace test keys with production keys
- [ ] Configure hostnames in Cloudflare dashboard
- [ ] Enable HTTPS for all endpoints
- [ ] Test with production keys in staging
- [ ] Set up monitoring and alerting
- [ ] Document secret key rotation procedure
- [ ] Configure rate limits appropriately
- [ ] Enable logging for security events

### Environment Variables

**Frontend (Cloudflare Pages):**
```bash
VITE_TURNSTILE_SITE_KEY=<production_site_key>
VITE_ENABLE_VERIFICATION=true
VITE_API_URL=<production_backend_url>
```

**Backend (Server/Container):**
```bash
TURNSTILE_SECRET_KEY=<production_secret_key>
ENABLE_TURNSTILE_VERIFICATION=true
ALLOWED_ORIGIN=https://ballerina-online-playground.pages.dev
```

---

## 📚 References

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Client-Side Rendering Guide](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Server-Side Validation Guide](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Widget Configuration Options](https://developers.cloudflare.com/turnstile/reference/widget/)
- [Siteverify API Reference](https://developers.cloudflare.com/turnstile/reference/siteverify/)

---

## 📝 License

This implementation follows Cloudflare Turnstile's terms of service and best practices.

**Last Updated:** October 17, 2025  
**Version:** 1.0.0  
**Author:** AI Software Architect
