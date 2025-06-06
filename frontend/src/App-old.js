import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import io from 'socket.io-client';
import PhoneScreen from './components/PhoneScreen';
import ControlPanel from './components/ControlPanel';

// Styled Components - UGPhone/Redfinger Style
const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Sidebar = styled.div`
  width: 300px;
  background: #2d2d2d;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
`;

const Header = styled.div`
  background: #333;
  padding: 15px 20px;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.h1`
  margin: 0;
  color: #4CAF50;
  font-size: 24px;
  font-weight: bold;
`;

const StatusBadge = styled.div`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  background: ${props => props.running ? '#4CAF50' : '#f44336'};
  color: white;
`;

const PhoneContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #1a1a1a;
`;

const PhoneFrame = styled.div`
  width: 360px;
  height: 640px;
  background: #000;
  border-radius: 25px;
  padding: 20px;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  border: 3px solid #333;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const PhoneScreen = styled.div`
  flex: 1;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
`;

const VNCViewer = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 15px;
`;

const PlaceholderScreen = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #333, #555);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  text-align: center;
`;

const ControlPanel = styled.div`
  padding: 20px;
  background: #2d2d2d;
  border-radius: 10px;
  margin: 10px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #4CAF50;
  font-size: 16px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
`;

const TextInputSection = styled.div`
  margin-bottom: 20px;
`;

const TextInput = styled.textarea`
  width: 100%;
  height: 80px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  color: white;
  padding: 10px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
  
  &::placeholder {
    color: #888;
  }
`;

const Button = styled.button`
  background: ${props => props.primary ? '#4CAF50' : props.danger ? '#f44336' : '#555'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  margin: 5px;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.primary ? '#45a049' : props.danger ? '#da190b' : '#666'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #333;
    cursor: not-allowed;
    transform: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`;

const HardwareKeys = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 15px;
`;

const KeyButton = styled(Button)`
  padding: 12px 8px;
  font-size: 12px;
`;

const StatusInfo = styled.div`
  background: #1a1a1a;
  padding: 15px;
  border-radius: 8px;
  margin: 10px;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 14px;
`;

const FileUpload = styled.div`
  margin-top: 20px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  display: inline-block;
  background: #555;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
  
  &:hover {
    background: #666;
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid #333;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CloudAndroidPhone = () => {
  const [status, setStatus] = useState({ running: false });
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [logs, setLogs] = useState([]);
  const phoneScreenRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    // Get initial status
    fetchStatus();

    // Socket event listeners
    newSocket.on('status-update', (data) => {
      setStatus(data);
    });

    newSocket.on('text-sent', (data) => {
      if (data.success) {
        addLog('✅ Text sent successfully');
      } else {
        addLog('❌ Failed to send text: ' + data.error);
      }
    });

    return () => newSocket.close();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const startCloudPhone = async () => {
    setLoading(true);
    addLog('🚀 Starting Cloud Android Phone...');
    
    try {
      const response = await axios.post('/api/start');
      if (response.data.success) {
        addLog('✅ Cloud Android Phone started successfully');
        fetchStatus();
      }
    } catch (error) {
      addLog('❌ Failed to start: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const stopCloudPhone = async () => {
    setLoading(true);
    addLog('🛑 Stopping Cloud Android Phone...');
    
    try {
      const response = await axios.post('/api/stop');
      if (response.data.success) {
        addLog('✅ Cloud Android Phone stopped');
        fetchStatus();
      }
    } catch (error) {
      addLog('❌ Failed to stop: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendText = async () => {
    if (!textInput.trim()) {
      addLog('❌ Please enter some text');
      return;
    }

    addLog(`📝 Sending text: "${textInput}"`);
    
    try {
      const response = await axios.post('/api/send-text', { text: textInput });
      if (response.data.success) {
        addLog('✅ Text sent to Android phone');
        setTextInput('');
      }
    } catch (error) {
      addLog('❌ Failed to send text: ' + error.response?.data?.error || error.message);
    }
  };

  const sendTap = async (x, y) => {
    addLog(`👆 Sending tap: ${x}, ${y}`);
    
    try {
      const response = await axios.post('/api/tap', { x, y });
      if (response.data.success) {
        addLog('✅ Tap sent to Android phone');
      }
    } catch (error) {
      addLog('❌ Failed to send tap: ' + error.response?.data?.error || error.message);
    }
  };

  const sendKeyEvent = async (keycode) => {
    addLog(`⌨️ Sending key: ${keycode}`);
    
    try {
      const response = await axios.post('/api/key', { keycode });
      if (response.data.success) {
        addLog('✅ Key event sent');
      }
    } catch (error) {
      addLog('❌ Failed to send key: ' + error.response?.data?.error || error.message);
    }
  };

  const handlePhoneClick = (event) => {
    if (!status.running) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) * (status.screenWidth / rect.width));
    const y = Math.round((event.clientY - rect.top) * (status.screenHeight / rect.height));
    
    sendTap(x, y);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    addLog(`📁 Uploading file: ${file.name}`);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        addLog(`✅ File uploaded: ${response.data.path}`);
      }
    } catch (error) {
      addLog('❌ Failed to upload file: ' + error.response?.data?.error || error.message);
    }
  };

  const openVNCViewer = () => {
    window.open('/vnc', '_blank', 'width=1200,height=800');
  };

  return (
    <AppContainer>
      <Sidebar>
        <ControlPanel>
          <SectionTitle>📱 Cloud Android Phone</SectionTitle>
          
          <StatusInfo>
            <StatusRow>
              <span>Status:</span>
              <StatusBadge running={status.running}>
                {status.running ? '🟢 Running' : '🔴 Stopped'}
              </StatusBadge>
            </StatusRow>
            {status.specs && (
              <>
                <StatusRow>
                  <span>RAM:</span>
                  <span>{status.specs.ram}</span>
                </StatusRow>
                <StatusRow>
                  <span>Storage:</span>
                  <span>{status.specs.storage}</span>
                </StatusRow>
                <StatusRow>
                  <span>CPU:</span>
                  <span>{status.specs.cpu}</span>
                </StatusRow>
                <StatusRow>
                  <span>Android:</span>
                  <span>{status.specs.android}</span>
                </StatusRow>
                {status.specs.resolution && (
                  <StatusRow>
                    <span>Resolution:</span>
                    <span>{status.specs.resolution}</span>
                  </StatusRow>
                )}
              </>
            )}
          </StatusInfo>

          <ButtonRow>
            <Button 
              primary 
              onClick={startCloudPhone} 
              disabled={loading || status.running}
            >
              {loading ? 'Starting...' : '🚀 Start Phone'}
            </Button>
            <Button 
              danger 
              onClick={stopCloudPhone} 
              disabled={loading || !status.running}
            >
              🛑 Stop Phone
            </Button>
          </ButtonRow>

          {status.running && (
            <ButtonRow>
              <Button onClick={openVNCViewer}>
                📺 Open VNC Viewer
              </Button>
              <Button onClick={fetchStatus}>
                🔄 Refresh Status
              </Button>
            </ButtonRow>
          )}
        </ControlPanel>

        <ControlPanel>
          <SectionTitle>📝 Text Input</SectionTitle>
          <TextInputSection>
            <TextInput
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type text to send to Android phone..."
              disabled={!status.running}
            />
            <ButtonRow>
              <Button 
                primary 
                onClick={sendText} 
                disabled={!status.running || !textInput.trim()}
              >
                📤 Send to Phone
              </Button>
              <Button onClick={() => setTextInput('')}>
                🗑️ Clear
              </Button>
            </ButtonRow>
          </TextInputSection>

          <SectionTitle>⌨️ Hardware Keys</SectionTitle>
          <HardwareKeys>
            <KeyButton onClick={() => sendKeyEvent(4)} disabled={!status.running}>
              ⬅️ Back
            </KeyButton>
            <KeyButton onClick={() => sendKeyEvent(3)} disabled={!status.running}>
              🏠 Home
            </KeyButton>
            <KeyButton onClick={() => sendKeyEvent(187)} disabled={!status.running}>
              📱 Recent
            </KeyButton>
            <KeyButton onClick={() => sendKeyEvent(24)} disabled={!status.running}>
              🔊 Vol+
            </KeyButton>
            <KeyButton onClick={() => sendKeyEvent(25)} disabled={!status.running}>
              🔉 Vol-
            </KeyButton>
            <KeyButton onClick={() => sendKeyEvent(26)} disabled={!status.running}>
              🔋 Power
            </KeyButton>
          </HardwareKeys>
        </ControlPanel>

        <ControlPanel>
          <SectionTitle>📁 File Upload</SectionTitle>
          <FileUpload>
            <FileLabel htmlFor="file-upload">
              📎 Choose File
            </FileLabel>
            <FileInput
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={!status.running}
            />
          </FileUpload>
        </ControlPanel>

        <ControlPanel>
          <SectionTitle>📋 Activity Log</SectionTitle>
          <div style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {logs.map((log, index) => (
              <div key={index} style={{ margin: '4px 0', color: '#ccc' }}>
                {log}
              </div>
            ))}
          </div>
        </ControlPanel>
      </Sidebar>

      <MainContent>
        <Header>
          <Logo>📱 Cloud Android Phone</Logo>
          <StatusBadge running={status.running}>
            {status.running ? 'ONLINE' : 'OFFLINE'}
          </StatusBadge>
        </Header>

        <PhoneContainer>
          <PhoneFrame>
            <PhoneScreen ref={phoneScreenRef} onClick={handlePhoneClick}>
              {status.running ? (
                status.vncUrl ? (
                  <VNCViewer 
                    src={`http://localhost:${status.websockifyPort}/vnc.html?host=localhost&port=${status.websockifyPort}&autoconnect=true&resize=scale&quality=6`}
                    title="Android Phone Screen"
                  />
                ) : (
                  <PlaceholderScreen>
                    <LoadingSpinner />
                    <h3>🔄 Connecting to Android...</h3>
                    <p>Setting up VNC connection...</p>
                  </PlaceholderScreen>
                )
              ) : (
                <PlaceholderScreen>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
                  <h3>Cloud Android Phone</h3>
                  <p>Click "Start Phone" to begin</p>
                  {loading && <LoadingSpinner />}
                </PlaceholderScreen>
              )}
            </PhoneScreen>
          </PhoneFrame>
        </PhoneContainer>
      </MainContent>
    </AppContainer>
  );
};

export default CloudAndroidPhone;