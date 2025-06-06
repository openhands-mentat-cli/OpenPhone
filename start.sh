#!/bin/bash

echo "🚀 Starting Cloud Android Phone System"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if KVM is available (optional but recommended)
if [ -e /dev/kvm ]; then
    echo "✅ KVM support detected - Hardware acceleration enabled"
else
    echo "⚠️  KVM not available - Using software rendering (slower)"
fi

echo ""
echo "🐳 Building and starting Docker containers..."
echo "This may take a few minutes on first run..."
echo ""

# Build and start the containers
docker-compose up --build

echo ""
echo "🎉 Cloud Android Phone is ready!"
echo ""
echo "📱 Access your cloud Android phone at:"
echo "   Web Interface: http://localhost:12000"
echo "   VNC Viewer: http://localhost:12000/vnc"
echo ""
echo "🔧 To stop the system, press Ctrl+C or run:"
echo "   docker-compose down"
echo ""