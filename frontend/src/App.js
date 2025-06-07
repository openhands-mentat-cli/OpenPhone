import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import io from 'socket.io-client';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const Subtitle = styled.p`
  margin: 10px 0 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
`;

const MainContent = styled.div`
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const PhoneGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const PhoneCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Button = styled.button`
  background: linear-gradient(145deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  margin: 5px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
  }
`;

const StopButton = styled(Button)`
  background: linear-gradient(145deg, #f44336, #d32f2f);
`;

const CreateButton = styled(Button)`
  background: linear-gradient(145deg, #2196F3, #1976D2);
`;

const TextInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px;
  border-radius: 8px;
  margin: 5px;
  width: 300px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const StatusIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.running ? '#4CAF50' : '#f44336'};
  display: inline-block;
  margin-right: 10px;
`;

const VNCFrame = styled.iframe`
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 10px;
  background: #000;
  margin-top: 10px;
`;

const LogArea = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
`;

function CloudAndroidPhone() {
  const [phones, setPhones] = useState([
    { 
      id: 'phone-1', 
      name: 'My Phone', 
      status: { 
        running: false, 
        vncUrl: 'http://localhost:6080/vnc.html',
        websockifyPort: 6080
      } 
    }
  ]);
  
  const [activePhoneId, setActivePhoneId] = useState('phone-1');
  const [textInput, setTextInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const activePhone = phones.find(phone => phone.id === activePhoneId) || phones[0];

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/status');
      setPhones(prev => prev.map(phone => 
        phone.id === activePhoneId ? { ...phone, status: response.data } : phone
      ));
    } catch (error) {
      addLog('Failed to fetch status: ' + error.message);
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), `[${timestamp}] ${message}`]);
  };

  const startPhone = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/start');
      addLog('✅ Phone starting...');
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      addLog('❌ Failed to start phone: ' + error.message);
    }
    setLoading(false);
  };

  const stopPhone = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/stop');
      addLog('🛑 Phone stopping...');
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      addLog('❌ Failed to stop phone: ' + error.message);
    }
    setLoading(false);
  };

  const sendText = async () => {
    if (!textInput.trim()) return;
    
    try {
      await axios.post('/api/send-text', { text: textInput });
      addLog(`📝 Sent: "${textInput}"`);
      setTextInput('');
    } catch (error) {
      addLog('❌ Failed to send text: ' + error.message);
    }
  };

  const createNewPhone = () => {
    const newPhone = {
      id: `phone-${Date.now()}`,
      name: `Phone ${phones.length + 1}`,
      status: { running: false, vncUrl: 'http://localhost:6080/vnc.html' }
    };
    setPhones(prev => [...prev, newPhone]);
    setActivePhoneId(newPhone.id);
    addLog(`📱 Created new phone: ${newPhone.name}`);
  };

  return (
    <AppContainer>
      <Header>
        <Title>📱 OpenPhone Cloud</Title>
        <Subtitle>Your Cloud Android Phone Management System</Subtitle>
      </Header>

      <MainContent>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          {phones.map(phone => (
            <Button
              key={phone.id}
              onClick={() => setActivePhoneId(phone.id)}
              style={{
                background: phone.id === activePhoneId 
                  ? 'linear-gradient(145deg, #4CAF50, #45a049)' 
                  : 'linear-gradient(145deg, #666, #555)'
              }}
            >
              <StatusIndicator running={phone.status.running} />
              {phone.name}
            </Button>
          ))}
          <CreateButton onClick={createNewPhone}>
            ➕ Add Phone
          </CreateButton>
        </div>

        <PhoneGrid>
          <PhoneCard>
            <h3>📱 {activePhone.name}</h3>
            <div style={{ marginBottom: '15px' }}>
              <StatusIndicator running={activePhone.status.running} />
              Status: {activePhone.status.running ? 'Running' : 'Stopped'}
            </div>
            
            {!activePhone.status.running ? (
              <Button onClick={startPhone} disabled={loading}>
                {loading ? '🔄 Starting...' : '🚀 Start Phone'}
              </Button>
            ) : (
              <StopButton onClick={stopPhone} disabled={loading}>
                {loading ? '🔄 Stopping...' : '🛑 Stop Phone'}
              </StopButton>
            )}

            <div style={{ marginTop: '15px' }}>
              <TextInput
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type text to send to Android..."
                onKeyPress={(e) => e.key === 'Enter' && sendText()}
              />
              <Button onClick={sendText} disabled={!activePhone.status.running}>
                📤 Send Text
              </Button>
            </div>

            {activePhone.status.running && (
              <VNCFrame 
                src={`http://localhost:${activePhone.status.websockifyPort || 6080}/vnc.html?host=localhost&port=${activePhone.status.websockifyPort || 6080}&autoconnect=true&resize=scale&quality=6`}
                title="Android Phone Screen"
              />
            )}
          </PhoneCard>

          <PhoneCard>
            <h3>📊 System Info</h3>
            <div>
              <strong>Resolution:</strong> {activePhone.status.screenWidth || 1080} x {activePhone.status.screenHeight || 1920}<br/>
              <strong>RAM:</strong> {activePhone.status.specs?.ram || '4GB'}<br/>
              <strong>Storage:</strong> {activePhone.status.specs?.storage || '8GB'}<br/>
              <strong>Android:</strong> {activePhone.status.specs?.android || 'Android 14'}
            </div>

            <LogArea>
              <strong>📋 Activity Log:</strong><br/>
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </LogArea>
          </PhoneCard>
        </PhoneGrid>
      </MainContent>
    </AppContainer>
  );
}

export default CloudAndroidPhone;
