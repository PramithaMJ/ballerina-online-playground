#!/bin/bash

# Ballerina Playground - Optimized Deployment Script
# This script deploys the application with all performance optimizations

set -e

echo "🚀 Ballerina Playground - Optimized Deployment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install docker-compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ docker-compose is available${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down

# Remove old images (optional - uncomment if needed)
# echo -e "${YELLOW}🗑️  Removing old images...${NC}"
# docker-compose down --rmi local

# Clean up temp directory
echo -e "${YELLOW}🧹 Cleaning up temp directory...${NC}"
rm -rf /tmp/ballerina-playground/*

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers with optimizations...${NC}"
docker-compose up --build -d

# Wait for containers to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check backend health
echo -e "${YELLOW}🔍 Checking backend health...${NC}"
BACKEND_HEALTH=$(curl -s http://localhost:8081/health | grep -o "healthy" || echo "unhealthy")
if [ "$BACKEND_HEALTH" == "healthy" ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend is not healthy${NC}"
fi

# Check frontend health
echo -e "${YELLOW}🔍 Checking frontend health...${NC}"
FRONTEND_HEALTH=$(curl -s http://localhost:80/health || echo "unhealthy")
if [ "$FRONTEND_HEALTH" == "healthy" ]; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend is not healthy${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}📊 Service URLs:${NC}"
echo "   Frontend: http://localhost:80"
echo "   Backend:  http://localhost:8081"
echo ""
echo -e "${YELLOW}📝 Useful Commands:${NC}"
echo "   View logs:          docker-compose logs -f"
echo "   View status:        docker-compose ps"
echo "   View stats:         docker stats"
echo "   Stop services:      docker-compose down"
echo "   Restart services:   docker-compose restart"
echo ""
echo -e "${YELLOW}🔧 Performance Monitoring:${NC}"
echo "   docker stats ballerina-playground-frontend ballerina-playground-backend"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
