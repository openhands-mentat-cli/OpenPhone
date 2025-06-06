import React, { useState } from 'react';
import styled from 'styled-components';

const ManagerContainer = styled.div`
  width: 300px;
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0,0,0,0.3);
  
  @media (max-width: 1400px) {
    width: 100%;
    max-height: 300px;
    order: 1;
  }
  
  @media (max-width: 768px) {
    max-height: 250px;
  }
`;

const ManagerHeader = styled.div`
  padding: 20px;
  background: linear-gradient(145deg, #333, #2a2a2a);
  border-bottom: 1px solid #444;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const ManagerTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #4CAF50;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CreatePhoneButton = styled.button`
  width: 100%;
  background: linear-gradient(145deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
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
`;

const GlobalStats = styled.div`
  background: linear-gradient(145deg, #1a1a1a, #222);
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  border: 1px solid #333;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 14px;
`;

const PhonesList = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const PhoneCard = styled.div`
  background: ${props => props.active ? 
    'linear-gradient(145deg, #4CAF50, #45a049)' : 
    'linear-gradient(145deg, #333, #2a2a2a)'
  };
  border: 2px solid ${props => props.active ? '#4CAF50' : '#444'};
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    border-color: #4CAF50;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const PhoneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const PhoneName = styled.h4`
  margin: 0;
  color: ${props => props.active ? 'white' : '#fff'};
  font-size: 16px;
  font-weight: bold;
`;

const PhoneStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: bold;
  color: ${props => props.running ? '#4CAF50' : '#f44336'};
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

const PhoneInfo = styled.div`
  font-size: 12px;
  color: ${props => props.active ? 'rgba(255,255,255,0.9)' : '#ccc'};
  margin-bottom: 10px;
`;

const PhoneControls = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const ControlButton = styled.button`
  background: ${props => 
    props.start ? 'linear-gradient(145deg, #4CAF50, #45a049)' :
    props.stop ? 'linear-gradient(145deg, #f44336, #da190b)' :
    props.delete ? 'linear-gradient(145deg, #FF9800, #F57C00)' :
    'linear-gradient(145deg, #666, #555)'
  };
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  transition: all 0.2s ease;
  flex: 1;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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
  z-index: 1000;
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

const PhoneManager = ({ 
  phones, 
  activePhoneId, 
  onSelectPhone, 
  onCreatePhone, 
  onStartPhone, 
  onStopPhone, 
  onDeletePhone,
  globalStatus 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPhoneConfig, setNewPhoneConfig] = useState({
    name: '',
    androidVersion: 'android-14',
    ram: '4096',
    storage: '8192',
    resolution: '1080x1920',
    density: '420'
  });

  const handleCreatePhone = () => {
    if (!newPhoneConfig.name.trim()) {
      alert('Please enter a phone name');
      return;
    }
    
    onCreatePhone(newPhoneConfig);
    setShowCreateModal(false);
    setNewPhoneConfig({
      name: '',
      androidVersion: 'android-14',
      ram: '4096',
      storage: '8192',
      resolution: '1080x1920',
      density: '420'
    });
  };

  const formatPhoneSpecs = (phone) => {
    const specs = phone.specs || {};
    return `${specs.ram || '4GB'} RAM • ${specs.storage || '8GB'} Storage • ${specs.android || 'Android 14'}`;
  };

  return (
    <ManagerContainer>
      <ManagerHeader>
        <ManagerTitle>
          📱 Phone Manager
        </ManagerTitle>
        
        <CreatePhoneButton onClick={() => setShowCreateModal(true)}>
          ➕ Create New Phone
        </CreatePhoneButton>
        
        <GlobalStats>
          <StatRow>
            <span>Total Phones:</span>
            <span>{globalStatus.totalPhones}</span>
          </StatRow>
          <StatRow>
            <span>Running:</span>
            <span style={{ color: '#4CAF50' }}>{globalStatus.runningPhones}</span>
          </StatRow>
          <StatRow>
            <span>Offline:</span>
            <span style={{ color: '#f44336' }}>{globalStatus.totalPhones - globalStatus.runningPhones}</span>
          </StatRow>
        </GlobalStats>
      </ManagerHeader>

      <PhonesList>
        {phones.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#888', 
            padding: '40px 20px',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📱</div>
            <h4>No Phones Created</h4>
            <p>Create your first cloud Android phone to get started</p>
          </div>
        ) : (
          phones.map(phone => (
            <PhoneCard
              key={phone.id}
              active={phone.id === activePhoneId}
              onClick={() => onSelectPhone(phone.id)}
            >
              <PhoneHeader>
                <PhoneName active={phone.id === activePhoneId}>
                  {phone.name}
                </PhoneName>
                <PhoneStatus running={phone.status?.running}>
                  <StatusDot running={phone.status?.running} />
                  {phone.status?.running ? 'Online' : 'Offline'}
                </PhoneStatus>
              </PhoneHeader>
              
              <PhoneInfo active={phone.id === activePhoneId}>
                {formatPhoneSpecs(phone)}
              </PhoneInfo>
              
              {phone.status?.running && phone.status?.vncUrl && (
                <PhoneInfo active={phone.id === activePhoneId}>
                  🌐 VNC: Port {phone.status.websockifyPort}
                </PhoneInfo>
              )}
              
              <PhoneControls onClick={(e) => e.stopPropagation()}>
                {!phone.status?.running ? (
                  <ControlButton 
                    start 
                    onClick={() => onStartPhone(phone.id)}
                  >
                    🚀 Start
                  </ControlButton>
                ) : (
                  <ControlButton 
                    stop 
                    onClick={() => onStopPhone(phone.id)}
                  >
                    🛑 Stop
                  </ControlButton>
                )}
                
                <ControlButton 
                  onClick={() => window.open(`/vnc?phone=${phone.id}`, '_blank')}
                  disabled={!phone.status?.running}
                >
                  📺 VNC
                </ControlButton>
                
                <ControlButton 
                  delete 
                  onClick={() => onDeletePhone(phone.id)}
                  disabled={phone.status?.running}
                >
                  🗑️ Delete
                </ControlButton>
              </PhoneControls>
            </PhoneCard>
          ))
        )}
      </PhonesList>

      {/* Create Phone Modal */}
      {showCreateModal && (
        <CreatePhoneModal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>📱 Create New Android Phone</ModalTitle>
            
            <FormGroup>
              <Label>Phone Name</Label>
              <Input
                type="text"
                placeholder="Enter phone name (e.g., My Phone 1)"
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
                <option value="android-14">Android 14 (Latest)</option>
                <option value="android-13">Android 13</option>
                <option value="android-12">Android 12</option>
                <option value="android-11">Android 11</option>
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
    </ManagerContainer>
  );
};

export default PhoneManager;