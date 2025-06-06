# 📱 Cloud Android Phone

A complete cloud-based Android phone system that runs a full Android emulator in Docker, accessible through a web browser with real-time VNC streaming and text input capabilities - just like UGPhone and Redfinger!

## 🚀 Features

### 📱 Full Android Experience
- **Real Android 14** with Google Play Store
- **4GB RAM** and **8GB Storage** 
- **1080x1920 Resolution** at 420 DPI
- **Hardware acceleration** with KVM support
- **Multi-touch support** through web interface

### 🌐 Web Interface (UGPhone/Redfinger Style)
- **Real-time VNC streaming** - Live Android screen in browser
- **Text input box** - Type and send text directly to Android apps
- **Copy/paste functionality** - Send any text to the Android phone
- **Touch controls** - Click anywhere on screen to interact
- **Hardware key controls** - Back, Home, Recent, Volume, Power buttons
- **File upload** - Transfer files from computer to Android
- **Activity logging** - Real-time status and action feedback

### 🐳 Docker Deployment
- **One-command setup** - `docker-compose up`
- **Complete containerization** - Everything included
- **Persistent storage** - Android data survives container restarts
- **Health monitoring** - Automatic restart on failure
- **Port mapping** - Easy access to all services

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│   Docker Host    │◄──►│  Android Emu    │
│                 │    │                  │    │                 │
│ - React UI      │    │ - Node.js API    │    │ - Android 14    │
│ - VNC Client    │    │ - Express Server │    │ - 4GB RAM       │
│ - Text Input    │    │ - Socket.IO      │    │ - 8GB Storage   │
│ - File Upload   │    │ - VNC Server     │    │ - Google Play   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- KVM support (for hardware acceleration)
- At least 8GB RAM and 20GB disk space

### 1. Clone Repository
```bash
git clone https://github.com/openhands-mentat-cli/OpenPhone.git
cd OpenPhone
```

### 2. Start the System
```bash
# Build and start everything
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 3. Access Your Cloud Android
- **Web Interface**: http://localhost:12000
- **VNC Viewer**: http://localhost:12000/vnc
- **Direct VNC**: vnc://localhost:5900

### 4. Using the System

1. **Start Android Phone**
   - Open http://localhost:12000
   - Click "🚀 Start Phone" button
   - Wait 2-3 minutes for Android to boot

2. **Send Text to Android**
   - Type in the text input box
   - Click "📤 Send to Phone"
   - Text appears in currently focused Android app

3. **Interact with Android**
   - Click anywhere on the phone screen to tap
   - Use hardware key buttons (Back, Home, etc.)
   - Upload files using the file upload button

## 📱 Usage Examples

### Text Input Examples
```javascript
// Send email address
"user@example.com"

// Send password
"MyPassword123!"

// Send multi-line text
"Line 1\nLine 2\nLine 3"

// Send special characters
"Hello! @#$%^&*()"
```

### API Usage Examples
```bash
# Start the Android phone
curl -X POST http://localhost:12000/api/start

# Send text to Android
curl -X POST http://localhost:12000/api/send-text \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello Android!"}'

# Send tap coordinates
curl -X POST http://localhost:12000/api/tap \
  -H "Content-Type: application/json" \
  -d '{"x":540,"y":960}'

# Send hardware key (Back button)
curl -X POST http://localhost:12000/api/key \
  -H "Content-Type: application/json" \
  -d '{"keycode":4}'

# Get system status
curl http://localhost:12000/api/status

# Take screenshot
curl http://localhost:12000/api/screenshot > screenshot.png
```

## 🔧 Configuration

### Environment Variables
```bash
# Docker environment variables
ANDROID_HOME=/opt/android-sdk
ANDROID_SDK_ROOT=/opt/android-sdk
DISPLAY=:99

# Server configuration
PORT=12000
VNC_PORT=5900
WEBSOCKIFY_PORT=6080
```

### Android AVD Configuration
The Android Virtual Device is configured with:
- **RAM**: 4096MB
- **Storage**: 8GB data partition
- **CPU**: 4 cores
- **GPU**: Software rendering (swiftshader_indirect)
- **Network**: Full speed, no latency
- **Sensors**: Accelerometer, GPS, proximity

### Performance Tuning
For better performance:
1. **Enable KVM**: Ensure `/dev/kvm` is available
2. **Increase RAM**: Modify `hw.ramSize` in AVD config
3. **SSD Storage**: Use SSD for Docker volumes
4. **CPU Cores**: Allocate more CPU cores to Docker

## 🐳 Docker Commands

### Basic Operations
```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart openphone
```

### Advanced Operations
```bash
# Rebuild without cache
docker-compose build --no-cache

# Scale service (multiple instances)
docker-compose up --scale openphone=2

# Execute commands in container
docker-compose exec openphone bash

# View resource usage
docker stats cloud-android-phone
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect Android data volume
docker volume inspect openphone_android_data

# Backup Android data
docker run --rm -v openphone_android_data:/data -v $(pwd):/backup ubuntu tar czf /backup/android_backup.tar.gz /data

# Restore Android data
docker run --rm -v openphone_android_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/android_backup.tar.gz -C /
```

## 🔍 Troubleshooting

### Common Issues

1. **KVM Not Available**
   ```bash
   # Check KVM support
   kvm-ok
   
   # Add user to kvm group
   sudo usermod -a -G kvm $USER
   ```

2. **Port Already in Use**
   ```bash
   # Find process using port
   sudo lsof -i :12000
   
   # Kill process
   sudo kill -9 <PID>
   ```

3. **Android Won't Start**
   ```bash
   # Check container logs
   docker-compose logs openphone
   
   # Restart container
   docker-compose restart openphone
   ```

4. **VNC Connection Failed**
   ```bash
   # Check VNC process
   docker-compose exec openphone ps aux | grep vnc
   
   # Test VNC port
   telnet localhost 5900
   ```

### Performance Issues
- **Slow Android**: Increase RAM allocation in AVD config
- **Laggy VNC**: Reduce VNC quality settings
- **High CPU**: Enable hardware acceleration (KVM)

## 📊 Monitoring

### Health Checks
The system includes automatic health monitoring:
- **HTTP endpoint**: `/api/status`
- **Check interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 attempts

### Logs
View real-time logs:
```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f openphone

# Last 100 lines
docker-compose logs --tail=100 openphone
```

### Metrics
Monitor system resources:
```bash
# Container stats
docker stats cloud-android-phone

# System resources
docker-compose exec openphone top
```

## 🔒 Security

### Network Security
- **Firewall**: Configure firewall rules for ports 12000, 5900, 6080
- **VPN**: Use VPN for remote access
- **Authentication**: Add authentication layer for production use

### Container Security
- **User permissions**: Run with non-root user in production
- **Resource limits**: Set CPU and memory limits
- **Volume permissions**: Secure volume mount points

## 📄 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get system status |
| POST | `/api/start` | Start Android phone |
| POST | `/api/stop` | Stop Android phone |
| POST | `/api/send-text` | Send text to Android |
| POST | `/api/tap` | Send tap coordinates |
| POST | `/api/key` | Send key event |
| GET | `/api/screenshot` | Get screenshot |
| POST | `/api/upload` | Upload file to Android |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `get-status` | Request status update |
| `status-update` | Receive status update |
| `send-text` | Send text via WebSocket |
| `text-sent` | Text send confirmation |
| `send-tap` | Send tap via WebSocket |
| `tap-sent` | Tap send confirmation |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Android Open Source Project
- Docker Community
- VNC and WebSocket technologies
- React and Node.js communities

---

**Cloud Android Phone** - Experience the power of Android in the cloud! 🚀📱