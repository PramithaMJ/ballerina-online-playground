#!/bin/bash

# Emergency Fix Script for EC2 Deployment
# Run this on EC2 to fix the ContainerConfig error

echo "🚨 Emergency Fix for ContainerConfig Error"
echo "==========================================="
echo ""

# Step 1: Stop and remove ALL containers
echo "1️⃣ Stopping ALL containers..."
sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true

echo "2️⃣ Removing ALL containers..."
sudo docker rm $(sudo docker ps -aq) 2>/dev/null || true

# Step 2: Remove orphan containers specifically
echo "3️⃣ Removing orphan containers..."
sudo docker container prune -f

# Step 3: Clean up volumes
echo "4️⃣ Cleaning up unused volumes..."
sudo docker volume prune -f

# Step 4: Now start fresh
echo "5️⃣ Starting backend with clean slate..."
cd ~/ballerina-online-playground
sudo docker-compose -f docker-compose.prod.yml up -d

# Step 5: Wait and check
echo ""
echo "⏳ Waiting 10 seconds for service to start..."
sleep 10

echo ""
echo "🔍 Checking health..."
if curl -s http://localhost:8081/health > /dev/null 2>&1; then
    echo "✅ SUCCESS! Backend is running!"
    echo ""
    echo "Test it:"
    echo "  curl http://localhost:8081/health"
    echo ""
    echo "View logs:"
    echo "  sudo docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "❌ Health check failed. Check logs:"
    echo "  sudo docker-compose -f docker-compose.prod.yml logs backend"
fi

echo ""
echo "📊 Container status:"
sudo docker-compose -f docker-compose.prod.yml ps
