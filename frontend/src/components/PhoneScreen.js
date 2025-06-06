import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const PhoneContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
`;

const PhoneFrame = styled.div`
  width: 380px;
  height: 680px;
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  border-radius: 30px;
  padding: 25px;
  box-shadow: 
    0 0 50px rgba(0,0,0,0.8),
    inset 0 0 20px rgba(255,255,255,0.1);
  border: 2px solid #333;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const PhoneHeader = styled.div`
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

const Speaker = styled.div`
  width: 60px;
  height: 6px;
  background: #444;
  border-radius: 3px;
`;

const Camera = styled.div`
  width: 12px;
  height: 12px;
  background: #222;
  border-radius: 50%;
  position: absolute;
  right: 40px;
  top: 20px;
  border: 1px solid #444;
`;

const Screen = styled.div`
  flex: 1;
  background: #000;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  cursor: ${props => props.interactive ? 'pointer' : 'default'};
  border: 2px solid #333;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
`;

const VNCContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const VNCFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
`;

const PlaceholderContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
  color: white;
  text-align: center;
  padding: 40px;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #333;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px 0;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const StatusText = styled.h3`
  margin: 15px 0;
  color: ${props => props.error ? '#f44336' : '#4CAF50'};
  font-size: 18px;
`;

const SubText = styled.p`
  color: #888;
  font-size: 14px;
  margin: 10px 0;
`;

const HomeButton = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(145deg, #333, #222);
  border-radius: 50%;
  margin: 15px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid #444;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(145deg, #444, #333);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const HomeIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #666;
  border-radius: 4px;
`;

const TouchOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: transparent;
`;

const PhoneScreen = ({ status, onTap, onHomePress }) => {
  const [clickEffect, setClickEffect] = useState(null);
  const screenRef = useRef(null);

  const handleScreenClick = (event) => {
    if (!status.running || !onTap) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) * (status.screenWidth / rect.width));
    const y = Math.round((event.clientY - rect.top) * (status.screenHeight / rect.height));
    
    // Visual click effect
    setClickEffect({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setTimeout(() => setClickEffect(null), 300);
    
    onTap(x, y);
  };

  const renderScreenContent = () => {
    if (!status.running) {
      return (
        <PlaceholderContent>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
          <StatusText>Cloud Android Phone</StatusText>
          <SubText>Click "Start Phone" to begin</SubText>
          <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
            <div>🔧 Android 14 Ready</div>
            <div>💾 4GB RAM • 8GB Storage</div>
            <div>📺 1080x1920 Resolution</div>
          </div>
        </PlaceholderContent>
      );
    }

    if (status.running && !status.vncUrl) {
      return (
        <PlaceholderContent>
          <LoadingSpinner />
          <StatusText>🚀 Starting Android...</StatusText>
          <SubText>Setting up virtual device...</SubText>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
            <div>⏳ This may take 2-3 minutes</div>
            <div>🔄 Initializing Android system</div>
            <div>📡 Setting up VNC connection</div>
          </div>
        </PlaceholderContent>
      );
    }

    return (
      <VNCContainer>
        <VNCFrame 
          src={`http://localhost:${status.websockifyPort}/vnc.html?host=localhost&port=${status.websockifyPort}&autoconnect=true&resize=scale&quality=6&compression=9`}
          title="Android Phone Screen"
        />
        <TouchOverlay onClick={handleScreenClick} />
        {clickEffect && (
          <div
            style={{
              position: 'absolute',
              left: clickEffect.x - 10,
              top: clickEffect.y - 10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'rgba(76, 175, 80, 0.6)',
              pointerEvents: 'none',
              animation: 'clickRipple 0.3s ease-out',
              zIndex: 20
            }}
          />
        )}
        <style jsx>{`
          @keyframes clickRipple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(3);
              opacity: 0;
            }
          }
        `}</style>
      </VNCContainer>
    );
  };

  return (
    <PhoneContainer>
      <PhoneFrame>
        <PhoneHeader>
          <Speaker />
          <Camera />
        </PhoneHeader>
        
        <Screen 
          ref={screenRef}
          interactive={status.running}
        >
          {renderScreenContent()}
        </Screen>
        
        <HomeButton onClick={() => onHomePress && onHomePress()}>
          <HomeIcon />
        </HomeButton>
      </PhoneFrame>
    </PhoneContainer>
  );
};

export default PhoneScreen;