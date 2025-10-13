#!/bin/bash

# Setup HTTPS Tunnel for Ballerina Playground Backend
# This script automates the Cloudflare tunnel setup

set -e  # Exit on error

echo " Cloudflare Tunnel Setup Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on EC2 or local
if [[ -f /etc/os-release ]] && grep -q "Ubuntu" /etc/os-release; then
    echo -e "${GREEN}✓ Detected Ubuntu (likely EC2)${NC}"
else
    echo -e "${YELLOW}⚠ Warning: This script is designed for Ubuntu/EC2${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Step 1: Checking if cloudflared is installed..."
echo "------------------------------------------------"

if command -v cloudflared &> /dev/null; then
    echo -e "${GREEN}✓ cloudflared is already installed${NC}"
    cloudflared --version
else
    echo -e "${YELLOW}⚠ cloudflared not found. Installing...${NC}"
    
    # Download cloudflared
    cd ~
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    
    # Install
    sudo dpkg -i cloudflared-linux-amd64.deb
    
    # Verify
    if command -v cloudflared &> /dev/null; then
        echo -e "${GREEN}✓ cloudflared installed successfully${NC}"
        cloudflared --version
    else
        echo -e "${RED}✗ Failed to install cloudflared${NC}"
        exit 1
    fi
fi

echo ""
echo "Step 2: Checking if backend is running..."
echo "------------------------------------------"

# Check if Docker container is running
if sudo docker ps | grep -q "ballerina-playground-backend"; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
    
    # Check if port 8081 is responding
    if curl -s http://localhost:8081/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend health check passed${NC}"
    else
        echo -e "${YELLOW}⚠ Backend not responding on port 8081${NC}"
        echo "  Starting backend..."
        cd ~/ballerina-online-playground
        sudo docker-compose -f docker-compose.prod.yml up -d
        sleep 10
    fi
else
    echo -e "${YELLOW}⚠ Backend container not running${NC}"
    echo "  Starting backend..."
    cd ~/ballerina-online-playground
    sudo docker-compose -f docker-compose.prod.yml up -d
    sleep 10
fi

echo ""
echo "Step 3: Choose tunnel method"
echo "----------------------------"
echo ""
echo "  1) Quick Tunnel (FREE, temporary URL, no login required)"
echo "  2) Persistent Tunnel (requires Cloudflare login & domain)"
echo ""
read -p "Choose option (1 or 2): " TUNNEL_OPTION

if [[ $TUNNEL_OPTION == "1" ]]; then
    echo ""
    echo "Starting Quick Tunnel (Free, Temporary URL)"
    echo "=============================================="
    echo ""
    echo -e "${YELLOW}Important Notes:${NC}"
    echo "  • This URL will change if you restart the tunnel"
    echo "  • You'll need to update GitHub Secret each time"
    echo "  • Perfect for testing!"
    echo ""
    echo -e "${BLUE}Starting tunnel in 3 seconds...${NC}"
    sleep 3
    
    echo ""
    echo "═══════════════════════════════════════════════"
    echo "  COPY THE URL BELOW AND SAVE IT!"
    echo "═══════════════════════════════════════════════"
    echo ""
    
    # Start tunnel (this will run in foreground)
    cloudflared tunnel --url http://localhost:8081
    
elif [[ $TUNNEL_OPTION == "2" ]]; then
    echo ""
    echo "🔐 Setting up Persistent Tunnel"
    echo "================================"
    echo ""
    echo "This requires:"
    echo "  1. A Cloudflare account (free)"
    echo "  2. A domain name added to Cloudflare"
    echo ""
    read -p "Do you have a domain in Cloudflare? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Please add your domain to Cloudflare first, then run this script again.${NC}"
        echo "Visit: https://dash.cloudflare.com/"
        exit 0
    fi
    
    echo ""
    echo "Step 3a: Authenticate with Cloudflare"
    echo "--------------------------------------"
    echo "A browser window will open. Please login and select your domain."
    read -p "Press Enter to continue..."
    
    cloudflared tunnel login
    
    echo ""
    echo "Step 3b: Create tunnel"
    echo "----------------------"
    read -p "Enter a name for your tunnel (e.g., ballerina-backend): " TUNNEL_NAME
    
    cloudflared tunnel create $TUNNEL_NAME
    
    # Get tunnel ID from the credentials file
    TUNNEL_ID=$(ls ~/.cloudflared/*.json 2>/dev/null | head -n 1 | xargs basename | cut -d'.' -f1)
    
    if [[ -z "$TUNNEL_ID" ]]; then
        echo -e "${RED}✗ Failed to find tunnel ID${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Tunnel created with ID: $TUNNEL_ID${NC}"
    
    echo ""
    echo "Step 3c: Configure tunnel"
    echo "-------------------------"
    read -p "Enter your subdomain (e.g., api.yourdomain.com): " SUBDOMAIN
    
    # Create config file
    sudo mkdir -p /etc/cloudflared
    sudo tee /etc/cloudflared/config.yml > /dev/null <<EOF
tunnel: $TUNNEL_ID
credentials-file: /root/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $SUBDOMAIN
    service: http://localhost:8081
  - service: http_status:404
EOF
    
    echo -e "${GREEN}✓ Config file created${NC}"
    
    echo ""
    echo "Step 3d: Create DNS record"
    echo "--------------------------"
    cloudflared tunnel route dns $TUNNEL_NAME $SUBDOMAIN
    
    echo ""
    echo "Step 3e: Install as system service"
    echo "-----------------------------------"
    sudo cloudflared service install
    sudo systemctl start cloudflared
    sudo systemctl enable cloudflared
    
    echo ""
    echo -e "${GREEN} Persistent tunnel setup complete!${NC}"
    echo ""
    echo "Your backend is now accessible at:"
    echo -e "${BLUE}https://$SUBDOMAIN${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test: curl https://$SUBDOMAIN/health"
    echo "  2. Update GitHub Secret VITE_API_URL to: https://$SUBDOMAIN"
    echo "  3. Push changes to trigger redeploy"
    
else
    echo -e "${RED}Invalid option${NC}"
    exit 1
fi
