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

// Multi-Phone Management System
class PhoneManager {
  constructor() {
    this.phones = new Map();
    this.nextPhoneId = 1;
    this.baseEmulatorPort = 5554;
    this.baseVncPort = 5900;
    this.baseWebsockifyPort = 6080;
    this.baseDisplayNumber = 99;
    this.androidSdkPath = '/opt/android-sdk';
  }

  createPhone(config) {
    const phoneId = `phone-${this.nextPhoneId++}`;
    const phone = new CloudAndroidPhone(phoneId, {
      ...config,
      emulatorPort: this.baseEmulatorPort + (this.nextPhoneId - 2) * 2,
      vncPort: this.baseVncPort + (this.nextPhoneId - 2) * 2,
      websockifyPort: this.baseWebsockifyPort + (this.nextPhoneId - 2) * 2,
      displayNumber: this.baseDisplayNumber + (this.nextPhoneId - 2),
      androidSdkPath: this.androidSdkPath
    });
    
    this.phones.set(phoneId, phone);
    return phone;
  }

  getPhone(phoneId) {
    return this.phones.get(phoneId);
  }

  getAllPhones() {
    return Array.from(this.phones.values());
  }

  deletePhone(phoneId) {
    const phone = this.phones.get(phoneId);
    if (phone) {
      phone.stopCloudPhone();
      this.phones.delete(phoneId);
      return true;
    }
    return false;
  }
}

// Enhanced Cloud Android Phone System with Real Android 14
class CloudAndroidPhone {
  constructor(phoneId, config = {}) {
    this.phoneId = phoneId;
    this.name = config.name || `Phone ${phoneId}`;
    this.isRunning = false;
    this.emulatorProcess = null;
    this.vncProcess = null;
    this.websockifyProcess = null;
    this.xvfbProcess = null;
    
    // Port configuration
    this.emulatorPort = config.emulatorPort || 5554;
    this.vncPort = config.vncPort || 5900;
    this.websockifyPort = config.websockifyPort || 6080;
    this.displayNumber = config.displayNumber || 99;
    
    // Android configuration
    this.androidVersion = config.androidVersion || 'android-34'; // Android 14
    this.screenWidth = parseInt(config.resolution?.split('x')[0]) || 1080;
    this.screenHeight = parseInt(config.resolution?.split('x')[1]) || 1920;
    this.density = parseInt(config.density) || 420;
    this.ramSize = parseInt(config.ram) || 4096; // MB
    this.storageSize = parseInt(config.storage) || 8192; // MB
    
    // Paths
    this.androidSdkPath = config.androidSdkPath || '/opt/android-sdk';
    this.avdName = `CloudPhone_${phoneId}`;
    
    // Performance settings
    this.cpuCores = Math.min(parseInt(config.cpuCores) || 4, 8);
    this.gpuMode = config.gpuMode || 'swiftshader_indirect';
  }

  async setupAndroidSDK() {
    console.log(`🔧 Setting up Android SDK for ${this.phoneId}...`);
    
    // Create SDK directory
    await fs.ensureDir(this.androidSdkPath);
    
    // Download and setup Android SDK if not exists
    if (!await fs.pathExists(`${this.androidSdkPath}/emulator/emulator`)) {
      console.log('📥 Downloading Android SDK and Android 14 system images...');
      
      return new Promise((resolve, reject) => {
        // Download command line tools
        exec(`cd ${this.androidSdkPath} && wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip`, (error) => {
          if (error) {
            console.error('Failed to download command line tools:', error);
            reject(error);
            return;
          }
          
          // Extract and setup
          exec(`cd ${this.androidSdkPath} && unzip -q commandlinetools-linux-9477386_latest.zip && mkdir -p cmdline-tools/latest && mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true`, (error) => {
            if (error) {
              console.error('Failed to extract command line tools:', error);
              reject(error);
              return;
            }
            
            // Set environment variables
            process.env.ANDROID_HOME = this.androidSdkPath;
            process.env.ANDROID_SDK_ROOT = this.androidSdkPath;
            process.env.PATH = `${this.androidSdkPath}/cmdline-tools/latest/bin:${this.androidSdkPath}/platform-tools:${this.androidSdkPath}/emulator:${process.env.PATH}`;
            
            console.log('📱 Installing Android 14 (API 34) with Google Play Store...');
            
            // Accept licenses and install Android 14 packages
            exec(`yes | ${this.androidSdkPath}/cmdline-tools/latest/bin/sdkmanager --licenses`, (error) => {
              if (error) {
                console.error('Failed to accept licenses:', error);
                reject(error);
                return;
              }
              
              // Install essential packages for Android 14
              const packages = [
                'platform-tools',
                'platforms;android-34',
                'emulator',
                'system-images;android-34;google_apis_playstore;x86_64', // Android 14 with Play Store
                'system-images;android-34;google_apis;x86_64',           // Android 14 fallback
                'build-tools;34.0.0',
                'extras;google;google_play_services'
              ];
              
              exec(`${this.androidSdkPath}/cmdline-tools/latest/bin/sdkmanager "${packages.join('" "')}"`, (error, stdout, stderr) => {
                if (error) {
                  console.error('Failed to install Android packages:', error);
                  console.error('stderr:', stderr);
                  reject(error);
                  return;
                }
                
                console.log('✅ Android 14 SDK and system images installed successfully');
                console.log('📦 Installed packages:', packages.join(', '));
                resolve();
              });
            });
          });
        });
      });
    } else {
      console.log('✅ Android SDK already installed');
    }
  }

  async createAVD() {
    console.log(`📱 Creating Android 14 Virtual Device for ${this.phoneId}...`);
    
    const avdPath = `${process.env.HOME}/.android/avd/${this.avdName}.avd`;
    
    if (!await fs.pathExists(avdPath)) {
      // Try Android 14 with Play Store first, fallback to regular Google APIs
      const systemImages = [
        'system-images;android-34;google_apis_playstore;x86_64',
        'system-images;android-34;google_apis;x86_64'
      ];
      
      let avdCreated = false;
      
      for (const systemImage of systemImages) {
        try {
          console.log(`📱 Attempting to create AVD with ${systemImage}...`);
          
          const createAVDCommand = `echo "no" | ${this.androidSdkPath}/cmdline-tools/latest/bin/avdmanager create avd -n ${this.avdName} -k "${systemImage}" --force`;
          
          await new Promise((resolve, reject) => {
            exec(createAVDCommand, (error, stdout, stderr) => {
              if (error) {
                console.log(`⚠️ Failed with ${systemImage}, trying next...`);
                reject(error);
              } else {
                console.log(`✅ AVD created successfully with ${systemImage}`);
                avdCreated = true;
                resolve();
              }
            });
          });
          
          if (avdCreated) break;
          
        } catch (error) {
          console.log(`⚠️ ${systemImage} not available, trying fallback...`);
          continue;
        }
      }
      
      if (!avdCreated) {
        throw new Error('Failed to create AVD with any available system image');
      }

      // Configure AVD for high performance with custom specs
      const configPath = `${avdPath}/config.ini`;
      const config = `
avd.ini.encoding=UTF-8
abi.type=x86_64
disk.dataPartition.size=${Math.floor(this.storageSize / 1024)}G
hw.accelerometer=yes
hw.audioInput=yes
hw.battery=yes
hw.camera.back=emulated
hw.camera.front=emulated
hw.cpu.arch=x86_64
hw.cpu.ncore=${this.cpuCores}
hw.dPad=no
hw.device.hash2=MD5:524e03c783a7f7bc3c0a8d5d3c3b0b8e
hw.device.manufacturer=Google
hw.device.name=pixel_7_pro
hw.gps=yes
hw.gpu.enabled=yes
hw.gpu.mode=${this.gpuMode}
hw.keyboard=yes
hw.lcd.density=${this.density}
hw.lcd.height=${this.screenHeight}
hw.lcd.width=${this.screenWidth}
hw.mainKeys=no
hw.ramSize=${this.ramSize}
hw.sdCard=yes
hw.sensors.orientation=yes
hw.sensors.proximity=yes
hw.trackBall=no
image.sysdir.1=system-images/android-34/google_apis_playstore/x86_64/
runtime.network.latency=none
runtime.network.speed=full
vm.heapSize=${Math.floor(this.ramSize / 8)}
PlayStore.enabled=true
tag.display=Google Play
tag.id=google_apis_playstore
`;
      await fs.writeFile(configPath, config);
      
      console.log(`✅ Android 14 AVD configured with ${this.ramSize}MB RAM, ${this.storageSize}MB storage`);
    } else {
      console.log('✅ AVD already exists');
    }
  }

  async startVirtualDisplay() {
    console.log('🖥️ Starting virtual display...');
    
    return new Promise((resolve) => {
      this.xvfbProcess = spawn('Xvfb', [
        `:${this.displayNumber}`,
        '-screen', '0',
        `${this.screenWidth}x${this.screenHeight}x24`,
        '-ac',
        '+extension', 'GLX',
        '+render',
        '-noreset'
      ]);

      this.xvfbProcess.stdout.on('data', (data) => {
        console.log(`Xvfb: ${data}`);
      });

      this.xvfbProcess.stderr.on('data', (data) => {
        console.log(`Xvfb Error: ${data}`);
      });

      // Wait for display to be ready
      setTimeout(() => {
        console.log('✅ Virtual display started');
        resolve();
      }, 3000);
    });
  }

  async startAndroidEmulator() {
    console.log('🚀 Starting Android emulator...');
    
    const emulatorPath = `${this.androidSdkPath}/emulator/emulator`;
    
    return new Promise((resolve, reject) => {
      this.emulatorProcess = spawn(emulatorPath, [
        '-avd', this.avdName,
        '-no-window',
        '-no-audio',
        '-gpu', 'swiftshader_indirect',
        '-camera-back', 'none',
        '-camera-front', 'none',
        '-memory', '4096',
        '-cores', '4',
        '-netdelay', 'none',
        '-netspeed', 'full',
        '-port', this.emulatorPort.toString(),
        '-verbose'
      ], {
        env: { 
          ...process.env, 
          DISPLAY: `:${this.displayNumber}`,
          ANDROID_HOME: this.androidSdkPath,
          ANDROID_SDK_ROOT: this.androidSdkPath
        }
      });

      this.emulatorProcess.stdout.on('data', (data) => {
        console.log(`Emulator: ${data}`);
        if (data.toString().includes('boot completed')) {
          console.log('✅ Android emulator booted successfully');
          resolve();
        }
      });

      this.emulatorProcess.stderr.on('data', (data) => {
        console.log(`Emulator Error: ${data}`);
      });

      this.emulatorProcess.on('error', (error) => {
        console.error('Failed to start emulator:', error);
        reject(error);
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        console.log('✅ Emulator startup timeout reached, assuming ready');
        resolve();
      }, 300000);
    });
  }

  async waitForEmulatorBoot() {
    console.log('⏳ Waiting for Android to boot...');
    
    return new Promise((resolve) => {
      const checkBoot = () => {
        exec(`${this.androidSdkPath}/platform-tools/adb -s emulator-${this.emulatorPort} shell getprop sys.boot_completed`, (error, stdout) => {
          if (stdout && stdout.trim() === '1') {
            console.log('✅ Android boot completed');
            resolve();
          } else {
            console.log('⏳ Still booting...');
            setTimeout(checkBoot, 10000);
          }
        });
      };
      
      // Start checking after 30 seconds
      setTimeout(checkBoot, 30000);
    });
  }

  async startVNCServer() {
    console.log('📺 Starting VNC server...');
    
    return new Promise((resolve) => {
      this.vncProcess = spawn('x11vnc', [
        '-display', `:${this.displayNumber}`,
        '-nopw',
        '-listen', '0.0.0.0',
        '-xkb',
        '-rfbport', this.vncPort.toString(),
        '-shared',
        '-forever',
        '-noxrecord',
        '-noxfixes',
        '-noxdamage',
        '-wait', '10'
      ]);

      this.vncProcess.stdout.on('data', (data) => {
        console.log(`VNC: ${data}`);
      });

      this.vncProcess.stderr.on('data', (data) => {
        console.log(`VNC Error: ${data}`);
      });

      setTimeout(() => {
        console.log('✅ VNC server started');
        resolve();
      }, 5000);
    });
  }

  async startWebSocketProxy() {
    console.log('🌐 Starting WebSocket proxy...');
    
    return new Promise((resolve) => {
      this.websockifyProcess = spawn('websockify', [
        '--web=/usr/share/novnc/',
        this.websockifyPort.toString(),
        `localhost:${this.vncPort}`
      ]);

      this.websockifyProcess.stdout.on('data', (data) => {
        console.log(`Websockify: ${data}`);
      });

      this.websockifyProcess.stderr.on('data', (data) => {
        console.log(`Websockify Error: ${data}`);
      });

      setTimeout(() => {
        console.log('✅ WebSocket proxy started');
        resolve();
      }, 3000);
    });
  }

  async startCloudPhone() {
    if (this.isRunning) {
      console.log('📱 Cloud Android phone already running');
      return;
    }

    try {
      console.log('🚀 Starting Cloud Android Phone System...');
      
      // Setup Android SDK
      await this.setupAndroidSDK();
      
      // Create AVD
      await this.createAVD();
      
      // Start virtual display
      await this.startVirtualDisplay();
      
      // Start Android emulator
      await this.startAndroidEmulator();
      
      // Wait for boot
      await this.waitForEmulatorBoot();
      
      // Start VNC server
      await this.startVNCServer();
      
      // Start WebSocket proxy
      await this.startWebSocketProxy();
      
      this.isRunning = true;
      console.log('🎉 Cloud Android Phone is ready!');
      console.log(`📱 Access at: http://localhost:${this.websockifyPort}/vnc.html`);
      
    } catch (error) {
      console.error('❌ Failed to start cloud phone:', error);
      throw error;
    }
  }

  async sendText(text) {
    if (!this.isRunning) {
      throw new Error('Cloud phone not running');
    }

    console.log(`📝 Sending text: ${text}`);
    
    // Escape special characters for shell
    const escapedText = text.replace(/['"\\$`]/g, '\\$&');
    
    return new Promise((resolve, reject) => {
      exec(`${this.androidSdkPath}/platform-tools/adb -s emulator-${this.emulatorPort} shell input text "${escapedText}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error sending text:', error);
          reject(error);
        } else {
          console.log('✅ Text sent successfully');
          resolve(stdout);
        }
      });
    });
  }

  async sendTap(x, y) {
    if (!this.isRunning) {
      throw new Error('Cloud phone not running');
    }

    console.log(`👆 Sending tap: ${x}, ${y}`);
    
    return new Promise((resolve, reject) => {
      exec(`${this.androidSdkPath}/platform-tools/adb -s emulator-${this.emulatorPort} shell input tap ${x} ${y}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error sending tap:', error);
          reject(error);
        } else {
          console.log('✅ Tap sent successfully');
          resolve(stdout);
        }
      });
    });
  }

  async sendKeyEvent(keycode) {
    if (!this.isRunning) {
      throw new Error('Cloud phone not running');
    }

    console.log(`⌨️ Sending key event: ${keycode}`);
    
    return new Promise((resolve, reject) => {
      exec(`${this.androidSdkPath}/platform-tools/adb -s emulator-${this.emulatorPort} shell input keyevent ${keycode}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error sending key event:', error);
          reject(error);
        } else {
          console.log('✅ Key event sent successfully');
          resolve(stdout);
        }
      });
    });
  }

  async getScreenshot() {
    if (!this.isRunning) {
      throw new Error('Cloud phone not running');
    }

    const filename = `/tmp/screenshot_${uuidv4()}.png`;
    
    return new Promise((resolve, reject) => {
      exec(`${this.androidSdkPath}/platform-tools/adb -s emulator-${this.emulatorPort} shell screencap -p > ${filename}`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(filename);
        }
      });
    });
  }

  async stopCloudPhone() {
    console.log('🛑 Stopping Cloud Android Phone...');
    
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
    
    if (this.xvfbProcess) {
      this.xvfbProcess.kill();
      this.xvfbProcess = null;
    }
    
    // Kill any remaining processes
    exec(`pkill -f "emulator.*${this.emulatorPort}"`);
    exec(`pkill -f "x11vnc.*:${this.displayNumber}"`);
    exec(`pkill -f "websockify.*${this.websockifyPort}"`);
    exec(`pkill -f "Xvfb :${this.displayNumber}"`);
    
    this.isRunning = false;
    console.log('✅ Cloud Android Phone stopped');
  }

  getStatus() {
    return {
      running: this.isRunning,
      emulatorPort: this.emulatorPort,
      vncPort: this.vncPort,
      websockifyPort: this.websockifyPort,
      displayNumber: this.displayNumber,
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      density: this.density,
      avdName: this.avdName,
      vncUrl: `http://localhost:${this.websockifyPort}/vnc.html`,
      specs: {
        ram: '4GB',
        storage: '8GB',
        cpu: '4 Cores',
        android: 'Android 14',
        resolution: `${this.screenWidth}x${this.screenHeight}`
      }
    };
  }
}

// Initialize phone manager
const phoneManager = new PhoneManager();

// Create default phone on startup
const defaultPhone = phoneManager.createPhone({
  name: 'Phone 1',
  androidVersion: 'android-34',
  ram: 4096,
  storage: 8192,
  resolution: '1080x1920',
  density: 420
});

// API Routes

// Get all phones
app.get('/api/phones', (req, res) => {
  const phones = phoneManager.getAllPhones().map(phone => ({
    id: phone.phoneId,
    name: phone.name,
    status: phone.getStatus(),
    emulatorPort: phone.emulatorPort,
    vncPort: phone.vncPort,
    websockifyPort: phone.websockifyPort
  }));
  res.json(phones);
});

// Create new phone
app.post('/api/phones', (req, res) => {
  try {
    const config = req.body;
    const phone = phoneManager.createPhone(config);
    res.json({ 
      success: true, 
      phone: {
        id: phone.phoneId,
        name: phone.name,
        status: phone.getStatus(),
        emulatorPort: phone.emulatorPort,
        vncPort: phone.vncPort,
        websockifyPort: phone.websockifyPort
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete phone
app.delete('/api/phones/:id', (req, res) => {
  try {
    const phoneId = req.params.id;
    const success = phoneManager.deletePhone(phoneId);
    if (success) {
      res.json({ success: true, message: 'Phone deleted successfully' });
    } else {
      res.status(404).json({ success: false, error: 'Phone not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get phone status (supports both single phone and multi-phone APIs)
app.get('/api/status', (req, res) => {
  const phoneId = req.query.phoneId || 'phone-1';
  const phone = phoneManager.getPhone(phoneId);
  
  if (!phone) {
    return res.status(404).json({ success: false, error: 'Phone not found' });
  }
  
  res.json(phone.getStatus());
});

// Start phone
app.post('/api/start', async (req, res) => {
  try {
    const phoneId = req.body.phoneId || 'phone-1';
    const phone = phoneManager.getPhone(phoneId);
    
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }
    
    await phone.startCloudPhone();
    res.json({ success: true, message: 'Cloud Android phone started successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop phone
app.post('/api/stop', async (req, res) => {
  try {
    const phoneId = req.body.phoneId || 'phone-1';
    const phone = phoneManager.getPhone(phoneId);
    
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }
    
    await phone.stopCloudPhone();
    res.json({ success: true, message: 'Cloud Android phone stopped' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send text
app.post('/api/send-text', async (req, res) => {
  try {
    const { text, phoneId } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    
    const phone = phoneManager.getPhone(phoneId || 'phone-1');
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }
    
    await phone.sendText(text);
    res.json({ success: true, message: 'Text sent to Android phone' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send tap
app.post('/api/tap', async (req, res) => {
  try {
    const { x, y, phoneId } = req.body;
    if (x === undefined || y === undefined) {
      return res.status(400).json({ success: false, error: 'x and y coordinates are required' });
    }
    
    const phone = phoneManager.getPhone(phoneId || 'phone-1');
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }
    
    await phone.sendTap(x, y);
    res.json({ success: true, message: 'Tap sent to Android phone' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send key event
app.post('/api/key', async (req, res) => {
  try {
    const { keycode, phoneId } = req.body;
    if (!keycode) {
      return res.status(400).json({ success: false, error: 'Keycode is required' });
    }
    
    const phone = phoneManager.getPhone(phoneId || 'phone-1');
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }
    
    await phone.sendKeyEvent(keycode);
    res.json({ success: true, message: 'Key event sent to Android phone' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get screenshot
app.get('/api/screenshot', async (req, res) => {
  try {
    const phoneId = req.query.phoneId || 'phone-1';
    const phone = phoneManager.getPhone(phoneId);
    
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }
    
    const filename = await phone.getScreenshot();
    res.sendFile(path.resolve(filename), (err) => {
      if (!err) {
        fs.remove(filename).catch(() => {});
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// VNC viewer endpoint
app.get('/vnc', (req, res) => {
  const phoneId = req.query.phone || 'phone-1';
  const phone = phoneManager.getPhone(phoneId);
  
  if (!phone) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Cloud Android Phone</title>
          <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              h1 { color: #333; }
              .status { color: #e74c3c; font-size: 18px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
              .button:hover { background: #2980b9; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>📱 Cloud Android Phone</h1>
              <div class="status">❌ Phone not found</div>
              <p>The requested phone does not exist.</p>
              <a href="/" class="button">Go to Main Interface</a>
          </div>
      </body>
      </html>
    `);
  }

  const status = phone.getStatus();
  
  if (!status.running) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Cloud Android Phone</title>
          <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              h1 { color: #333; }
              .status { color: #e74c3c; font-size: 18px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
              .button:hover { background: #2980b9; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>📱 Cloud Android Phone</h1>
              <div class="status">❌ Android phone is not running</div>
              <p>Please start the Android phone first using the main interface.</p>
              <a href="/" class="button">Go to Main Interface</a>
          </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cloud Android Phone - VNC Viewer</title>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 0; background: #000; overflow: hidden; font-family: Arial; }
            #screen { width: 100vw; height: 100vh; border: none; }
            .controls {
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                padding: 15px;
                border-radius: 8px;
                color: white;
                z-index: 1000;
                font-size: 14px;
            }
            .controls h3 { margin: 0 0 10px 0; color: #4CAF50; }
            .controls button {
                margin: 3px;
                padding: 8px 12px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            .controls button:hover { background: #45a049; }
            .specs { font-size: 11px; color: #ccc; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="controls">
            <h3>📱 ${phone.name}</h3>
            <div>Resolution: ${status.screenWidth}x${status.screenHeight}</div>
            <div>Status: <span style="color: #4CAF50;">🟢 Running</span></div>
            <div style="margin: 10px 0;">
                <button onclick="location.reload()">🔄 Reconnect</button>
                <button onclick="window.close()">❌ Close</button>
                <button onclick="window.open('/', '_blank')">🏠 Main</button>
            </div>
            <div class="specs">
                📊 ${status.specs.ram} RAM | ${status.specs.storage} Storage<br>
                🔧 ${status.specs.cpu} | ${status.specs.android}
            </div>
        </div>
        <iframe id="screen" src="http://localhost:${status.websockifyPort}/vnc.html?host=localhost&port=${status.websockifyPort}&autoconnect=true&resize=scale&quality=6"></iframe>
    </body>
    </html>
  `);
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const phoneId = req.body.phoneId || 'phone-1';
    const phone = phoneManager.getPhone(phoneId);
    
    if (!phone) {
      return res.status(404).json({ success: false, error: 'Phone not found' });
    }

    if (!phone.isRunning) {
      return res.status(400).json({ success: false, error: 'Cloud phone not running' });
    }

    // Copy file to Android device
    const androidPath = `/sdcard/Download/${req.file.originalname}`;
    
    exec(`${phone.androidSdkPath}/platform-tools/adb -s emulator-${phone.emulatorPort} push ${req.file.path} ${androidPath}`, (error) => {
      // Clean up uploaded file
      fs.remove(req.file.path);
      
      if (error) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        res.json({ success: true, message: 'File uploaded to Android phone', path: androidPath });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket for real-time communication
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });

  socket.on('get-status', (data) => {
    const phoneId = data?.phoneId || 'phone-1';
    const phone = phoneManager.getPhone(phoneId);
    if (phone) {
      socket.emit('status-update', phone.getStatus());
    }
  });

  socket.on('send-text', async (data) => {
    try {
      const phoneId = data.phoneId || 'phone-1';
      const phone = phoneManager.getPhone(phoneId);
      if (!phone) {
        socket.emit('text-sent', { success: false, error: 'Phone not found' });
        return;
      }
      await phone.sendText(data.text);
      socket.emit('text-sent', { success: true });
    } catch (error) {
      socket.emit('text-sent', { success: false, error: error.message });
    }
  });

  socket.on('send-tap', async (data) => {
    try {
      const phoneId = data.phoneId || 'phone-1';
      const phone = phoneManager.getPhone(phoneId);
      if (!phone) {
        socket.emit('tap-sent', { success: false, error: 'Phone not found' });
        return;
      }
      await phone.sendTap(data.x, data.y);
      socket.emit('tap-sent', { success: true });
    } catch (error) {
      socket.emit('tap-sent', { success: false, error: error.message });
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if React app not built yet
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Cloud Android Phone</title>
          <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
              .container { max-width: 800px; margin: 0 auto; }
              h1 { font-size: 3em; margin-bottom: 20px; }
              .subtitle { font-size: 1.2em; margin-bottom: 40px; opacity: 0.9; }
              .status { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
              .button { display: inline-block; padding: 15px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 8px; margin: 10px; font-size: 16px; }
              .button:hover { background: #45a049; }
              .api-info { text-align: left; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 10px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>📱 Cloud Android Phone</h1>
              <div class="subtitle">High-Performance Android in the Cloud</div>
              
              <div class="status">
                  <h3>🚀 Backend Server Running</h3>
                  <p>The Cloud Android Phone backend is ready!</p>
                  <a href="/api/status" class="button">📊 Check Status</a>
                  <a href="/vnc" class="button">📺 VNC Viewer</a>
              </div>

              <div class="api-info">
                  <h3>🔧 API Endpoints</h3>
                  <ul>
                      <li><strong>POST /api/start</strong> - Start the cloud Android phone</li>
                      <li><strong>POST /api/stop</strong> - Stop the cloud Android phone</li>
                      <li><strong>POST /api/send-text</strong> - Send text to Android</li>
                      <li><strong>POST /api/tap</strong> - Send tap coordinates</li>
                      <li><strong>POST /api/key</strong> - Send key events</li>
                      <li><strong>GET /api/screenshot</strong> - Get screenshot</li>
                      <li><strong>GET /api/status</strong> - Get system status</li>
                  </ul>
              </div>

              <div style="margin-top: 40px;">
                  <p>Build the React frontend to get the full web interface!</p>
                  <code>cd frontend && npm install && npm run build</code>
              </div>
          </div>
      </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 12000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Cloud Android Phone Server Running`);
  console.log(`📱 Web Interface: http://localhost:${PORT}`);
  console.log(`📺 VNC Viewer: http://localhost:${PORT}/vnc`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
  console.log(`\n🔧 Ready to start your cloud Android phone!`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  const phones = phoneManager.getAllPhones();
  for (const phone of phones) {
    if (phone.isRunning) {
      await phone.stopCloudPhone();
    }
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  const phones = phoneManager.getAllPhones();
  for (const phone of phones) {
    if (phone.isRunning) {
      await phone.stopCloudPhone();
    }
  }
  process.exit(0);
});