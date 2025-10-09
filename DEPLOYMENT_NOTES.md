# Deployment Notes - Ballerina Online Playground

## Recent Changes (October 9, 2025)

### 1. Ballerina Version Display
- **Backend**: Added version information to the output in `backend/utils/docker.go`
- The version "Ballerina 2201.12.2 (Swan Lake Update 12)" now appears at the top of every execution output
- **Frontend**: Updated `OutputPanel.jsx` header to show the version in the panel title

### 2. API URL Configuration for Production
- **Problem**: Frontend was hardcoded to use `http://localhost:8081`, causing connection errors when deployed on AWS EC2
- **Solution**: 
  - Updated `frontend-vite/src/App.jsx` to use environment variable `VITE_API_URL`
  - Modified `docker-compose.yml` to pass the correct API URL as build argument
  - For production on AWS EC2 (54.160.240.225): `VITE_API_URL=http://54.160.240.225:8081`

### 3. Docker Image Management
- **Problem**: Ballerina image pull was failing when container ran with `--network none`
- **Solution**:
  - Added `ensureBallerinaImage()` function to pre-check and pull image if needed
  - Changed from `:latest` to specific version `:2201.10.2` for consistency
  - Added `pull-ballerina-image.sh` script for manual pre-pulling

## Files Modified

1. **backend/utils/docker.go**
   - Added version info prepending in `RunBallerinaPackage()` function
   - Added `ensureBallerinaImage()` function to pre-pull Docker image
   - Changed from `ballerina/ballerina:latest` to `ballerina/ballerina:2201.10.2`

2. **backend/handler/compile.go**
   - Updated to use `ballerina/ballerina:2201.10.2` instead of `:latest`

3. **frontend-vite/src/App.jsx**
   - Modified `handleRun()` to use `import.meta.env.VITE_API_URL` with fallback to localhost

4. **docker-compose.yml**
   - Updated frontend build args to use production server IP: `http://54.160.240.225:8081`

5. **frontend-vite/.env** (created but not tracked in git)
   - Local development environment variable file

6. **pull-ballerina-image.sh** (new)
   - Script to pre-pull Ballerina Docker image

7. **deploy.sh** (new)
   - Quick deployment script with health checks

## Deployment Instructions

### On AWS EC2 Server (54.160.240.225)

```bash
# 1. Pull the latest changes
cd ~/ballerina-online-playground
git pull origin dev

# 2. Pre-pull Ballerina Docker image (important!)
chmod +x pull-ballerina-image.sh
./pull-ballerina-image.sh

# 3. Stop existing containers
docker-compose down

# 4. Rebuild and start containers
docker-compose up --build -d

# 5. Verify services are running
docker ps
curl http://localhost:8081/health
curl http://localhost:5173
```

**Quick deployment option:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### For Different Server IPs

If deploying to a different server, update the `VITE_API_URL` in `docker-compose.yml`:

```yaml
frontend:
  build:
    args:
      - VITE_API_URL=http://YOUR_SERVER_IP:8081
```

### For Local Development

For local development, you can use localhost:

```yaml
frontend:
  build:
    args:
      - VITE_API_URL=http://localhost:8081
```

Or create a `.env` file in `frontend-vite/`:
```
VITE_API_URL=http://localhost:8081
```

## Testing

After deployment, test the following:

1. **Health Check**: `curl http://54.160.240.225:8081/health`
2. **Frontend Access**: Open `http://54.160.240.225:5173` in browser
3. **Code Execution**: Run sample code in the playground
4. **Version Display**: Verify "Ballerina 2201.12.2 (Swan Lake Update 12)" appears in:
   - Output Panel header
   - Top of execution output

## Expected Output Format

When you run code, the output should now show:

```
Ballerina 2201.12.2 (Swan Lake Update 12)

🚀 Starting concurrent employee processing...

✅ All bonus calculations complete.

Total bonus payout: $29000.0

📊 Summary (JSON): {"employeeCount":3,"totalBonus":29000.0,"averageBonus":9666.666666666666}
```

## Troubleshooting

### Frontend shows "Connection Error: Failed to fetch"
- Check backend is running: `docker ps | grep backend`
- Verify API URL in browser console network tab
- Ensure frontend was built with correct `VITE_API_URL`
- Rebuild frontend: `docker-compose up --build -d frontend`

### Backend not responding
- Check logs: `docker logs ballerina-playground-backend`
- Verify Docker socket is accessible: `ls -la /var/run/docker.sock`
- Check health endpoint: `curl http://localhost:8081/health`

### Version not showing in output
- Check backend logs for errors
- Verify backend was rebuilt with updated code
- Test with direct API call:
```bash
curl -X POST http://54.160.240.225:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import ballerina/io;\npublic function main() {\n    io:println(\"Hello\");\n}"}'
```
