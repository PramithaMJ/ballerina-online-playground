#!/bin/bash

# Ballerina Online Playground - Quick Start Script

echo "🚀 Starting Ballerina Online Playground..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is ready"

# Pull Ballerina Docker image if not exists
echo "📦 Checking Ballerina Docker image..."
if ! docker images | grep -q "ballerina/ballerina"; then
    echo "📥 Pulling Ballerina Docker image (this may take a while)..."
    docker pull ballerina/ballerina:latest
else
    echo "✅ Ballerina image already exists"
fi

# Navigate to backend directory
cd backend || exit 1

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.23 or higher."
    echo "   Visit: https://golang.org/doc/install"
    exit 1
fi

echo "✅ Go is ready"

# Download Go dependencies
echo "📦 Downloading Go dependencies..."
go mod download

# Start the backend server
echo ""
echo "🟢 Starting backend server on http://localhost:8081"
echo "📝 Press Ctrl+C to stop the server"
echo ""

go run main.go
