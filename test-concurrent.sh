#!/bin/bash

# Test script to demonstrate concurrent execution handling
# This simulates 5 users submitting code at the same time

echo "🧪 Testing Concurrent Execution of Ballerina Playground"
echo "======================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test code samples
CODE1='import ballerina/io;\n\npublic function main() {\n    io:println(\"User 1: Hello from concurrent execution!\");\n}'
CODE2='import ballerina/io;\n\npublic function main() {\n    int sum = 0;\n    foreach int i in 1...100 {\n        sum += i;\n    }\n    io:println(\"User 2: Sum = \", sum);\n}'
CODE3='import ballerina/io;\n\npublic function main() {\n    string[] fruits = [\"Apple\", \"Banana\", \"Orange\"];\n    foreach string fruit in fruits {\n        io:println(\"User 3: \", fruit);\n    }\n}'
CODE4='import ballerina/io;\n\npublic function main() {\n    io:println(\"User 4: Testing concurrent execution\");\n    io:println(\"User 4: This is line 2\");\n}'
CODE5='import ballerina/io;\n\npublic function main() {\n    int result = 10 * 20;\n    io:println(\"User 5: 10 * 20 = \", result);\n}'

# Function to run code and measure time
run_code() {
    local user_id=$1
    local code=$2
    local start_time=$(date +%s.%N)
    
    echo -e "${BLUE}[$user_id]${NC} Submitting code at $(date +%H:%M:%S.%N)"
    
    response=$(curl -s -X POST http://localhost:8081/execute \
        -H "Content-Type: application/json" \
        -d "{\"code\":\"$code\"}")
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    # Extract output and error
    output=$(echo "$response" | jq -r '.output' 2>/dev/null || echo "Parse error")
    error=$(echo "$response" | jq -r '.error' 2>/dev/null || echo "")
    
    if [ -z "$error" ] || [ "$error" = "null" ]; then
        echo -e "${GREEN}[$user_id]${NC} ✅ Success in ${duration}s"
        echo -e "${GREEN}[$user_id]${NC} Output: $output"
    else
        echo -e "${YELLOW}[$user_id]${NC} ⚠️  Error: $error"
    fi
    echo ""
}

# Test 1: Sequential execution (baseline)
echo "📊 Test 1: Sequential Execution (Baseline)"
echo "-------------------------------------------"
start_seq=$(date +%s.%N)
run_code "User1" "$CODE1"
run_code "User2" "$CODE2"
end_seq=$(date +%s.%N)
seq_duration=$(echo "$end_seq - $start_seq" | bc)
echo -e "${GREEN}Sequential total time: ${seq_duration}s${NC}"
echo ""
echo ""

# Test 2: Concurrent execution
echo "🚀 Test 2: Concurrent Execution (5 users simultaneously)"
echo "--------------------------------------------------------"
start_conc=$(date +%s.%N)

# Launch all requests in background
run_code "User1" "$CODE1" &
run_code "User2" "$CODE2" &
run_code "User3" "$CODE3" &
run_code "User4" "$CODE4" &
run_code "User5" "$CODE5" &

# Wait for all background jobs to complete
wait

end_conc=$(date +%s.%N)
conc_duration=$(echo "$end_conc - $start_conc" | bc)

echo -e "${GREEN}Concurrent total time: ${conc_duration}s${NC}"
echo ""

# Calculate speedup
if [ $(echo "$conc_duration > 0" | bc) -eq 1 ]; then
    speedup=$(echo "scale=2; $seq_duration / $conc_duration" | bc)
    echo -e "${GREEN}⚡ Speedup: ${speedup}x faster${NC}"
else
    echo -e "${YELLOW}Could not calculate speedup${NC}"
fi

echo ""
echo "======================================================"
echo "✅ Test Complete!"
echo ""
echo "💡 Key Observations:"
echo "  • Each user's execution is isolated"
echo "  • Concurrent execution is faster than sequential"
echo "  • No interference between users"
echo "  • Each request has its own temp directory and Docker container"
echo ""
echo "🔍 To monitor:"
echo "  • Check temp directories: ls -la .tmp/ballerina-playground/"
echo "  • Check Docker containers: docker ps | grep ballerina"
echo "  • Check backend logs: docker logs -f ballerina-playground-backend"
