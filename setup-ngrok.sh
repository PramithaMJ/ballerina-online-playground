#!/bin/bash

# 🔧 WebSocket Fix Setup Script
# This script helps you switch from Cloudflare Tunnel to ngrok

set -e

echo "🚀 Ballerina Playground - ngrok Setup for WebSocket Support"
echo "========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if ngrok is installed
echo "📦 Step 1: Checking ngrok installation..."
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}⚠️  ngrok not found. Installing...${NC}"
    
    if command -v brew &> /dev/null; then
        echo "Installing ngrok via Homebrew..."
        brew install ngrok/ngrok/ngrok
        echo -e "${GREEN}✅ ngrok installed successfully!${NC}"
    else
        echo -e "${RED}❌ Homebrew not found. Please install ngrok manually:${NC}"
        echo "   Visit: https://ngrok.com/download"
        exit 1
    fi
else
    echo -e "${GREEN}✅ ngrok is already installed${NC}"
fi

echo ""

# Step 2: Check if backend is running
echo "🔍 Step 2: Checking if backend is running on port 8080..."
if curl -s http://localhost:8080/health &> /dev/null; then
    echo -e "${GREEN}✅ Backend is running!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not running on port 8080${NC}"
    echo "   Please start backend first:"
    echo "   cd backend && docker-compose up"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Step 3: Start ngrok
echo "🌐 Step 3: Starting ngrok tunnel..."
echo -e "${YELLOW}⚠️  This will start ngrok in the background${NC}"
echo ""

# Kill any existing ngrok processes
pkill -f ngrok || true

# Start ngrok in background
ngrok http 8080 > /dev/null &
NGROK_PID=$!

echo "Waiting for ngrok to start..."
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
    echo "   Please check if ngrok started correctly"
    exit 1
fi

echo -e "${GREEN}✅ ngrok tunnel started!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🌐 Your ngrok URL:${NC}"
echo -e "   ${YELLOW}${NGROK_URL}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Update frontend config
echo "📝 Step 4: Update frontend configuration"
echo ""
echo "Add this to your frontend environment config:"
echo ""
echo -e "${YELLOW}File: frontend-vite/.env${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VITE_API_BASE_URL=${NGROK_URL}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Offer to update .env automatically
read -p "Would you like me to update frontend-vite/.env automatically? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd frontend-vite
    
    # Backup existing .env if exists
    if [ -f .env ]; then
        cp .env .env.backup
        echo -e "${YELLOW}⚠️  Backed up existing .env to .env.backup${NC}"
    fi
    
    # Create/update .env
    echo "VITE_API_BASE_URL=${NGROK_URL}" > .env
    echo -e "${GREEN}✅ Updated frontend-vite/.env${NC}"
    
    cd ..
fi

echo ""

# Step 5: Instructions for rebuilding
echo "🔨 Step 5: Rebuild frontend"
echo ""
echo "Run these commands:"
echo ""
echo "  cd frontend-vite"
echo "  npm run build"
echo ""

# Offer to rebuild
read -p "Would you like me to rebuild the frontend now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building frontend..."
    cd frontend-vite
    npm run build
    echo -e "${GREEN}✅ Frontend built successfully!${NC}"
    cd ..
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Summary:"
echo "  • Backend:  http://localhost:8080"
echo "  • ngrok:    ${NGROK_URL}"
echo "  • ngrok PID: ${NGROK_PID}"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test your app in browser"
echo "  2. Click the Debug button"
echo "  3. Check console for WebSocket connection"
echo ""
echo "🛑 To stop ngrok:"
echo "   kill ${NGROK_PID}"
echo "   or: pkill -f ngrok"
echo ""
echo "📊 View ngrok dashboard:"
echo "   http://localhost:4040"
echo ""
echo "📖 Full documentation:"
echo "   See WEBSOCKET_FIX_NGROK.md"
echo ""
echo -e "${GREEN}Happy Debugging! 🐛🔧${NC}"
