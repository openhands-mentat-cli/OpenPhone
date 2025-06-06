import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const ControlContainer = styled.div`
  width: 350px;
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0,0,0,0.3);
`;

const ControlSection = styled.div`
  padding: 20px;
  border-bottom: 1px solid #333;
  background: ${props => props.highlight ? 'linear-gradient(145deg, #333, #2a2a2a)' : 'transparent'};
`;

const SectionTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #4CAF50;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
`;

const TextInputArea = styled.div`
  margin-bottom: 15px;
`;

const TextInput = styled.textarea`
  width: 100%;
  height: 100px;
  background: linear-gradient(145deg, #1a1a1a, #222);
  border: 2px solid #444;
  border-radius: 10px;
  color: white;
  padding: 15px;
  font-size: 14px;
  font-family: 'Segoe UI', sans-serif;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }
  
  &::placeholder {
    color: #888;
    font-style: italic;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickTextButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 10px 0;
`;

const QuickTextButton = styled.button`
  background: linear-gradient(145deg, #555, #444);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(145deg, #666, #555);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Button = styled.button`
  background: ${props => 
    props.primary ? 'linear-gradient(145deg, #4CAF50, #45a049)' :
    props.danger ? 'linear-gradient(145deg, #f44336, #da190b)' :
    props.secondary ? 'linear-gradient(145deg, #2196F3, #1976D2)' :
    'linear-gradient(145deg, #666, #555)'
  };
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  margin: 5px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`;

const HardwareKeysGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 15px;
`;

const HardwareKey = styled.button`
  background: linear-gradient(145deg, #444, #333);
  color: white;
  border: 2px solid #555;
  padding: 15px 8px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background: linear-gradient(145deg, #555, #444);
    border-color: #4CAF50;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    background: linear-gradient(145deg, #333, #222);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const KeyIcon = styled.div`
  font-size: 18px;
`;

const KeyLabel = styled.div`
  font-size: 10px;
  color: #ccc;
`;

const StatusInfo = styled.div`
  background: linear-gradient(145deg, #1a1a1a, #222);
  padding: 15px;
  border-radius: 10px;
  margin: 10px 0;
  border: 1px solid #333;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
  font-size: 14px;
`;

const StatusBadge = styled.div`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  background: ${props => props.running ? '#4CAF50' : '#f44336'};
  color: white;
`;

const FileUploadArea = styled.div`
  border: 2px dashed #444;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  margin: 15px 0;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.1);
  }
  
  &.dragover {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ActivityLog = styled.div`
  background: #1a1a1a;
  border-radius: 8px;
  padding: 15px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #333;
`;

const LogEntry = styled.div`
  margin: 4px 0;
  color: ${props => 
    props.type === 'success' ? '#4CAF50' :
    props.type === 'error' ? '#f44336' :
    props.type === 'warning' ? '#FF9800' :
    '#ccc'
  };
  padding: 2px 0;
  border-bottom: 1px solid #222;
  
  &:last-child {
    border-bottom: none;
  }
`;

const CharacterCount = styled.div`
  font-size: 11px;
  color: #888;
  text-align: right;
  margin-top: 5px;
`;

const ControlPanel = ({ 
  status, 
  onSendText, 
  onTap, 
  onKeyEvent, 
  onFileUpload,
  onStartPhone,
  onStopPhone,
  logs = []
}) => {
  const [textInput, setTextInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const quickTexts = [
    { label: 'Email', text: 'user@example.com' },
    { label: 'Phone', text: '+1234567890' },
    { label: 'Password', text: 'MyPassword123!' },
    { label: 'Address', text: '123 Main St, City, State' },
    { label: 'Hello', text: 'Hello, how are you?' },
    { label: 'Thank you', text: 'Thank you very much!' }
  ];

  const hardwareKeys = [
    { icon: '⬅️', label: 'Back', keycode: 4 },
    { icon: '🏠', label: 'Home', keycode: 3 },
    { icon: '📱', label: 'Recent', keycode: 187 },
    { icon: '🔊', label: 'Vol+', keycode: 24 },
    { icon: '🔉', label: 'Vol-', keycode: 25 },
    { icon: '🔋', label: 'Power', keycode: 26 },
    { icon: '📋', label: 'Menu', keycode: 82 },
    { icon: '🔍', label: 'Search', keycode: 84 },
    { icon: '📷', label: 'Camera', keycode: 27 }
  ];

  const handleSendText = () => {
    if (!textInput.trim()) return;
    onSendText(textInput);
    setTextInput('');
  };

  const handleQuickText = (text) => {
    setTextInput(text);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      handleSendText();
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <ControlContainer>
      {/* Phone Status */}
      <ControlSection highlight>
        <SectionTitle>
          📱 Phone Status
        </SectionTitle>
        <StatusInfo>
          <StatusRow>
            <span>Status:</span>
            <StatusBadge running={status.running}>
              {status.running ? '🟢 Online' : '🔴 Offline'}
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
            onClick={onStartPhone} 
            disabled={status.running}
          >
            🚀 Start Phone
          </Button>
          <Button 
            danger 
            onClick={onStopPhone} 
            disabled={!status.running}
          >
            🛑 Stop Phone
          </Button>
        </ButtonRow>
      </ControlSection>

      {/* Text Input */}
      <ControlSection>
        <SectionTitle>
          📝 Text Input
        </SectionTitle>
        
        <TextInputArea>
          <TextInput
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type text to send to Android phone...
• Use Ctrl+Enter to send quickly
• Supports emojis and special characters
• Multi-line text supported"
            disabled={!status.running}
            maxLength={1000}
          />
          <CharacterCount>
            {textInput.length}/1000 characters
          </CharacterCount>
        </TextInputArea>

        <ButtonRow>
          <Button 
            primary 
            onClick={handleSendText} 
            disabled={!status.running || !textInput.trim()}
          >
            📤 Send to Phone
          </Button>
          <Button 
            onClick={() => setTextInput('')}
            disabled={!textInput}
          >
            🗑️ Clear
          </Button>
        </ButtonRow>

        <div style={{ marginTop: '15px' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
            Quick Text Templates:
          </div>
          <QuickTextButtons>
            {quickTexts.map((item, index) => (
              <QuickTextButton
                key={index}
                onClick={() => handleQuickText(item.text)}
                disabled={!status.running}
              >
                {item.label}
              </QuickTextButton>
            ))}
          </QuickTextButtons>
        </div>
      </ControlSection>

      {/* Hardware Controls */}
      <ControlSection>
        <SectionTitle>
          ⌨️ Hardware Controls
        </SectionTitle>
        
        <HardwareKeysGrid>
          {hardwareKeys.map((key, index) => (
            <HardwareKey
              key={index}
              onClick={() => onKeyEvent(key.keycode)}
              disabled={!status.running}
              title={`Send ${key.label} key`}
            >
              <KeyIcon>{key.icon}</KeyIcon>
              <KeyLabel>{key.label}</KeyLabel>
            </HardwareKey>
          ))}
        </HardwareKeysGrid>

        <div style={{ marginTop: '15px' }}>
          <Button
            secondary
            onClick={() => window.open('/vnc', '_blank')}
            disabled={!status.running}
            style={{ width: '100%' }}
          >
            📺 Open Full VNC Viewer
          </Button>
        </div>
      </ControlSection>

      {/* File Upload */}
      <ControlSection>
        <SectionTitle>
          📁 File Transfer
        </SectionTitle>
        
        <FileUploadArea
          className={dragOver ? 'dragover' : ''}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📎</div>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            Drop files here or click to browse
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Supports images, documents, APKs, etc.
          </div>
        </FileUploadArea>

        <FileInput
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={!status.running}
        />

        <div style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
          Files will be uploaded to /sdcard/Download/ on the Android device
        </div>
      </ControlSection>

      {/* Activity Log */}
      <ControlSection>
        <SectionTitle>
          📋 Activity Log
        </SectionTitle>
        
        <ActivityLog>
          {logs.length === 0 ? (
            <LogEntry type="info">
              No activity yet. Start the phone to begin logging.
            </LogEntry>
          ) : (
            logs.slice(-20).map((log, index) => {
              const type = log.includes('✅') ? 'success' :
                          log.includes('❌') ? 'error' :
                          log.includes('⚠️') ? 'warning' : 'info';
              
              return (
                <LogEntry key={index} type={type}>
                  {log}
                </LogEntry>
              );
            })
          )}
        </ActivityLog>

        <Button
          onClick={() => window.location.reload()}
          style={{ width: '100%', marginTop: '10px' }}
        >
          🔄 Refresh Interface
        </Button>
      </ControlSection>
    </ControlContainer>
  );
};

export default ControlPanel;