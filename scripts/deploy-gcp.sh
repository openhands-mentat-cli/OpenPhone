#!/bin/bash

# OpenPhone Google Cloud Deployment Script
# This script deploys the OpenPhone cloud Android system to Google Cloud Platform

set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
ZONE=${3:-"us-central1-a"}
MACHINE_TYPE=${4:-"c2-standard-30"}  # 30 vCPUs, 120GB RAM

echo "🚀 Deploying OpenPhone to Google Cloud Platform"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Zone: $ZONE"
echo "Machine Type: $MACHINE_TYPE"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found. Please install it first."
    exit 1
fi

# Set project
echo "📋 Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Build and push Docker image
echo "🐳 Building Docker image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/openphone:latest -f docker/Dockerfile .

# Deploy using Terraform
echo "🏗️ Deploying infrastructure with Terraform..."
cd terraform
terraform init
terraform apply -var="project_id=$PROJECT_ID" -var="region=$REGION" -var="zone=$ZONE" -auto-approve

echo "✅ Deployment completed successfully!"
echo "📱 Access your cloud Android at the provided URL"