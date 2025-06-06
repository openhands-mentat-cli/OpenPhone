#!/bin/bash

# Secure Deployment Script for OpenPhone TPU System
# This script deploys OpenPhone to Google Cloud Platform with proper security

set -e

echo "🚀 Deploying OpenPhone TPU System to Google Cloud Platform"
echo "==========================================================="

# Configuration
PROJECT_ID="${PROJECT_ID:-capable-acrobat-460705-t1}"
INSTANCE_NAME="${INSTANCE_NAME:-openphone-vm}"
ZONE="${ZONE:-us-central1-b}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Security check for credentials
check_credentials() {
    log_info "Checking credentials security..."
    
    if [ ! -f "credentials/gcp-key.json" ]; then
        log_error "Credentials file not found at credentials/gcp-key.json"
        log_info "Please follow the secure setup guide:"
        log_info "1. Create a new service account in Google Cloud Console"
        log_info "2. Download the JSON key file"
        log_info "3. Place it at credentials/gcp-key.json"
        log_info "4. Make sure credentials/ is in .gitignore"
        exit 1
    fi
    
    # Check if credentials directory has secure permissions
    if [ "$(stat -c %a credentials)" != "700" ]; then
        log_warning "Setting secure permissions on credentials directory..."
        chmod 700 credentials
    fi
    
    if [ "$(stat -c %a credentials/gcp-key.json)" != "600" ]; then
        log_warning "Setting secure permissions on credentials file..."
        chmod 600 credentials/gcp-key.json
    fi
    
    log_success "Credentials security check passed"
}

# Environment setup
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.template" ]; then
            cp .env.template .env
            log_warning "Created .env from template. Please review and update the configuration."
            log_info "Edit .env file with your specific settings before continuing."
            read -p "Press Enter after configuring .env file..."
        else
            log_error ".env.template not found. Cannot create environment configuration."
            exit 1
        fi
    fi
    
    # Source environment variables
    source .env
    
    log_success "Environment configuration loaded"
}

# Build and deploy
deploy_system() {
    log_info "Building OpenPhone TPU system..."
    
    # Build the TPU-optimized Docker image
    docker build -f Dockerfile.tpu -t openphone-tpu:latest .
    
    log_success "Docker image built successfully"
    
    # Deploy with docker-compose
    log_info "Starting OpenPhone services..."
    docker-compose -f docker-compose.tpu.yml down 2>/dev/null || true
    docker-compose -f docker-compose.tpu.yml up -d
    
    log_success "OpenPhone services started"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check main service
    if curl -f http://localhost:12000/api/status > /dev/null 2>&1; then
        log_success "OpenPhone API is responding"
    else
        log_error "OpenPhone API is not responding"
        log_info "Check logs: docker-compose -f docker-compose.tpu.yml logs openphone-tpu"
        exit 1
    fi
    
    # Check monitoring
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        log_success "Prometheus is healthy"
    else
        log_warning "Prometheus may not be ready yet"
    fi
    
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Grafana is healthy"
    else
        log_warning "Grafana may not be ready yet"
    fi
}

# Get deployment info
show_deployment_info() {
    # Get external IP
    EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2>/dev/null || echo "localhost")
    
    log_success "🎉 OpenPhone TPU System Deployed Successfully!"
    echo "==========================================================="
    log_info "📋 Deployment Information:"
    echo "   • Project: $PROJECT_ID"
    echo "   • Instance: $INSTANCE_NAME"
    echo "   • Zone: $ZONE"
    echo "   • External IP: $EXTERNAL_IP"
    echo ""
    log_info "🌐 Access Points:"
    echo "   • OpenPhone Web: http://$EXTERNAL_IP:12000"
    echo "   • VNC Viewer: http://$EXTERNAL_IP:12000/vnc"
    echo "   • API Documentation: http://$EXTERNAL_IP:12000/api-docs"
    echo "   • Grafana Dashboard: http://$EXTERNAL_IP:3000"
    echo "   • Prometheus Metrics: http://$EXTERNAL_IP:9090"
    echo ""
    log_info "📊 Default Credentials:"
    echo "   • Grafana: admin / $(grep GRAFANA_ADMIN_PASSWORD .env | cut -d'=' -f2 || echo 'openphone-admin')"
    echo ""
    log_info "🔧 Management Commands:"
    echo "   • View logs: docker-compose -f docker-compose.tpu.yml logs -f"
    echo "   • Stop system: docker-compose -f docker-compose.tpu.yml down"
    echo "   • Restart system: docker-compose -f docker-compose.tpu.yml restart"
    echo "   • Update system: git pull && ./deploy/deploy-to-gcp.sh"
    echo ""
    log_warning "🔐 Security Reminders:"
    echo "   • Change default passwords in .env file"
    echo "   • Set up SSL/TLS certificates for production"
    echo "   • Configure firewall rules appropriately"
    echo "   • Monitor resource usage and costs"
    echo "   • Regularly update the system"
}

# Main deployment flow
main() {
    log_info "Starting OpenPhone TPU deployment process..."
    
    # Pre-deployment checks
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root. Consider using a non-root user with docker permissions."
    fi
    
    # Check if we're on the right instance
    if ! curl -s http://metadata.google.internal/computeMetadata/v1/instance/name -H "Metadata-Flavor: Google" &>/dev/null; then
        log_warning "Not running on Google Cloud Platform. Some features may not work."
    fi
    
    # Run deployment steps
    check_credentials
    setup_environment
    deploy_system
    health_check
    show_deployment_info
    
    log_success "🎉 Deployment completed successfully!"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO. Check logs for details."' ERR

# Run main function
main "$@"
