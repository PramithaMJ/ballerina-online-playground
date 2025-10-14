# Cloudflare Turnstile Backend Verification

This document explains how to configure and use Cloudflare Turnstile token verification in the backend.

## Overview

The backend validates Turnstile tokens on every API request to protect against bot abuse. This is **mandatory** for security - client-side validation alone is not sufficient.

## Security Model

```
Frontend (Browser)
    ↓
1. User completes Turnstile challenge
2. Token generated and stored
3. Token sent with API requests
    ↓
Backend (Go Server)
    ↓
4. Extract token from header
5. Verify with Cloudflare API
6. Check hostname matches
7. Check token age
    ↓
8. Allow or reject request
```

## Configuration

### 1. Get Your Secret Key

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile**
2. Select your widget
3. Copy the **Secret Key** (NOT the Site Key)

### 2. Set Environment Variables

Create/edit `.env` file in the backend directory:

```bash
# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAAAyyyyyyyyyyyyyyyyyy
ENABLE_TURNSTILE_VERIFICATION=true
```

**Important:**
- Never commit `.env` to version control
- Use `.env.example` as a template
- Keep the secret key confidential

### 3. Deploy Configuration

#### Local Development:
```bash
cd backend
cp .env.example .env
# Edit .env with your secret key
go run main.go
```

#### Production (Docker):
```bash
docker run -e TURNSTILE_SECRET_KEY=your_secret \
           -e ENABLE_TURNSTILE_VERIFICATION=true \
           your-backend-image
```

#### Cloudflare Tunnel:
Add to your tunnel configuration or set in your deployment environment.

## How It Works

### Middleware Flow

1. **Request arrives** at backend endpoint
2. **Extract token** from `CF-Turnstile-Token` header
3. **Verify token** with Cloudflare's siteverify API
4. **Validate hostname** matches expected domains
5. **Check token age** (warn if > 4 minutes)
6. **Allow or reject** the request

### Token Characteristics

- **Validity**: 5 minutes (300 seconds)
- **Single-use**: Each token can only be validated once
- **Length**: Up to 2048 characters
- **Auto-expiry**: Cannot be reused after expiration

### Verification Process

```go
POST https://challenges.cloudflare.com/turnstile/v0/siteverify
{
  "secret": "your_secret_key",
  "response": "token_from_client",
  "remoteip": "user_ip_address"
}
```

**Response:**
```json
{
  "success": true,
  "challenge_ts": "2025-10-14T10:30:00.000Z",
  "hostname": "ballerina-online-playground.pages.dev",
  "error-codes": [],
  "action": "execute"
}
```

## API Endpoints Protected

All execution endpoints are protected:

-  `POST /execute` - Run Ballerina code
-  `POST /run` - Run Ballerina code (alias)
-  `POST /compile` - Compile Ballerina code
- ❌ `GET /health` - Not protected (health check)

## Error Handling

### Common Error Codes

| Error Code | Meaning | Action |
|------------|---------|--------|
| `missing-input-secret` | Secret key not provided | Check environment variable |
| `invalid-input-secret` | Secret key is invalid | Verify key in dashboard |
| `missing-input-response` | Token not in request | Check frontend is sending token |
| `invalid-input-response` | Token invalid/expired | User should retry challenge |
| `timeout-or-duplicate` | Token already used/expired | Generate new token |
| `internal-error` | Cloudflare API error | Retry request |

### Backend Logs

```bash
# Successful verification
 Turnstile verification successful from 192.168.1.1 (hostname: example.com)

# Failed verification
❌ Turnstile verification failed: [timeout-or-duplicate]

# Warning for old tokens
⚠️ Token is 4.3 minutes old
```

## Testing

### Development Mode

Set verification to disabled for local testing:

```bash
ENABLE_TURNSTILE_VERIFICATION=false
```

The middleware will skip verification but log a warning.

### Test with Cloudflare Test Keys

Use Cloudflare's test keys:

**Frontend** (Site Key):
```bash
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**Backend** (Secret Key):
```bash
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

These keys always pass validation.

## Security Best Practices

###  DO:

1. **Always validate server-side** - Never trust client-side only
2. **Store secret key securely** - Use environment variables
3. **Use HTTPS** - Always verify over secure connections
4. **Log failed attempts** - Monitor for abuse patterns
5. **Set timeout** - Don't wait indefinitely for verification
6. **Validate hostname** - Check token came from your domain
7. **Check token age** - Warn on tokens approaching expiry

### ❌ DON'T:

1. **Never expose secret key** in client-side code
2. **Don't skip verification** in production
3. **Don't cache tokens** across requests
4. **Don't reuse tokens** - they're single-use
5. **Don't commit secrets** to version control
6. **Don't allow wildcard origins** with Turnstile
7. **Don't ignore validation errors** - reject the request

## Monitoring

### Check Verification Status

Backend logs show verification status:

```bash
tail -f /var/log/ballerina-playground.log | grep Turnstile
```

### Cloudflare Dashboard

View analytics:
1. **Dashboard** → **Turnstile** → Select widget
2. View metrics:
   - Total verifications
   - Success rate
   - Error rate
   - Geographic distribution

## Troubleshooting

### Token Always Invalid

**Causes:**
- Wrong secret key
- Frontend sending expired token
- Token already used
- Hostname mismatch

**Solution:**
```bash
# Check secret key
echo $TURNSTILE_SECRET_KEY

# Enable debug logging
LOG_LEVEL=debug

# Check backend logs
tail -f /var/log/ballerina-playground.log
```

### Verification Timeout

**Causes:**
- Network connectivity issues
- Cloudflare API slow/down
- Backend timeout too short

**Solution:**
```go
// Increase timeout in turnstile.go
Timeout: 30 * time.Second,
```

### CORS Errors

**Cause:**
- Missing `CF-Turnstile-Token` in allowed headers

**Solution:**
Already configured in `main.go`:
```go
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, CF-Turnstile-Token
```

## Advanced Configuration

### Custom Expected Hostnames

Edit `middleware/turnstile.go`:

```go
ExpectedHostnames: []string{
    "your-custom-domain.com",
    "ballerina-online-playground.pages.dev",
    "localhost",
}
```

### Adjust Timeout

```go
Timeout: 30 * time.Second,  // Increase from 10s
```

### Disable for Specific Endpoints

```go
// Health check - no verification
http.HandleFunc("/health", enableCORS(handler.Health))

// Protected endpoints - with verification
http.HandleFunc("/execute", protectedChain(handler.RunCode))
```

## Production Checklist

Before deploying to production:

- [ ] Secret key configured in environment
- [ ] `ENABLE_TURNSTILE_VERIFICATION=true` set
- [ ] Frontend sending tokens in headers
- [ ] CORS configured to allow `CF-Turnstile-Token` header
- [ ] Expected hostnames match production domains
- [ ] Monitoring/logging enabled
- [ ] Error handling tested
- [ ] Verification working end-to-end

## Cost

**FREE** 
- Unlimited server-side verifications
- No API rate limits
- Enterprise features available (paid)

## Resources

- [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Siteverify API Reference](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Error Codes Reference](https://developers.cloudflare.com/turnstile/troubleshooting/error-codes/)

---

**Status**:  Server-side validation implemented
**Security**:  Tokens validated on every request
**Cost**:  Free unlimited usage
