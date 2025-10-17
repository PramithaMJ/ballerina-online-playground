#!/bin/bash

# Quick Test Script for PAT Workaround Fix
# Run this after building to verify the fix works

echo "🧪 Testing PAT Workaround Fix"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing locally...${NC}"
echo ""

# Check if build exists
if [ ! -d "frontend-vite/dist" ]; then
    echo "❌ Build not found! Run 'cd frontend-vite && npm run build' first"
    exit 1
fi

echo "✅ Build exists"
echo ""

# Start dev server in background
echo "Starting dev server..."
cd frontend-vite
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 3

echo ""
echo -e "${GREEN}📋 Manual Testing Checklist:${NC}"
echo "=========================="
echo ""
echo "1. Open http://localhost:5173 in your browser"
echo ""
echo "2. Initial Verification:"
echo "   [ ] See 'Human Verification Required' page"
echo "   [ ] Turnstile widget loads"
echo "   [ ] Complete verification (checkbox or automatic)"
echo "   [ ] Enter main application"
echo ""
echo "3. Browser Console Check (DevTools → Console):"
echo "   [ ] NO 'Request for the Private Access Token challenge' errors"
echo "   [ ] NO '⏱️ Token generation timeout' warnings"
echo "   [ ] NO '❌ Failed to pre-generate token' errors"
echo "   [ ] See '🔐 Using Turnstile token from session'"
echo ""
echo "4. Code Execution:"
echo "   [ ] Write some Ballerina code"
echo "   [ ] Click 'Run Code'"
echo "   [ ] Code executes successfully"
echo "   [ ] See output without errors"
echo "   [ ] Check console: '✅ Request successful - token was accepted'"
echo ""
echo "5. Multiple Executions:"
echo "   [ ] Run code 2-3 more times"
echo "   [ ] All executions succeed"
echo "   [ ] No verification prompts"
echo "   [ ] No console errors"
echo ""
echo "6. Token Expiration Test (Wait 4+ minutes):"
echo "   [ ] Wait 4-5 minutes"
echo "   [ ] Try to run code"
echo "   [ ] See message: '🔒 Verification token expired...'"
echo "   [ ] Refresh page"
echo "   [ ] Complete verification again"
echo "   [ ] Code execution works again"
echo ""
echo -e "${YELLOW}Press Enter when done testing (will stop dev server)${NC}"
read

# Stop dev server
kill $DEV_PID

echo ""
echo "Dev server stopped."
echo ""
echo -e "${GREEN}If all checks passed, you're ready to deploy!${NC}"
echo ""
echo "Next steps:"
echo "1. Review PAT_WORKAROUND_FINAL.md"
echo "2. Deploy to production: ./deploy-turnstile-fix.sh"
echo "3. Test on production URL"
echo ""
