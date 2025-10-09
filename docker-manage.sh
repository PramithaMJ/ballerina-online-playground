#!/bin/bash

# Ballerina Playground - Docker Compose Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message "❌ Docker is not running. Please start Docker and try again." "$RED"
        exit 1
    fi
}

# Function to check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_message "❌ Docker Compose is not installed. Please install it and try again." "$RED"
        exit 1
    fi
}

# Help message
show_help() {
    echo "Ballerina Playground - Docker Management"
    echo ""
    echo "Usage: ./docker-manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Build and start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show logs from all services"
    echo "  logs-f    - Follow logs from all services"
    echo "  status    - Show status of all services"
    echo "  clean     - Stop and remove all containers, networks, and volumes"
    echo "  rebuild   - Rebuild images and restart services"
    echo "  backend   - Show backend logs"
    echo "  frontend  - Show frontend logs"
    echo "  help      - Show this help message"
    echo ""
}

# Check prerequisites
check_docker
check_docker_compose

# Determine docker compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Main script logic
case "${1:-help}" in
    start)
        print_message "🚀 Starting Ballerina Playground..." "$BLUE"
        $DOCKER_COMPOSE up -d --build
        print_message "✅ Services started successfully!" "$GREEN"
        print_message "📱 Frontend: http://localhost:5173" "$GREEN"
        print_message "🔧 Backend:  http://localhost:8081" "$GREEN"
        ;;
    
    stop)
        print_message "⏹️  Stopping services..." "$YELLOW"
        $DOCKER_COMPOSE down
        print_message "✅ Services stopped successfully!" "$GREEN"
        ;;
    
    restart)
        print_message "🔄 Restarting services..." "$YELLOW"
        $DOCKER_COMPOSE restart
        print_message "✅ Services restarted successfully!" "$GREEN"
        ;;
    
    logs)
        print_message "📋 Showing logs..." "$BLUE"
        $DOCKER_COMPOSE logs
        ;;
    
    logs-f)
        print_message "📋 Following logs (Ctrl+C to exit)..." "$BLUE"
        $DOCKER_COMPOSE logs -f
        ;;
    
    status)
        print_message "📊 Service Status:" "$BLUE"
        $DOCKER_COMPOSE ps
        ;;
    
    clean)
        print_message "🧹 Cleaning up..." "$YELLOW"
        $DOCKER_COMPOSE down -v --remove-orphans
        print_message "✅ Cleanup completed!" "$GREEN"
        ;;
    
    rebuild)
        print_message "🔨 Rebuilding services..." "$YELLOW"
        $DOCKER_COMPOSE down
        $DOCKER_COMPOSE build --no-cache
        $DOCKER_COMPOSE up -d
        print_message "✅ Rebuild completed!" "$GREEN"
        print_message "📱 Frontend: http://localhost:5173" "$GREEN"
        print_message "🔧 Backend:  http://localhost:8081" "$GREEN"
        ;;
    
    backend)
        print_message "📋 Backend logs (Ctrl+C to exit)..." "$BLUE"
        $DOCKER_COMPOSE logs -f backend
        ;;
    
    frontend)
        print_message "📋 Frontend logs (Ctrl+C to exit)..." "$BLUE"
        $DOCKER_COMPOSE logs -f frontend
        ;;
    
    help)
        show_help
        ;;
    
    *)
        print_message "❌ Unknown command: $1" "$RED"
        show_help
        exit 1
        ;;
esac
