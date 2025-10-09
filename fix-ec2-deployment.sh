#!/bin/bash

# Quick Fix for EC2 Deployment Issues
# Run this on your EC2 instance to fix the ContainerConfig error

set -e

echo "🔧 Fixing EC2 Deployment Issues"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}1. Stopping all containers...${NC}"
sudo docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo -e "${YELLOW}2. Removing orphan containers...${NC}"
sudo docker container prune -f

echo -e "${YELLOW}3. Pulling latest changes...${NC}"
git pull

echo -e "${YELLOW}4. Starting backend with fixed configuration...${NC}"
sudo docker-compose -f docker-compose.prod.yml up --build -d --remove-orphans

echo -e "${YELLOW}5. Waiting for service to start...${NC}"
sleep 10

echo -e "${YELLOW}6. Checking health...${NC}"
if curl -s http://localhost:8081/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy and running!${NC}"
    echo ""
    echo "Test it: curl http://localhost:8081/health"
else
    echo -e "${RED}❌ Health check failed. View logs:${NC}"
    echo "   sudo docker-compose -f docker-compose.prod.yml logs backend"
fi

echo ""
echo -e "${GREEN}🎉 Fix complete!${NC}"
