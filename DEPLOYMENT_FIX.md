# Deployment Fix Guide

## Issue
The Ballerina playground was unable to find the `Ballerina.toml` file due to Docker-in-Docker path mounting issues.

## Root Cause
The temporary files were being created in the backend container at `/tmp/ballerina-playground/`, but the path conversion for Docker-in-Docker mounting was incorrect.

## Solution
1. Simplified the volume mounting strategy
2. Used the same path for both container and host in Docker-in-Docker scenario
3. Set both `TEMP_DIR` and `HOST_TEMP_DIR` to `/tmp/ballerina-playground`

## Deployment Steps (On Ubuntu Server)

### Quick Fix (Automated)
Run the automated deployment script:

```bash
cd ~/ballerina-online-playground
./deploy-fix.sh
```

### Manual Steps (If needed)

1. **Stop existing containers:**
   ```bash
   sudo docker-compose down -v
   ```

2. **Pull latest code:**
   ```bash
   git pull origin dev
   ```

3. **Create and setup temp directory:**
   ```bash
   sudo mkdir -p /tmp/ballerina-playground
   sudo chmod 777 /tmp/ballerina-playground
   ```

4. **Clean up old Docker resources:**
   ```bash
   sudo docker container prune -f
   sudo docker image prune -f
   ```

5. **Rebuild backend (important - no cache):**
   ```bash
   sudo docker-compose build --no-cache backend
   ```

6. **Build frontend:**
   ```bash
   sudo docker-compose build frontend
   ```

7. **Start services:**
   ```bash
   sudo docker-compose up -d
   ```

8. **Check status:**
   ```bash
   sudo docker-compose ps
   sudo docker-compose logs -f
   ```

## Testing

Test the backend with a simple Ballerina program:

```bash
curl -X POST http://localhost:8081/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello, World!\");\n}"}'
```

Expected output:
```json
{
  "output": "Ballerina 2201.10.2 (Swan Lake Update 10)\n\nHello, World!\n",
  "error": ""
}
```

## Verification

In the logs, you should see:
```
DEBUG: packageDir (container): /tmp/ballerina-playground/ballerina-pkg-XXXXXX
DEBUG: hostPath (for Docker mount): /tmp/ballerina-playground/ballerina-pkg-XXXXXX
```

Both paths should be the same now, and Ballerina execution should work correctly.

## Key Changes Made

1. **docker-compose.yml:**
   - Set `HOST_TEMP_DIR=/tmp/ballerina-playground` (same as `TEMP_DIR`)
   - Volume mount: `/tmp/ballerina-playground:/tmp/ballerina-playground:rw`

2. **backend/utils/docker.go:**
   - Added debug logging to track path conversions
   - Added `.` argument to `bal run` command

3. **Backend rebuild required:**
   - The environment variables are baked into the container at build time
   - A rebuild with `--no-cache` ensures the new variables are used

## Troubleshooting

### Issue: Still getting "cannot find 'Ballerina.toml'" error

**Solution:** Make sure you rebuilt the backend with `--no-cache`:
```bash
sudo docker-compose build --no-cache backend
sudo docker-compose up -d
```

### Issue: Permission denied errors

**Solution:** Ensure the temp directory has proper permissions:
```bash
sudo chmod 777 /tmp/ballerina-playground
```

### Issue: Containers won't start

**Solution:** Clean everything and rebuild:
```bash
sudo docker-compose down -v
sudo docker container prune -f
sudo docker image prune -a -f
sudo docker-compose up --build -d
```

## Monitoring

To watch the logs in real-time:
```bash
sudo docker-compose logs -f
```

To check only backend logs:
```bash
sudo docker-compose logs -f backend
```

## Production URL

- Frontend: http://54.160.240.225:5173
- Backend: http://54.160.240.225:8081
