#!/bin/bash

# Deployment script to fix Ballerina execution issues
# This script should be run on the Ubuntu server

set -e  # Exit on any error

echo "🔧 Fixing Ballerina Online Playground deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Stop existing containers
echo -e "${YELLOW}Step 1: Stopping existing containers...${NC}"
sudo docker-compose down -v
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${YELLOW}Step 2: Pulling latest code from git...${NC}"
git pull origin dev
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 3: Create and setup temp directory
echo -e "${YELLOW}Step 3: Setting up temporary directory...${NC}"
TEMP_DIR="/tmp/ballerina-playground"

# Create directory if it doesn't exist
if [ ! -d "$TEMP_DIR" ]; then
    sudo mkdir -p "$TEMP_DIR"
    echo "  Created directory: $TEMP_DIR"
else
    echo "  Directory already exists: $TEMP_DIR"
fi

# Set proper permissions
sudo chmod 777 "$TEMP_DIR"
echo "  Set permissions: 777"

# Clean up old files
echo "  Cleaning up old temporary files..."
sudo find "$TEMP_DIR" -type d -mtime +1 -exec rm -rf {} + 2>/dev/null || true
echo -e "${GREEN}✓ Temporary directory ready${NC}"
echo ""

# Step 4: Remove old containers and images
echo -e "${YELLOW}Step 4: Cleaning up old Docker resources...${NC}"
sudo docker container prune -f
sudo docker image prune -f
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Step 5: Rebuild backend with no cache
echo -e "${YELLOW}Step 5: Building backend (this may take a minute)...${NC}"
sudo docker-compose build --no-cache backend
echo -e "${GREEN}✓ Backend built${NC}"
echo ""

# Step 6: Build frontend
echo -e "${YELLOW}Step 6: Building frontend...${NC}"
sudo docker-compose build frontend
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 7: Start services
echo -e "${YELLOW}Step 7: Starting services...${NC}"
sudo docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Step 8: Wait for services to be healthy
echo -e "${YELLOW}Step 8: Waiting for services to be ready...${NC}"
sleep 5
echo -e "${GREEN}✓ Services should be ready${NC}"
echo ""

# Step 9: Show status
echo -e "${YELLOW}Step 9: Checking service status...${NC}"
sudo docker-compose ps
echo ""

# Step 10: Show logs
echo -e "${YELLOW}Showing recent logs...${NC}"
echo ""
sudo docker-compose logs --tail=20
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your application should now be running at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8081"
echo ""
echo "To view live logs, run:"
echo "  sudo docker-compose logs -f"
echo ""
echo "To test the backend, run:"
echo '  curl -X POST http://localhost:8081/execute -H "Content-Type: application/json" -d '"'"'{"code":"import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello, World!\");\n}"}'"'"
echo ""
