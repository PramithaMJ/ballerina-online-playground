# 🚨 URGENT: Deploy CORS Fix to EC2

## The Problem
The backend is executing code successfully but returning 502 to the frontend because **CORS headers are missing from POST responses**.

## The Fix
The middleware order has been corrected in commit `b4399a9`. You need to deploy it NOW.

## 📋 Copy and Paste This Into Your EC2 Terminal:

```bash
cd ~/ballerina-online-playground && \
git pull origin security && \
cd backend && \
sudo docker-compose down && \
sudo docker-compose build --no-cache && \
sudo docker-compose up -d && \
echo "" && \
echo "✅ Container starting... waiting 10 seconds" && \
sleep 10 && \
echo "" && \
echo "📊 Container status:" && \
sudo docker ps && \
echo "" && \
echo "📝 Recent logs:" && \
sudo docker-compose logs --tail=15
```

## What This Does:
1. ✅ Pulls latest code (commit `b4399a9`)
2. ✅ Stops old container
3. ✅ Rebuilds with `--no-cache` to ensure fresh build
4. ✅ Starts new container
5. ✅ Shows container status and logs

## Expected Output:
You should see:
```
Successfully built <image-id>
Successfully tagged ballerina-online-playground-backend:latest
Creating ballerina-playground-backend ... done
```

And in the logs:
```
🚀 Server started on port 8081
🔒 Security features enabled:
```

## Verify the Fix:
After deployment, run this from your local machine:

```bash
curl -X POST https://mug-participation-variations-wildlife.trycloudflare.com/execute \
  -H "Content-Type: application/json" \
  -H "Origin: https://pramithamj.github.io" \
  -d '{"code":"import ballerina/io;\n\npublic function main() {\n    io:println(\"Test!\");\n}"}' \
  -i | grep -E "(HTTP|access-control|content-type)"
```

Should show:
```
HTTP/2 200
access-control-allow-origin: https://pramithamj.github.io
content-type: application/json
```

## If It Still Doesn't Work:
Check if the git pull worked:
```bash
cd ~/ballerina-online-playground/backend
git log --oneline -1
```

Should show: `b4399a9 fix: Reorder middleware chain to apply CORS headers first`

---

## Alternative: Manual Step-by-Step

If the one-liner fails, do it step by step:

```bash
# 1. Go to project
cd ~/ballerina-online-playground

# 2. Check current commit
git log --oneline -1

# 3. Pull latest
git pull origin security

# 4. Verify new commit
git log --oneline -1
# Should show: b4399a9

# 5. Go to backend
cd backend

# 6. Stop container
sudo docker-compose down

# 7. Rebuild (this takes ~30 seconds)
sudo docker-compose build --no-cache

# 8. Start container
sudo docker-compose up -d

# 9. Check logs
sudo docker-compose logs -f
# Press Ctrl+C to exit logs
```

## 🎯 After This Deploy:
The frontend should work immediately! The 502 errors will be gone and you'll see the Ballerina output in your frontend.
