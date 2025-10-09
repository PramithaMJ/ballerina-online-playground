#!/bin/bash
# Pre-pull Ballerina Docker image
# This ensures the image is available before running the application

echo "📦 Pulling Ballerina Docker image..."
docker pull ballerina/ballerina:2201.10.2

if [ $? -eq 0 ]; then
    echo "✅ Ballerina image pulled successfully!"
    echo ""
    docker images ballerina/ballerina:2201.10.2
else
    echo "❌ Failed to pull Ballerina image"
    exit 1
fi
