#!/bin/bash

# Google Cloud Platform Setup Script for OpenPhone TPU System
# This script sets up the infrastructure for running OpenPhone with TPU acceleration

set -e

echo "🚀 Setting up OpenPhone TPU Infrastructure on Google Cloud Platform"
echo "=================================================================="

# Configuration
PROJECT_ID="${PROJECT_ID:-capable-acrobat-460705-t1}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-b}"
TPU_NAME="${TPU_NAME:-openphone-tpu}"
INSTANCE_NAME="${INSTANCE_NAME:-openphone-vm}"

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

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI is not installed. Please install it first:"
    log_info "curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Check authentication
log_info "Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
    log_warning "Not authenticated. Please run: gcloud auth login"
    exit 1
fi

# Set project
log_info "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
log_info "Enabling required Google Cloud APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable tpu.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com

# Create TPU
log_info "Creating TPU instance..."
if gcloud compute tpus describe $TPU_NAME --zone=$ZONE &> /dev/null; then
    log_warning "TPU $TPU_NAME already exists"
else
    gcloud compute tpus create $TPU_NAME \
        --zone=$ZONE \
        --accelerator-type=v3-8 \
        --version=tpu-ubuntu2204-base \
        --network=default \
        --description="TPU for OpenPhone Android Emulation"
    log_success "TPU created successfully"
fi

# Create VM instance optimized for Android emulation
log_info "Creating VM instance..."
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &> /dev/null; then
    log_warning "VM $INSTANCE_NAME already exists"
else
    gcloud compute instances create $INSTANCE_NAME \
        --zone=$ZONE \
        --machine-type=n1-highmem-8 \
        --accelerator=type=nvidia-tesla-t4,count=1 \
        --maintenance-policy=TERMINATE \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=100GB \
        --boot-disk-type=pd-ssd \
        --metadata-from-file startup-script=deploy/vm-startup.sh \
        --tags=openphone-server,http-server,https-server \
        --scopes=cloud-platform
    log_success "VM instance created successfully"
fi

# Create firewall rules
log_info "Setting up firewall rules..."
if ! gcloud compute firewall-rules describe openphone-ports &> /dev/null; then
    gcloud compute firewall-rules create openphone-ports \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:12000,tcp:5900,tcp:6080,tcp:3000,tcp:9090 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=openphone-server \
        --description="Allow OpenPhone service ports"
    log_success "Firewall rules created"
else
    log_warning "Firewall rules already exist"
fi

# Create service account (if not exists)
SERVICE_ACCOUNT_EMAIL="openphone-service@${PROJECT_ID}.iam.gserviceaccount.com"
log_info "Setting up service account..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &> /dev/null; then
    gcloud iam service-accounts create openphone-service \
        --display-name="OpenPhone Service Account" \
        --description="Service account for OpenPhone TPU system"
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/tpu.admin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/compute.instanceAdmin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/monitoring.metricWriter"
    
    log_success "Service account created and configured"
else
    log_warning "Service account already exists"
fi

# Get VM external IP
VM_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

log_success "🎉 OpenPhone TPU Infrastructure Setup Complete!"
echo "=================================================================="
log_info "📋 Setup Summary:"
echo "   • Project: $PROJECT_ID"
echo "   • Region: $REGION"
echo "   • Zone: $ZONE"
echo "   • TPU: $TPU_NAME"
echo "   • VM Instance: $INSTANCE_NAME"
echo "   • VM IP: $VM_IP"
echo ""
log_info "🌐 Access Points (once deployed):"
echo "   • OpenPhone Web: http://$VM_IP:12000"
echo "   • VNC Viewer: http://$VM_IP:12000/vnc"
echo "   • API Docs: http://$VM_IP:12000/api-docs"
echo "   • Grafana: http://$VM_IP:3000"
echo "   • Prometheus: http://$VM_IP:9090"
echo ""
log_info "📱 Next Steps:"
echo "   1. Wait for VM to finish startup (5-10 minutes)"
echo "   2. SSH to VM: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   3. Deploy OpenPhone: ./deploy/deploy-to-gcp.sh"
echo ""
log_warning "🔐 Security Reminders:"
echo "   • Never commit GCP credentials to version control"
echo "   • Use environment variables or secret managers"
echo "   • Regularly rotate service account keys"
echo "   • Monitor costs and set billing alerts"
