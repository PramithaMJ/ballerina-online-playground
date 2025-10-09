#!/bin/bash

# Test script for Ballerina Online Playground Backend

API_URL="http://localhost:8081"

echo "🧪 Testing Ballerina Online Playground Backend"
echo "================================================"
echo ""

# Check if server is running
echo "1️⃣  Checking if backend server is running..."
if ! curl -s --connect-timeout 3 "$API_URL/execute" > /dev/null 2>&1; then
    echo "❌ Backend server is not running on $API_URL"
    echo "   Please start it with: cd backend && go run main.go"
    exit 1
fi
echo "✅ Backend server is running"
echo ""

# Test 1: Simple Hello World
echo "2️⃣  Test: Hello World"
RESPONSE=$(curl -s -X POST "$API_URL/execute" \
    -H "Content-Type: application/json" \
    -d '{"code":"import ballerina/io;\n\npublic function main() {\n    io:println(\"Hello, World!\");\n}"}')

if echo "$RESPONSE" | grep -q "Hello, World!"; then
    echo "✅ Test passed: Hello World executed successfully"
else
    echo "❌ Test failed: Expected 'Hello, World!' in output"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 2: Syntax Error
echo "3️⃣  Test: Syntax Error Handling"
RESPONSE=$(curl -s -X POST "$API_URL/execute" \
    -H "Content-Type: application/json" \
    -d '{"code":"this is invalid code"}')

if echo "$RESPONSE" | grep -q "error"; then
    echo "✅ Test passed: Error handling works"
else
    echo "⚠️  Warning: Expected error message in response"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 3: Empty Code
echo "4️⃣  Test: Empty Code Handling"
RESPONSE=$(curl -s -X POST "$API_URL/execute" \
    -H "Content-Type: application/json" \
    -d '{"code":""}')

if echo "$RESPONSE" | grep -q "error\|No code"; then
    echo "✅ Test passed: Empty code handled correctly"
else
    echo "⚠️  Warning: Empty code should return error"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 4: Math Operations
echo "5️⃣  Test: Math Operations"
RESPONSE=$(curl -s -X POST "$API_URL/execute" \
    -H "Content-Type: application/json" \
    -d '{"code":"import ballerina/io;\n\npublic function main() {\n    int result = 5 + 3;\n    io:println(result);\n}"}')

if echo "$RESPONSE" | grep -q "8"; then
    echo "✅ Test passed: Math operations work correctly"
else
    echo "❌ Test failed: Expected '8' in output"
    echo "   Response: $RESPONSE"
fi
echo ""

# Test 5: CORS Headers
echo "6️⃣  Test: CORS Headers"
RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/execute" \
    -H "Origin: http://localhost:3000")

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ Test passed: CORS headers present"
else
    echo "❌ Test failed: CORS headers missing"
    echo "   Response: $RESPONSE"
fi
echo ""

# Summary
echo "================================================"
echo "🎉 Testing complete!"
echo ""
echo "Next steps:"
echo "1. Open frontend/index.html in your browser"
echo "2. Try writing and running some Ballerina code"
echo "3. Check the output panel for results"
echo ""
echo "Tip: You can also serve the frontend with:"
echo "  cd frontend && python3 -m http.server 3000"
echo "  Then visit: http://localhost:3000"
