#!/bin/bash

# Diagnostic script to check EC2 deployment status

echo "==================================="
echo "🔍 EC2 Deployment Diagnostic"
echo "==================================="
echo ""

echo "1️⃣ Checking current Git commit..."
cd ~/ballerina-online-playground
CURRENT_COMMIT=$(git log --oneline -1)
echo "   Current: $CURRENT_COMMIT"
echo "   Expected: b4399a9 fix: Reorder middleware chain to apply CORS headers first"
echo ""

echo "2️⃣ Checking container status..."
CONTAINER_ID=$(sudo docker ps --filter "name=ballerina-playground-backend" --format "{{.ID}}")
if [ -z "$CONTAINER_ID" ]; then
    echo "   ❌ Container NOT running!"
else
    echo "   ✅ Container running: $CONTAINER_ID"
    CONTAINER_IMAGE=$(sudo docker ps --filter "name=ballerina-playground-backend" --format "{{.Image}}")
    CONTAINER_STATUS=$(sudo docker ps --filter "name=ballerina-playground-backend" --format "{{.Status}}")
    echo "   Image: $CONTAINER_IMAGE"
    echo "   Status: $CONTAINER_STATUS"
fi
echo ""

echo "3️⃣ Checking when container was created..."
if [ ! -z "$CONTAINER_ID" ]; then
    CREATED=$(sudo docker inspect --format='{{.Created}}' $CONTAINER_ID)
    echo "   Created: $CREATED"
fi
echo ""

echo "4️⃣ Checking when image was built..."
IMAGE_CREATED=$(sudo docker images ballerina-online-playground-backend --format "{{.CreatedAt}}")
echo "   Image created: $IMAGE_CREATED"
echo ""

echo "5️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -I https://mug-participation-variations-wildlife.trycloudflare.com/health | grep -E "(HTTP|access-control)")
echo "$HEALTH_RESPONSE"
echo ""

echo "==================================="
echo "📋 Summary"
echo "==================================="
if [[ "$CURRENT_COMMIT" == *"b4399a9"* ]]; then
    echo "✅ Git: Latest code pulled"
else
    echo "❌ Git: Old code - need to git pull"
fi

if [ ! -z "$CONTAINER_ID" ]; then
    echo "✅ Container: Running"
else
    echo "❌ Container: Not running"
fi

echo ""
echo "🚀 To deploy latest changes, run:"
echo "cd ~/ballerina-online-playground && git pull origin security && cd backend && sudo docker-compose down && sudo docker-compose up -d --build"
