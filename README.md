# OpenPhone - High-Performance Cloud Android Phone

A powerful web-based cloud Android phone system that runs a full Android 14 emulator with 32GB RAM and 1TB storage in the cloud, accessible through any web browser.

## 🚀 Features

### High-Performance Specifications
- **32GB RAM** - Massive memory for heavy apps and multitasking
- **1TB Storage** - Enormous storage space for apps, games, and files
- **8 CPU Cores** - Multi-core processing power
- **Hardware Acceleration** - KVM and GPU acceleration for smooth performance
- **Android 14** - Latest Android version with Google Play Store

### Web Interface
- **Real-time VNC Streaming** - Live screen streaming with minimal latency
- **Text Input & Copy/Paste** - Send text directly to Android apps
- **Touch & Gesture Support** - Full touch interaction through web browser
- **File Upload/Download** - Transfer files between your computer and Android
- **Hardware Key Controls** - Back, Home, Menu, Volume controls
- **Performance Monitoring** - Real-time CPU, memory, and storage metrics

### Cloud Deployment
- **Google Cloud Platform** - Optimized for GCP deployment
- **Auto-scaling** - Handles multiple concurrent users
- **High Availability** - Load balancing and redundancy
- **SSL/HTTPS** - Secure connections
- **Docker Containerized** - Easy deployment and scaling

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│   Load Balancer  │◄──►│  Cloud Instance │
│                 │    │     (Nginx)      │    │                 │
│ - React UI      │    │ - SSL/HTTPS      │    │ - Node.js API   │
│ - VNC Client    │    │ - WebSocket      │    │ - Android Emu   │
│ - File Upload   │    │ - Static Files   │    │ - VNC Server    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Deploy to Google Cloud

### Prerequisites
- Google Cloud Platform account
- `gcloud` CLI installed and configured
- Terraform installed (optional, for infrastructure as code)

### One-Click Deployment

```bash
# Clone the repository
git clone https://github.com/openhands-mentat-cli/OpenPhone.git
cd OpenPhone

# Add your GCP service account credentials
# Create gcp-service-account.json with your service account key

# Run the deployment script
./scripts/deploy-gcp.sh YOUR_PROJECT_ID us-central1 us-central1-a

# Wait for deployment (5-10 minutes)
# Access your cloud Android at the provided URL
```

## 📱 Usage Guide

### Starting Your Cloud Android

1. **Open the Web Interface**
   - Navigate to your deployment URL
   - Click "Start Android Phone"
   - Wait 2-3 minutes for initial boot

2. **Interacting with Android**
   - **Touch**: Click anywhere on the screen
   - **Text Input**: Type in the text box and click "Send to Phone"
   - **Hardware Keys**: Use the control panel buttons
   - **File Upload**: Drag and drop files or use the upload button

### Text Input Examples

```javascript
// Send email address
"user@example.com"

// Send multi-line text
"Line 1\nLine 2\nLine 3"

// Send special characters
"Password123!@#$%"
```

## 🔧 Configuration

### High-Performance Settings

The Android emulator is configured for maximum performance:

```ini
# 32GB RAM allocation
hw.ramSize=32768

# 1TB storage
disk.dataPartition.size=1024G

# 8 CPU cores
hw.cpu.ncore=8

# Hardware acceleration
hw.gpu.enabled=yes
hw.gpu.mode=swiftshader_indirect
```

## 📊 Performance Monitoring

### Real-time Metrics
- **CPU Usage**: Live CPU utilization
- **Memory Usage**: RAM consumption
- **Storage Usage**: Disk space utilization
- **Network Status**: Connection status

### API Endpoints
```bash
# Get system status
GET /api/status

# Get performance metrics
GET /api/metrics

# Take screenshot
GET /api/screenshot
```

## 🛠️ Troubleshooting

### Common Issues

1. **Emulator Won't Start**
   - Check KVM support: `kvm-ok`
   - Verify Android SDK: `which emulator`
   - Check logs: `docker logs openphone`

2. **VNC Connection Failed**
   - Verify VNC port: `netstat -ln | grep 5900`
   - Check firewall: `ufw status`
   - Test WebSocket: Browser dev tools

## 🔒 Security

### Production Security
- HTTPS/SSL encryption
- Firewall configuration
- User authentication (optional)
- Network isolation
- Regular security updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**OpenPhone** - Experience the power of a high-performance Android device in the cloud! 🚀📱