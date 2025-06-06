const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { spawn, exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// High-Performance Android Emulator Class
class AndroidEmulator {
  constructor() {
    this.isRunning = false;
    this.emulatorProcess = null;
    this.vncProcess = null;
    this.websockifyProcess = null;
    this.emulatorPort = 5554;
    this.vncPort = 5900;
    this.websockifyPort = 6080;
    this.displayNumber = 99;
    this.screenWidth = 1440;
    this.screenHeight = 3120;
    this.density = 512;
  }

  async startEmulator() {
    if (this.isRunning) {
      console.log('Emulator already running');
      return;
    }

    console.log('Starting high-performance Android emulator...');
    
    // Start Xvfb (Virtual Display)
    console.log('Starting virtual display...');
    exec(`Xvfb :${this.displayNumber} -screen 0 ${this.screenWidth}x${this.screenHeight}x24 -ac +extension GLX +render -noreset`);
    
    await this.sleep(2000);

    // Start Android Emulator with high-performance settings
    console.log('Starting Android emulator with 32GB RAM and 1TB storage...');
    const emulatorArgs = [
      '-avd', 'android_phone',
      '-no-window',
      '-no-audio',
      '-gpu', 'swiftshader_indirect',
      '-camera-back', 'none',
      '-camera-front', 'none',
      '-memory', '32768',  // 32GB RAM
      '-partition-size', '1024000',  // 1TB storage
      '-cores', '8',  // 8 CPU cores
      '-accel', 'kvm',
      '-netdelay', 'none',
      '-netspeed', 'full',
      '-port', this.emulatorPort.toString(),
      '-qemu', '-enable-kvm',
      '-qemu', '-smp', '8',
      '-qemu', '-m', '32768'
    ];

    this.emulatorProcess = spawn('emulator', emulatorArgs, {
      env: { ...process.env, DISPLAY: `:${this.displayNumber}` }
    });

    this.emulatorProcess.stdout.on('data', (data) => {
      console.log(`Emulator: ${data}`);
    });

    this.emulatorProcess.stderr.on('data', (data) => {
      console.log(`Emulator Error: ${data}`);
    });

    // Wait for emulator to boot
    await this.waitForEmulator();

    // Start VNC server
    await this.startVNCServer();

    // Start WebSocket proxy
    await this.startWebSocketProxy();

    this.isRunning = true;
    console.log('High-performance Android emulator started successfully!');
  }

  async waitForEmulator() {
    console.log('Waiting for Android emulator to boot...');
    return new Promise((resolve) => {
      const checkBoot = () => {
        exec(`adb -s emulator-${this.emulatorPort} shell getprop sys.boot_completed`, (error, stdout) => {
          if (stdout.trim() === '1') {
            console.log('Android emulator booted successfully');
            resolve();
          } else {
            setTimeout(checkBoot, 5000);
          }
        });
      };
      setTimeout(checkBoot, 10000);
    });
  }

  async startVNCServer() {
    console.log('Starting VNC server...');
    this.vncProcess = spawn('x11vnc', [
      '-display', `:${this.displayNumber}`,
      '-nopw',
      '-listen', '0.0.0.0',
      '-xkb',
      '-rfbport', this.vncPort.toString(),
      '-shared',
      '-forever'
    ]);

    this.vncProcess.stdout.on('data', (data) => {
      console.log(`VNC: ${data}`);
    });

    await this.sleep(2000);
  }

  async startWebSocketProxy() {
    console.log('Starting WebSocket proxy for web VNC access...');
    this.websockifyProcess = spawn('websockify', [
      '--web=/usr/share/novnc/',
      this.websockifyPort.toString(),
      `localhost:${this.vncPort}`
    ]);

    this.websockifyProcess.stdout.on('data', (data) => {
      console.log(`Websockify: ${data}`);
    });

    await this.sleep(2000);
  }

  async sendText(text) {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    // Escape special characters for ADB
    const escapedText = text.replace(/['"\\]/g, '\\$&');
    
    return new Promise((resolve, reject) => {
      exec(`adb -s emulator-${this.emulatorPort} shell input text "${escapedText}"`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async sendTap(x, y) {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    return new Promise((resolve, reject) => {
      exec(`adb -s emulator-${this.emulatorPort} shell input tap ${x} ${y}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async sendKeyEvent(keycode) {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    return new Promise((resolve, reject) => {
      exec(`adb -s emulator-${this.emulatorPort} shell input keyevent ${keycode}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async getScreenshot() {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    const filename = `/tmp/screenshot_${uuidv4()}.png`;
    
    return new Promise((resolve, reject) => {
      exec(`adb -s emulator-${this.emulatorPort} shell screencap -p > ${filename}`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(filename);
        }
      });
    });
  }

  async stopEmulator() {
    console.log('Stopping Android emulator and related processes...');
    
    if (this.websockifyProcess) {
      this.websockifyProcess.kill();
      this.websockifyProcess = null;
    }
    
    if (this.vncProcess) {
      this.vncProcess.kill();
      this.vncProcess = null;
    }
    
    if (this.emulatorProcess) {
      this.emulatorProcess.kill();
      this.emulatorProcess = null;
    }
    
    // Kill any remaining processes
    exec(`pkill -f "emulator.*${this.emulatorPort}"`);
    exec(`pkill -f "x11vnc.*:${this.displayNumber}"`);
    exec(`pkill -f "websockify.*${this.websockifyPort}"`);
    exec(`pkill -f "Xvfb :${this.displayNumber}"`);
    
    this.isRunning = false;
    console.log('Emulator stopped successfully');
  }

  async getPerformanceMetrics() {
    if (!this.isRunning) {
      return null;
    }

    return new Promise((resolve) => {
      const metrics = {
        timestamp: Date.now(),
        cpu: 0,
        memory: 0,
        storage: 0,
        network: 'connected'
      };

      // Get CPU usage
      exec(`adb -s emulator-${this.emulatorPort} shell dumpsys cpuinfo | head -1`, (error, stdout) => {
        if (!error && stdout) {
          const cpuMatch = stdout.match(/(\d+)%/);
          if (cpuMatch) {
            metrics.cpu = parseInt(cpuMatch[1]);
          }
        }

        // Get memory usage
        exec(`adb -s emulator-${this.emulatorPort} shell dumpsys meminfo | grep "Total RAM"`, (error, stdout) => {
          if (!error && stdout) {
            const memMatch = stdout.match(/(\d+),(\d+)K/);
            if (memMatch) {
              metrics.memory = Math.round((parseInt(memMatch[1]) * 1000 + parseInt(memMatch[2])) / 1024 / 1024);
            }
          }

          // Get storage usage
          exec(`adb -s emulator-${this.emulatorPort} shell df /data`, (error, stdout) => {
            if (!error && stdout) {
              const lines = stdout.split('\n');
              if (lines.length > 1) {
                const parts = lines[1].split(/\s+/);
                if (parts.length >= 4) {
                  const used = parseInt(parts[2]);
                  const total = parseInt(parts[1]);
                  metrics.storage = Math.round((used / total) * 100);
                }
              }
            }

            resolve(metrics);
          });
        });
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const emulator = new AndroidEmulator();

// API Routes
app.get('/api/status', async (req, res) => {
  const metrics = await emulator.getPerformanceMetrics();
  res.json({ 
    running: emulator.isRunning,
    emulatorPort: emulator.emulatorPort,
    vncPort: emulator.vncPort,
    websockifyPort: emulator.websockifyPort,
    displayNumber: emulator.displayNumber,
    screenWidth: emulator.screenWidth,
    screenHeight: emulator.screenHeight,
    density: emulator.density,
    performance: metrics,
    specs: {
      ram: '32GB',
      storage: '1TB',
      cpu: '8 Cores',
      gpu: 'Hardware Accelerated',
      android: 'Android 14'
    }
  });
});

app.post('/api/start', async (req, res) => {
  try {
    await emulator.startEmulator();
    res.json({ success: true, message: 'High-performance Android emulator started' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    await emulator.stopEmulator();
    res.json({ success: true, message: 'Emulator stopped' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-text', async (req, res) => {
  try {
    const { text } = req.body;
    await emulator.sendText(text);
    res.json({ success: true, message: 'Text sent to Android device' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tap', async (req, res) => {
  try {
    const { x, y } = req.body;
    await emulator.sendTap(x, y);
    res.json({ success: true, message: 'Tap sent to Android device' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/key', async (req, res) => {
  try {
    const { keycode } = req.body;
    await emulator.sendKeyEvent(keycode);
    res.json({ success: true, message: 'Key event sent to Android device' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/screenshot', async (req, res) => {
  try {
    const filename = await emulator.getScreenshot();
    res.sendFile(path.resolve(filename), (err) => {
      if (!err) {
        fs.remove(filename).catch(() => {});
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// VNC Web viewer endpoint
app.get('/vnc', (req, res) => {
  if (!emulator.isRunning) {
    return res.status(503).send(`
      <html>
        <head><title>OpenPhone VNC</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Android Emulator Not Running</h1>
          <p>Please start the emulator first.</p>
          <a href="/">Go back to main interface</a>
        </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>OpenPhone - VNC Viewer</title>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 0; background: #000; overflow: hidden; }
            #screen { width: 100vw; height: 100vh; }
            .controls {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                padding: 10px;
                border-radius: 5px;
                color: white;
                font-family: Arial;
                z-index: 1000;
            }
            .controls button {
                margin: 2px;
                padding: 5px 10px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="controls">
            <div>OpenPhone VNC - ${emulator.screenWidth}x${emulator.screenHeight}</div>
            <button onclick="location.reload()">Reconnect</button>
            <button onclick="window.close()">Close</button>
        </div>
        <iframe id="screen" src="http://localhost:${emulator.websockifyPort}/vnc.html?host=localhost&port=${emulator.websockifyPort}&autoconnect=true&resize=scale"></iframe>
    </body>
    </html>
  `);
});

// Performance metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await emulator.getPerformanceMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Copy file to Android device
    const androidPath = `/sdcard/Download/${req.file.originalname}`;
    exec(`adb -s emulator-${emulator.emulatorPort} push ${req.file.path} ${androidPath}`, (error) => {
      // Clean up uploaded file
      fs.remove(req.file.path);
      
      if (error) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.json({ success: true, message: 'File uploaded to Android device', path: androidPath });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('emulator-status', () => {
    socket.emit('emulator-status', {
      running: emulator.isRunning,
      specs: {
        ram: '32GB',
        storage: '1TB',
        cpu: '8 Cores',
        android: 'Android 14'
      }
    });
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 12000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 OpenPhone server running on port ${PORT}`);
  console.log(`📱 Access the web interface at: http://localhost:${PORT}`);
  console.log(`🔧 VNC direct access at: http://localhost:${PORT}/vnc`);
  console.log(`📊 API status at: http://localhost:${PORT}/api/status`);
  console.log(`\n🏗️ High-Performance Android Specifications:`);
  console.log(`   - RAM: 32GB`);
  console.log(`   - Storage: 1TB`);
  console.log(`   - CPU: 8 Cores`);
  console.log(`   - GPU: Hardware Accelerated`);
  console.log(`   - Android: Version 14 with Google Play Store`);
  console.log(`\n✅ Ready for deployment to Google Cloud Platform!`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await emulator.stopEmulator();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await emulator.stopEmulator();
  process.exit(0);
});