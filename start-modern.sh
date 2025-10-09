#!/bin/bash

echo "🚀 Starting Ballerina Online Playground (Modern Version)"
echo "======================================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi
echo "✅ Docker found"

# Check Go
if ! command -v go &> /dev/null; then
    echo "❌ Go not found. Please install Go first."
    exit 1
fi
echo "✅ Go found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js found"

echo ""
echo "🐳 Checking Docker daemon..."
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker."
    exit 1
fi
echo "✅ Docker daemon running"

echo ""
echo "📦 Checking Ballerina image..."
if ! docker images | grep -q "ballerina/ballerina"; then
    echo "📥 Pulling Ballerina image..."
    docker pull ballerina/ballerina:latest
else
    echo "✅ Ballerina image ready"
fi

echo ""
echo "🔧 Setting up frontend..."
cd frontend-vite
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Starting servers..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend:  http://localhost:8081"
echo "  Frontend: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
cd ../backend
go run main.go &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
cd ../frontend-vite
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait
