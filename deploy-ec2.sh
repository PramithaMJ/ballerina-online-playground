#!/bin/bash

# EC2 Backend Deployment Script for Ballerina Playground
# This script automates the deployment of the backend on AWS EC2

set -e

echo "🚀 Ballerina Playground - EC2 Backend Deployment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on Ubuntu/Debian
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}❌ Cannot determine OS. This script is for Ubuntu/Debian.${NC}"
    exit 1
fi

. /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
    echo -e "${RED}❌ This script is designed for Ubuntu/Debian. Detected: $ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Running on $PRETTY_NAME${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Docker not found. Installing Docker...${NC}"
    
    # Update system
    sudo apt update
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo -e "${GREEN}✅ Docker installed${NC}"
    echo -e "${YELLOW}⚠️  Please logout and login again, then run this script again.${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}📦 Docker Compose not found. Installing...${NC}"
    
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
fi

# Check if in correct directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ docker-compose.prod.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔧 Setting up environment...${NC}"

# Create temp directory with proper permissions
sudo mkdir -p /tmp/ballerina-playground
sudo chmod 777 /tmp/ballerina-playground
echo -e "${GREEN}✅ Temp directory created${NC}"

# Pull latest changes
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Pulling latest changes from git...${NC}"
    git pull
    echo -e "${GREEN}✅ Git pull completed${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Clean up orphan containers if any
echo -e "${YELLOW}🧹 Cleaning up orphan containers...${NC}"
docker container prune -f 2>/dev/null || true

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting backend...${NC}"
docker-compose -f docker-compose.prod.yml up --build -d --remove-orphans

# Wait for service to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be healthy...${NC}"
sleep 10

# Check health
HEALTH_CHECK=0
for i in {1..10}; do
    if curl -s http://localhost:8081/health > /dev/null 2>&1; then
        HEALTH_CHECK=1
        break
    fi
    echo -e "${YELLOW}   Waiting... attempt $i/10${NC}"
    sleep 3
done

echo ""
echo -e "${GREEN}================================================${NC}"

if [ $HEALTH_CHECK -eq 1 ]; then
    echo -e "${GREEN}✅ Backend is healthy and running!${NC}"
else
    echo -e "${RED}❌ Backend health check failed. Check logs:${NC}"
    echo "   docker-compose -f docker-compose.prod.yml logs backend"
fi

echo -e "${GREEN}================================================${NC}"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "unknown")

echo -e "${YELLOW}📊 Deployment Information:${NC}"
echo "   Backend URL (local):  http://localhost:8081"
echo "   Backend URL (public): http://$PUBLIC_IP:8081"
echo "   Health Check:         http://$PUBLIC_IP:8081/health"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo "   View logs:            docker-compose -f docker-compose.prod.yml logs -f"
echo "   Check status:         docker-compose -f docker-compose.prod.yml ps"
echo "   Check resources:      docker stats"
echo "   Restart service:      docker-compose -f docker-compose.prod.yml restart"
echo "   Stop service:         docker-compose -f docker-compose.prod.yml down"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Test backend: curl http://$PUBLIC_IP:8081/health"
echo "   2. Configure GitHub Pages with this backend URL"
echo "   3. Update CORS settings if needed"
echo "   4. Consider setting up Nginx reverse proxy"
echo "   5. Consider adding SSL with Let's Encrypt"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
