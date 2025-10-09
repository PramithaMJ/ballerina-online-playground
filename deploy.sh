#!/bin/bash
# Quick rebuild script for Ballerina Online Playground
# Run this after pulling new changes from git

echo "� Ensuring Ballerina Docker image is available..."
docker pull ballerina/ballerina:2201.10.2

echo ""
echo "�🔄 Stopping existing containers..."
docker-compose down

echo "🏗️  Building and starting containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🏥 Health Checks:"
echo -n "Backend: "
curl -s http://localhost:8081/health | grep -q "healthy" && echo "✅ Healthy" || echo "❌ Not responding"
echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200" && echo "✅ Healthy" || echo "❌ Not responding"

echo ""
echo "📝 View logs:"
echo "  Backend:  docker logs -f ballerina-playground-backend"
echo "  Frontend: docker logs -f ballerina-playground-frontend"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://54.160.240.225:5173"
echo "  Backend:  http://54.160.240.225:8081"
