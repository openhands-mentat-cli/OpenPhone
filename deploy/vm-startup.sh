#!/bin/bash

# VM Startup Script for OpenPhone TPU System
# This script runs when the GCP VM instance starts up

set -e

echo "🚀 Starting OpenPhone VM Setup..."
echo "================================="

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $(whoami)

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install NVIDIA Docker support for GPU acceleration
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
   && curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add - \
   && curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list

apt-get update
apt-get install -y nvidia-docker2
systemctl restart docker

# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
source /root/.bashrc

# Install additional tools
apt-get install -y \
    git \
    curl \
    wget \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx

# Create application directory
mkdir -p /app
cd /app

# Clone OpenPhone repository
echo "📥 Cloning OpenPhone repository..."
git clone https://github.com/openhands-mentat-cli/OpenPhone.git .

# Create credentials directory (secure permissions)
mkdir -p /app/credentials
chmod 700 /app/credentials

# Create monitoring directories
mkdir -p /app/monitoring/{prometheus,grafana/dashboards,grafana/datasources}

# Create Prometheus configuration
cat > /app/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'openphone'
    static_configs:
      - targets: ['localhost:12000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
EOF

# Create Grafana datasource configuration
cat > /app/monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create basic Grafana dashboard
cat > /app/monitoring/grafana/dashboards/openphone.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "OpenPhone System Monitoring",
    "tags": ["openphone"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Active Phones",
        "type": "stat",
        "targets": [
          {
            "expr": "openphone_active_phones_total",
            "refId": "A"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "System CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "refId": "A"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ],
    "time": {"from": "now-1h", "to": "now"},
    "refresh": "5s"
  }
}
EOF

# Create environment file template
cat > /app/.env.template << 'EOF'
# OpenPhone TPU Configuration
TPU_NAME=openphone-tpu
TPU_ZONE=us-central1-b
MAX_PHONES=10
ENABLE_GPU_ACCELERATION=true
ENABLE_TPU_ACCELERATION=true
LOG_LEVEL=INFO

# Security Settings
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
API_KEY=GENERATE_RANDOM_API_KEY

# Google Cloud Settings
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-key.json

# Database Settings (if using external DB)
# DATABASE_URL=postgresql://user:pass@host:port/db

# Monitoring Settings
GRAFANA_ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
PROMETHEUS_RETENTION=7d
EOF

# Set up log rotation
cat > /etc/logrotate.d/openphone << 'EOF'
/app/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Create systemd service for OpenPhone
cat > /etc/systemd/system/openphone.service << 'EOF'
[Unit]
Description=OpenPhone TPU System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/app
ExecStart=/usr/local/bin/docker-compose -f docker-compose.tpu.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.tpu.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl daemon-reload
systemctl enable openphone.service

# Create nginx configuration for reverse proxy
cat > /etc/nginx/sites-available/openphone << 'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:12000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Increase timeouts for long-running operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /grafana/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/openphone /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t && systemctl restart nginx

echo "✅ VM setup completed successfully!"
echo "🔐 Remember to:"
echo "   1. Copy your GCP service account key to /app/credentials/gcp-key.json"
echo "   2. Copy .env.template to .env and configure your settings"
echo "   3. Start the OpenPhone system: systemctl start openphone"
echo "   4. Check logs: docker-compose -f docker-compose.tpu.yml logs -f"
