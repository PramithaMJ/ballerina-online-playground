#!/bin/bash

# Ballerina Playground - Docker Deployment Script
# This script builds and runs the optimized backend with container pooling

set -e

echo "🚀 Ballerina Playground - High-Performance Deployment"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check available resources
echo "📊 System Resources:"
echo "  Memory: $(docker info --format '{{.MemTotal}}' | numfmt --to=iec-i --suffix=B)"
echo "  CPUs: $(docker info --format '{{.NCPU}}')"
echo ""

# Check if we have enough resources
TOTAL_MEM=$(docker info --format '{{.MemTotal}}')
MIN_MEM=$((4 * 1024 * 1024 * 1024))  # 4GB

if [ "$TOTAL_MEM" -lt "$MIN_MEM" ]; then
    echo "⚠️  Warning: Docker has less than 4GB memory allocated"
    echo "   Container pool requires at least 4GB for optimal performance"
    echo "   Consider increasing Docker's memory allocation"
    echo ""
fi

# Choose deployment mode
echo "Select deployment mode:"
echo "  1) Development (with frontend)"
echo "  2) Backend only"
echo "  3) Production (docker-compose.prod.yml)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🔨 Building development environment..."
        docker-compose build
        echo ""
        echo "🚀 Starting services..."
        docker-compose up -d
        echo ""
        echo "✅ Services started!"
        echo ""
        echo "📝 Service URLs:"
        echo "  Backend:  http://localhost:8081"
        echo "  Frontend: http://localhost:80"
        echo "  Health:   http://localhost:8081/health"
        echo ""
        echo "📊 View logs:"
        echo "  docker-compose logs -f backend"
        echo ""
        echo "⏱️  Container pool initialization takes ~30-60 seconds"
        echo "   Watch logs for: ✅ Container pool initialization complete!"
        ;;
    2)
        echo ""
        echo "🔨 Building backend only..."
        docker-compose build backend
        echo ""
        echo "🚀 Starting backend..."
        docker-compose up -d backend
        echo ""
        echo "✅ Backend started!"
        echo ""
        echo "📝 Service URLs:"
        echo "  Backend: http://localhost:8081"
        echo "  Health:  http://localhost:8081/health"
        echo ""
        echo "📊 View logs:"
        echo "  docker-compose logs -f backend"
        echo ""
        echo "⏱️  Container pool initialization takes ~30-60 seconds"
        ;;
    3)
        if [ ! -f "docker-compose.prod.yml" ]; then
            echo "❌ Error: docker-compose.prod.yml not found"
            exit 1
        fi
        echo ""
        echo "🔨 Building production environment..."
        docker-compose -f docker-compose.prod.yml build
        echo ""
        echo "🚀 Starting production services..."
        docker-compose -f docker-compose.prod.yml up -d
        echo ""
        echo "✅ Production services started!"
        echo ""
        echo "📝 Service URL:"
        echo "  Backend: http://localhost:8081"
        echo "  Health:  http://localhost:8081/health"
        echo ""
        echo "📊 View logs:"
        echo "  docker-compose -f docker-compose.prod.yml logs -f backend"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Container Pool Configuration:"
echo "  • 5 Ballerina versions supported"
echo "  • 3 containers pre-initialized per version"
echo "  • Total: 15 warm containers ready for execution"
echo "  • Auto-recycling after 50 uses"
echo "  • Health monitoring every 30 seconds"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Expected Performance:"
echo "  • Before: 20-25 seconds per execution"
echo "  • After:  2-5 seconds per execution"
echo "  • Improvement: 85-90% faster ⚡"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Wait for pool initialization (~30-60 sec)"
echo "  2. Check health: curl http://localhost:8081/health"
echo "  3. Test execution with frontend or API"
echo "  4. Monitor logs for pool statistics (📊)"
echo ""
