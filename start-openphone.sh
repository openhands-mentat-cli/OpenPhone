#!/bin/bash

# Quick Start Script for OpenPhone Cloud Android System
# This script pulls pre-built images from GitHub Container Registry and starts the system

set -e

echo "🚀 Starting OpenPhone Cloud Android System"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        log_info "Please install Docker first:"
        echo "  • macOS/Windows: Download Docker Desktop"
        echo "  • Linux: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose not found. Using docker compose instead."
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    log_success "Prerequisites check passed"
}

# Show available configurations
show_options() {
    echo ""
    log_info "📱 Available OpenPhone Configurations:"
    echo ""
    echo "1) 🏃 Quick Start (Regular)"
    echo "   • Standard Android emulation"
    echo "   • Good for basic usage and testing"
    echo "   • Minimal resource requirements"
    echo ""
    echo "2) 🧠 TPU-Accelerated (Advanced)"
    echo "   • Google Cloud TPU optimization"
    echo "   • AI/ML workload acceleration" 
    echo "   • Monitoring with Prometheus + Grafana"
    echo "   • Higher resource requirements"
    echo ""
    echo "3) 🏭 Production Optimized"
    echo "   • Multi-stage optimized build"
    echo "   • Enhanced security and performance"
    echo "   • Health checks and monitoring"
    echo ""
    
    read -p "Choose configuration (1-3): " choice
    echo ""
    
    case $choice in
        1)
            COMPOSE_FILE="docker-compose.yml"
            IMAGE_TYPE="regular"
            ;;
        2)
            COMPOSE_FILE="docker-compose.tpu.yml"
            IMAGE_TYPE="tpu"
            ;;
        3)
            COMPOSE_FILE="docker-compose.yml"
            IMAGE_TYPE="optimized"
            # Update compose file to use optimized image
            sed -i.bak 's/:latest/:optimized/g' docker-compose.yml
            ;;
        *)
            log_warning "Invalid choice. Using regular configuration."
            COMPOSE_FILE="docker-compose.yml"
            IMAGE_TYPE="regular"
            ;;
    esac
}

# Pull latest images
pull_images() {
    log_info "📥 Pulling latest OpenPhone images from GitHub Container Registry..."
    
    case $IMAGE_TYPE in
        "regular")
            docker pull ghcr.io/openhands-mentat-cli/openphone/openphone:latest
            ;;
        "tpu")
            docker pull ghcr.io/openhands-mentat-cli/openphone/openphone:tpu-latest
            docker pull prom/prometheus:latest
            docker pull grafana/grafana:latest
            ;;
        "optimized")
            docker pull ghcr.io/openhands-mentat-cli/openphone/openphone:optimized
            ;;
    esac
    
    log_success "Images pulled successfully"
}

# Start the system
start_system() {
    log_info "🚀 Starting OpenPhone system..."
    
    # Stop any existing containers
    $DOCKER_COMPOSE -f $COMPOSE_FILE down 2>/dev/null || true
    
    # Start the system
    $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
    
    log_success "OpenPhone system started successfully!"
}

# Wait for system to be ready
wait_for_system() {
    log_info "⏳ Waiting for system to be ready..."
    
    for i in {1..30}; do
        if curl -s http://localhost:12000/api/status > /dev/null 2>&1; then
            log_success "System is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_warning "System may still be starting up. Check logs if needed."
}

# Show access information
show_access_info() {
    echo ""
    log_success "🎉 OpenPhone System is Running!"
    echo "================================="
    echo ""
    log_info "🌐 Access Points:"
    echo "   • Web Interface: http://localhost:12000"
    echo "   • VNC Viewer: http://localhost:12000/vnc"
    echo "   • API Documentation: http://localhost:12000/api-docs"
    echo "   • Health Status: http://localhost:12000/api/status"
    
    if [ "$IMAGE_TYPE" = "tpu" ]; then
        echo "   • Grafana Dashboard: http://localhost:3000"
        echo "   • Prometheus Metrics: http://localhost:9090"
        echo ""
        log_info "🧠 TPU Features:"
        echo "   • AI/ML acceleration enabled"
        echo "   • Real-time performance monitoring"
        echo "   • Advanced system metrics"
    fi
    
    echo ""
    log_info "🔧 Management Commands:"
    echo "   • View logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f"
    echo "   • Stop system: $DOCKER_COMPOSE -f $COMPOSE_FILE down"
    echo "   • Restart: $DOCKER_COMPOSE -f $COMPOSE_FILE restart"
    echo "   • Update: docker pull <image> && $DOCKER_COMPOSE -f $COMPOSE_FILE up -d"
    echo ""
    log_info "📱 Creating Android Phones:"
    echo "   1. Open http://localhost:12000 in your browser"
    echo "   2. Click '➕ Add Phone' to create new Android instances"
    echo "   3. Choose from device profiles (iPhone, Pixel, Galaxy, etc.)"
    echo "   4. Use templates for different purposes (Gaming, Business, etc.)"
    echo ""
    log_info "⌨️ Keyboard Shortcuts:"
    echo "   • Ctrl+N: Create new phone"
    echo "   • Ctrl+S: Start/stop active phone"
    echo "   • Ctrl+M: Toggle system monitor"
    echo "   • ?: Show help"
}

# Cleanup function
cleanup() {
    if [ "$IMAGE_TYPE" = "optimized" ] && [ -f "docker-compose.yml.bak" ]; then
        mv docker-compose.yml.bak docker-compose.yml
    fi
}

# Main execution
main() {
    trap cleanup EXIT
    
    check_prerequisites
    show_options
    pull_images
    start_system
    wait_for_system
    show_access_info
    
    log_success "🚀 Setup complete! Enjoy your OpenPhone system!"
}

# Run main function
main "$@"
