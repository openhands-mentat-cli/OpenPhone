import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import io from 'socket.io-client';
import PhoneScreen from './components/PhoneScreen';
import ControlPanel from './components/ControlPanel';
import PhoneTemplates from './components/PhoneTemplates';
import ToastNotifications, { useToast } from './components/ToastNotifications';
import BatchOperations from './components/BatchOperations';
import SystemMonitor from './components/SystemMonitor';
import DeviceProfiles from './components/DeviceProfiles';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './components/KeyboardShortcuts';

// Performance-optimized styled components
const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  
  @media (max-width: 1200px) {
    flex-direction: column;
  }
  
  @media (max-width: 768px) {
    height: auto;
    min-height: 100vh;
  }
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(45, 45, 45, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
  
  @media (max-width: 768px) {
    position: relative;
    height: 50px;
    padding: 0 15px;
  }
`;

const Logo = styled.h1`
  margin: 0;
  color: #4CAF50;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const PhoneManagerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const PhoneTab = styled.button`
  background: ${props => props.active ? 
    'linear-gradient(145deg, #4CAF50, #45a049)' : 
    'linear-gradient(145deg, #555, #444)'
  };
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 11px;
  }
`;

const AddPhoneButton = styled.button`
  background: linear-gradient(145deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  margin-top: 60px;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    margin-top: 0;
  }
  
  @media (max-width: 768px) {
    margin-top: 0;
  }
`;

const PhoneScreenContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  
  @media (max-width: 1200px) {
    padding: 15px;
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    min-height: 400px;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${props => props.running ? 
    'rgba(76, 175, 80, 0.2)' : 
    'rgba(244, 67, 54, 0.2)'
  };
  border-radius: 15px;
  border: 1px solid ${props => props.running ? '#4CAF50' : '#f44336'};
  font-size: 12px;
  
  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 11px;
  }
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.running ? '#4CAF50' : '#f44336'};
  animation: ${props => props.running ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #333;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Phone Creation Modal Styles
const CreatePhoneModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border-radius: 15px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  border: 1px solid #444;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #4CAF50;
  font-size: 20px;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 14px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  background: linear-gradient(145deg, #1a1a1a, #222);
  border: 2px solid #444;
  border-radius: 8px;
  color: white;
  padding: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }
  
  &::placeholder {
    color: #888;
  }
`;

const Select = styled.select`
  width: 100%;
  background: linear-gradient(145deg, #1a1a1a, #222);
  border: 2px solid #444;
  border-radius: 8px;
  color: white;
  padding: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }
  
  option {
    background: #2d2d2d;
    color: white;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
`;

const ModalButton = styled.button`
  flex: 1;
  background: ${props => props.primary ? 
    'linear-gradient(145deg, #4CAF50, #45a049)' : 
    'linear-gradient(145deg, #666, #555)'
  };
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CloudAndroidPhone = () => {
  // State management with performance optimization
  const [phones, setPhones] = useState([]);
  const [activePhoneId, setActivePhoneId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [logs, setLogs] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [showSystemMonitor, setShowSystemMonitor] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [newPhoneConfig, setNewPhoneConfig] = useState({
    name: '',
    androidVersion: 'android-34',
    ram: '4096',
    storage: '8192',
    resolution: '1080x1920',
    density: '420'
  });
  
  // Toast notifications
  const toast = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreatePhone: addNewPhone,
    onStartPhone: () => startCloudPhone(activePhoneId),
    onStopPhone: () => stopCloudPhone(activePhoneId),
    onToggleMonitor: () => setShowSystemMonitor(!showSystemMonitor),
    activePhoneId,
    phones
  });

  // Memoized active phone
  const activePhone = useMemo(() => 
    phones.find(phone => phone.id === activePhoneId) || phones[0] || { id: null, name: 'No Phone', status: { running: false } },
    [phones, activePhoneId]
  );

  // Optimized log management
  const addLog = useCallback((message, phoneId = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${phoneId ? `[${phoneId}] ` : ''}${message}`;
    
    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      return newLogs.slice(-100); // Keep only last 100 logs for performance
    });
  }, []);

  // Socket connection with cleanup
  useEffect(() => {
    const newSocket = io({
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false
    });
    
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('status-update', (data) => {
      setPhones(prev => prev.map(phone => 
        phone.id === activePhoneId ? { ...phone, status: data } : phone
      ));
    });

    newSocket.on('text-sent', (data) => {
      if (data.success) {
        addLog('✅ Text sent successfully', activePhoneId);
      } else {
        addLog('❌ Failed to send text: ' + data.error, activePhoneId);
      }
    });

    newSocket.on('tap-sent', (data) => {
      if (data.success) {
        addLog('✅ Tap sent successfully', activePhoneId);
      } else {
        addLog('❌ Failed to send tap: ' + data.error, activePhoneId);
      }
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [activePhoneId, addLog]);

  // Fetch all phones from API
  const fetchPhones = useCallback(async () => {
    try {
      const response = await axios.get('/api/phones');
      setPhones(response.data);
      
      // Set active phone to first phone if none selected
      if (!activePhoneId && response.data.length > 0) {
        setActivePhoneId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch phones:', error);
      addLog('❌ Failed to fetch phones');
    }
  }, [activePhoneId, addLog]);

  // Fetch status with error handling
  const fetchStatus = useCallback(async (phoneId = activePhoneId) => {
    try {
      if (!phoneId) return;

      const response = await axios.get(`/api/status?phoneId=${phoneId}`);
      setPhones(prev => prev.map(p => 
        p.id === phoneId ? { ...p, status: response.data } : p
      ));
    } catch (error) {
      console.error('Failed to fetch status:', error);
      addLog('❌ Failed to fetch status', phoneId);
    }
  }, [activePhoneId, addLog]);

  // Phone management functions
  const startCloudPhone = useCallback(async (phoneId = activePhoneId) => {
    setGlobalLoading(true);
    addLog('🚀 Starting Cloud Android Phone...', phoneId);
    toast.info('Starting Phone', 'Initializing Android emulator...');
    
    try {
      const response = await axios.post('/api/start', { phoneId });
      
      if (response.data.success) {
        addLog('✅ Cloud Android Phone started successfully', phoneId);
        toast.success('Phone Started', 'Android emulator is now running!');
        await fetchStatus(phoneId);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      addLog('❌ Failed to start: ' + errorMsg, phoneId);
      toast.error('Start Failed', `Could not start phone: ${errorMsg}`);
    } finally {
      setGlobalLoading(false);
    }
  }, [activePhoneId, addLog, fetchStatus, toast]);

  const stopCloudPhone = useCallback(async (phoneId = activePhoneId) => {
    setGlobalLoading(true);
    addLog('🛑 Stopping Cloud Android Phone...', phoneId);
    toast.info('Stopping Phone', 'Shutting down Android emulator...');
    
    try {
      const response = await axios.post('/api/stop', { phoneId });
      if (response.data.success) {
        addLog('✅ Cloud Android Phone stopped', phoneId);
        toast.success('Phone Stopped', 'Android emulator has been stopped');
        await fetchStatus(phoneId);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      addLog('❌ Failed to stop: ' + errorMsg, phoneId);
      toast.error('Stop Failed', `Could not stop phone: ${errorMsg}`);
    } finally {
      setGlobalLoading(false);
    }
  }, [activePhoneId, addLog, fetchStatus, toast]);

  // Create new phone
  const createPhone = useCallback(async (config) => {
    setGlobalLoading(true);
    addLog('📱 Creating new phone...', config.name);
    toast.info('Creating Phone', `Setting up ${config.name}...`);
    
    try {
      const response = await axios.post('/api/phones', config);
      if (response.data.success) {
        addLog('✅ Phone created successfully', response.data.phone.id);
        toast.success('Phone Created', `${config.name} is ready to use!`);
        await fetchPhones();
        setActivePhoneId(response.data.phone.id);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      addLog('❌ Failed to create phone: ' + errorMsg);
      toast.error('Creation Failed', `Could not create phone: ${errorMsg}`);
    } finally {
      setGlobalLoading(false);
    }
  }, [addLog, fetchPhones, toast]);

  // Delete phone
  const deletePhone = useCallback(async (phoneId) => {
    setGlobalLoading(true);
    addLog('🗑️ Deleting phone...', phoneId);
    
    try {
      const response = await axios.delete(`/api/phones/${phoneId}`);
      if (response.data.success) {
        addLog('✅ Phone deleted successfully', phoneId);
        await fetchPhones();
        
        // Switch to another phone if current active phone was deleted
        if (activePhoneId === phoneId) {
          const remainingPhones = phones.filter(p => p.id !== phoneId);
          setActivePhoneId(remainingPhones.length > 0 ? remainingPhones[0].id : null);
        }
      }
    } catch (error) {
      addLog('❌ Failed to delete phone: ' + (error.response?.data?.error || error.message), phoneId);
    } finally {
      setGlobalLoading(false);
    }
  }, [activePhoneId, phones, addLog, fetchPhones]);

  // Optimized text sending
  const sendText = useCallback(async (text) => {
    if (!text.trim()) {
      addLog('❌ Please enter some text', activePhoneId);
      return;
    }

    addLog(`📝 Sending text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`, activePhoneId);
    
    try {
      const response = await axios.post('/api/send-text', { 
        text,
        phoneId: activePhoneId 
      });
      
      if (response.data.success) {
        addLog('✅ Text sent to Android phone', activePhoneId);
      }
    } catch (error) {
      addLog('❌ Failed to send text: ' + (error.response?.data?.error || error.message), activePhoneId);
    }
  }, [activePhoneId, addLog]);

  // Optimized tap handling
  const sendTap = useCallback(async (x, y) => {
    addLog(`👆 Sending tap: ${x}, ${y}`, activePhoneId);
    
    try {
      const response = await axios.post('/api/tap', { 
        x, 
        y, 
        phoneId: activePhoneId 
      });
      
      if (response.data.success) {
        addLog('✅ Tap sent to Android phone', activePhoneId);
      }
    } catch (error) {
      addLog('❌ Failed to send tap: ' + (error.response?.data?.error || error.message), activePhoneId);
    }
  }, [activePhoneId, addLog]);

  // Hardware key events
  const sendKeyEvent = useCallback(async (keycode) => {
    addLog(`⌨️ Sending key: ${keycode}`, activePhoneId);
    
    try {
      const response = await axios.post('/api/key', { 
        keycode, 
        phoneId: activePhoneId 
      });
      
      if (response.data.success) {
        addLog('✅ Key event sent', activePhoneId);
      }
    } catch (error) {
      addLog('❌ Failed to send key: ' + (error.response?.data?.error || error.message), activePhoneId);
    }
  }, [activePhoneId, addLog]);

  // File upload with progress
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('phoneId', activePhoneId);

    addLog(`📁 Uploading file: ${file.name}`, activePhoneId);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (percentCompleted % 25 === 0) { // Log every 25%
            addLog(`📁 Upload progress: ${percentCompleted}%`, activePhoneId);
          }
        }
      });
      
      if (response.data.success) {
        addLog(`✅ File uploaded: ${response.data.path}`, activePhoneId);
      }
    } catch (error) {
      addLog('❌ Failed to upload file: ' + (error.response?.data?.error || error.message), activePhoneId);
    }
  }, [activePhoneId, addLog]);

  // Handle template selection
  const handleTemplateSelect = useCallback((templateConfig) => {
    setNewPhoneConfig(prev => ({
      ...prev,
      ...templateConfig
    }));
    addLog(`📱 Applied template configuration`);
  }, [addLog]);

  // Handle device profile selection
  const handleProfileSelect = useCallback((profileConfig) => {
    setNewPhoneConfig(prev => ({
      ...prev,
      ...profileConfig
    }));
    addLog(`📱 Applied device profile: ${profileConfig.name}`);
  }, [addLog]);

  // Handle create phone form submission
  const handleCreatePhone = useCallback(() => {
    if (!newPhoneConfig.name.trim()) {
      addLog('❌ Please enter a phone name');
      return;
    }
    
    createPhone(newPhoneConfig);
    setShowCreateModal(false);
    setNewPhoneConfig({
      name: '',
      androidVersion: 'android-34',
      ram: '4096',
      storage: '8192',
      resolution: '1080x1920',
      density: '420'
    });
  }, [newPhoneConfig, createPhone, addLog]);

  // Add new phone - opens creation modal
  const addNewPhone = useCallback(() => {
    setShowCreateModal(true);
    addLog('📱 Opening phone creation dialog...');
  }, [addLog]);

  // Batch operations
  const handleBatchStart = useCallback(async (phoneIds) => {
    toast.info('Batch Start', `Starting ${phoneIds.length} phones...`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const phoneId of phoneIds) {
      try {
        await startCloudPhone(phoneId);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      toast.success('Batch Complete', `Successfully started ${successCount} phones`);
    } else {
      toast.warning('Batch Partial', `Started ${successCount}, failed ${errorCount}`);
    }
  }, [startCloudPhone, toast]);

  const handleBatchStop = useCallback(async (phoneIds) => {
    toast.info('Batch Stop', `Stopping ${phoneIds.length} phones...`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const phoneId of phoneIds) {
      try {
        await stopCloudPhone(phoneId);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      toast.success('Batch Complete', `Successfully stopped ${successCount} phones`);
    } else {
      toast.warning('Batch Partial', `Stopped ${successCount}, failed ${errorCount}`);
    }
  }, [stopCloudPhone, toast]);

  const handleBatchDelete = useCallback(async (phoneIds) => {
    toast.info('Batch Delete', `Deleting ${phoneIds.length} phones...`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const phoneId of phoneIds) {
      try {
        await deletePhone(phoneId);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    setSelectedPhones([]); // Clear selection after batch delete
    
    if (errorCount === 0) {
      toast.success('Batch Complete', `Successfully deleted ${successCount} phones`);
    } else {
      toast.warning('Batch Partial', `Deleted ${successCount}, failed ${errorCount}`);
    }
  }, [deletePhone, toast]);

  const handleBatchClone = useCallback(async (phoneIds) => {
    toast.info('Batch Clone', `Cloning ${phoneIds.length} phones...`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const phoneId of phoneIds) {
      try {
        const originalPhone = phones.find(p => p.id === phoneId);
        if (originalPhone) {
          const cloneConfig = {
            name: `${originalPhone.name} (Clone)`,
            androidVersion: originalPhone.status?.androidVersion || 'android-34',
            ram: originalPhone.status?.ramSize || '4096',
            storage: originalPhone.status?.storageSize || '8192',
            resolution: `${originalPhone.status?.screenWidth}x${originalPhone.status?.screenHeight}` || '1080x1920',
            density: originalPhone.status?.density?.toString() || '420'
          };
          await createPhone(cloneConfig);
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }
    
    if (errorCount === 0) {
      toast.success('Batch Complete', `Successfully cloned ${successCount} phones`);
    } else {
      toast.warning('Batch Partial', `Cloned ${successCount}, failed ${errorCount}`);
    }
  }, [phones, createPhone, toast]);

  // Remove phone
  const removePhone = useCallback((phoneId) => {
    deletePhone(phoneId);
  }, [deletePhone]);

  // Initial phones fetch
  useEffect(() => {
    fetchPhones();
  }, []);

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      phones.forEach(phone => {
        if (phone.status?.running) {
          fetchStatus(phone.id);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [phones, fetchStatus]);

  return (
    <AppContainer>
      {globalLoading && (
        <LoadingOverlay>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <LoadingSpinner />
            <div style={{ marginTop: '20px', fontSize: '18px' }}>
              Processing...
            </div>
          </div>
        </LoadingOverlay>
      )}

      <Header>
        <Logo>
          📱 Cloud Android Phone
        </Logo>
        
        <PhoneManagerContainer>
          {phones.map(phone => (
            <PhoneTab
              key={phone.id}
              active={phone.id === activePhoneId}
              onClick={() => setActivePhoneId(phone.id)}
            >
              <input
                type="checkbox"
                checked={selectedPhones.includes(phone.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  if (e.target.checked) {
                    setSelectedPhones(prev => [...prev, phone.id]);
                  } else {
                    setSelectedPhones(prev => prev.filter(id => id !== phone.id));
                  }
                }}
                style={{ 
                  marginRight: '8px', 
                  accentColor: '#4CAF50',
                  cursor: 'pointer'
                }}
              />
              <StatusDot running={phone.status?.running} />
              {phone.name}
              {phones.length > 1 && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhone(phone.id);
                  }}
                  style={{ marginLeft: '5px', cursor: 'pointer' }}
                >
                  ×
                </span>
              )}
            </PhoneTab>
          ))}
          
          <AddPhoneButton onClick={addNewPhone}>
            ➕ Add Phone
          </AddPhoneButton>
          
          <AddPhoneButton onClick={() => setShowSystemMonitor(!showSystemMonitor)}>
            📊 Monitor
          </AddPhoneButton>
          
          <AddPhoneButton onClick={() => setShowKeyboardHelp(true)}>
            ⌨️ Help
          </AddPhoneButton>
          
          <StatusIndicator running={activePhone.status?.running}>
            <StatusDot running={activePhone.status?.running} />
            {activePhone.status?.running ? 'Online' : 'Offline'}
          </StatusIndicator>
        </PhoneManagerContainer>
        
        {phones.length > 0 && (
          <BatchOperations
            phones={phones}
            selectedPhones={selectedPhones}
            setSelectedPhones={setSelectedPhones}
            onBatchStart={handleBatchStart}
            onBatchStop={handleBatchStop}
            onBatchDelete={handleBatchDelete}
            onBatchClone={handleBatchClone}
          />
        )}
      </Header>

      <MainContent>
        <ControlPanel
          status={activePhone.status}
          onSendText={sendText}
          onTap={sendTap}
          onKeyEvent={sendKeyEvent}
          onFileUpload={handleFileUpload}
          onStartPhone={() => startCloudPhone(activePhoneId)}
          onStopPhone={() => stopCloudPhone(activePhoneId)}
          logs={logs}
        />

        <PhoneScreenContainer>
          {showSystemMonitor ? (
            <SystemMonitor phones={phones} />
          ) : (
            <PhoneScreen
              status={activePhone.status}
              onTap={sendTap}
              onHomePress={() => sendKeyEvent(3)}
            />
          )}
        </PhoneScreenContainer>
      </MainContent>

      {/* Toast Notifications */}
      <ToastNotifications toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Create Phone Modal */}
      {showCreateModal && (
        <CreatePhoneModal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>📱 Create New Android Phone</ModalTitle>
            
            <DeviceProfiles onSelectProfile={handleProfileSelect} />
            
            <PhoneTemplates onSelectTemplate={handleTemplateSelect} />
            
            <FormGroup>
              <Label>Phone Name</Label>
              <Input
                type="text"
                placeholder="Enter phone name (e.g., My Phone 2)"
                value={newPhoneConfig.name}
                onChange={(e) => setNewPhoneConfig(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Android Version</Label>
              <Select
                value={newPhoneConfig.androidVersion}
                onChange={(e) => setNewPhoneConfig(prev => ({ ...prev, androidVersion: e.target.value }))}
              >
                <option value="android-34">Android 14 (Latest)</option>
                <option value="android-33">Android 13</option>
                <option value="android-32">Android 12</option>
                <option value="android-31">Android 11</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>RAM (MB)</Label>
              <Select
                value={newPhoneConfig.ram}
                onChange={(e) => setNewPhoneConfig(prev => ({ ...prev, ram: e.target.value }))}
              >
                <option value="2048">2GB RAM</option>
                <option value="4096">4GB RAM (Recommended)</option>
                <option value="6144">6GB RAM</option>
                <option value="8192">8GB RAM (High Performance)</option>
                <option value="16384">16GB RAM (Ultra Performance)</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Storage (MB)</Label>
              <Select
                value={newPhoneConfig.storage}
                onChange={(e) => setNewPhoneConfig(prev => ({ ...prev, storage: e.target.value }))}
              >
                <option value="4096">4GB Storage</option>
                <option value="8192">8GB Storage (Recommended)</option>
                <option value="16384">16GB Storage</option>
                <option value="32768">32GB Storage</option>
                <option value="65536">64GB Storage</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Screen Resolution</Label>
              <Select
                value={newPhoneConfig.resolution}
                onChange={(e) => setNewPhoneConfig(prev => ({ ...prev, resolution: e.target.value }))}
              >
                <option value="720x1280">720x1280 (HD)</option>
                <option value="1080x1920">1080x1920 (Full HD)</option>
                <option value="1440x2560">1440x2560 (2K)</option>
                <option value="1440x3120">1440x3120 (2K+)</option>
              </Select>
            </FormGroup>
            
            <ModalButtons>
              <ModalButton onClick={() => setShowCreateModal(false)}>
                Cancel
              </ModalButton>
              <ModalButton primary onClick={handleCreatePhone}>
                Create Phone
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </CreatePhoneModal>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isVisible={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </AppContainer>
  );
};

export default CloudAndroidPhone;