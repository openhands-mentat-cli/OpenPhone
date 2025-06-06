# Cloud Android Phone - Complete Docker Setup
FROM ubuntu:22.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    openjdk-11-jdk \
    xvfb \
    x11vnc \
    websockify \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    bridge-utils \
    cpu-checker \
    adb \
    fastboot \
    python3 \
    python3-pip \
    nodejs \
    npm \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set up Android SDK
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator

# Create Android SDK directory
RUN mkdir -p ${ANDROID_HOME}

# Download and install Android SDK Command Line Tools
RUN cd ${ANDROID_HOME} && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-9477386_latest.zip && \
    mkdir -p cmdline-tools/latest && \
    mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true && \
    rm commandlinetools-linux-9477386_latest.zip

# Accept Android SDK licenses and install packages
RUN yes | ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager --licenses && \
    ${ANDROID_HOME}/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "emulator" \
    "system-images;android-34;google_apis;x86_64"

# Create working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install Node.js dependencies
RUN cd backend && npm install --production
RUN cd frontend && npm install

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build React frontend
RUN cd frontend && npm run build

# Create Android AVD
RUN echo "no" | ${ANDROID_HOME}/cmdline-tools/latest/bin/avdmanager create avd \
    -n CloudPhone \
    -k "system-images;android-34;google_apis;x86_64" \
    --force

# Configure AVD for high performance
RUN mkdir -p /root/.android/avd/CloudPhone.avd && \
    echo "avd.ini.encoding=UTF-8" > /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "abi.type=x86_64" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "disk.dataPartition.size=8G" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.accelerometer=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.audioInput=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.battery=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.camera.back=emulated" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.camera.front=emulated" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.cpu.arch=x86_64" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.cpu.ncore=4" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.dPad=no" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.gps=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.gpu.enabled=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.gpu.mode=swiftshader_indirect" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.keyboard=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.lcd.density=420" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.lcd.height=1920" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.lcd.width=1080" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.mainKeys=no" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.ramSize=4096" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.sdCard=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.sensors.orientation=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.sensors.proximity=yes" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "hw.trackBall=no" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "image.sysdir.1=system-images/android-34/google_apis/x86_64/" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "runtime.network.latency=none" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "runtime.network.speed=full" >> /root/.android/avd/CloudPhone.avd/config.ini && \
    echo "vm.heapSize=512" >> /root/.android/avd/CloudPhone.avd/config.ini

# Expose ports
EXPOSE 12000 5900 6080

# Create startup script
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'echo "🚀 Starting Cloud Android Phone System..."' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set the startup command
CMD ["/app/start.sh"]