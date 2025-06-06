import React from 'react';
import styled from 'styled-components';

const ProfilesContainer = styled.div`
  margin: 15px 0;
`;

const ProfilesTitle = styled.h4`
  color: #4CAF50;
  margin: 0 0 10px 0;
  font-size: 14px;
`;

const ProfilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 20px;
`;

const ProfileCard = styled.button`
  background: linear-gradient(145deg, #333, #2a2a2a);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  color: white;
  
  &:hover {
    border-color: #4CAF50;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ProfileIcon = styled.div`
  font-size: 24px;
  margin-bottom: 4px;
`;

const ProfileName = styled.div`
  font-weight: bold;
  font-size: 11px;
  color: #4CAF50;
  margin-bottom: 2px;
`;

const ProfileSpecs = styled.div`
  font-size: 9px;
  color: #ccc;
  line-height: 1.2;
`;

const deviceProfiles = [
  {
    name: "iPhone 15 Pro",
    icon: "📱",
    config: {
      androidVersion: 'android-34',
      ram: '8192',
      storage: '16384',
      resolution: '1179x2556',
      density: '460'
    },
    specs: "8GB • 16GB • 6.1\""
  },
  {
    name: "iPhone 15 Pro Max",
    icon: "📱",
    config: {
      androidVersion: 'android-34',
      ram: '8192',
      storage: '32768',
      resolution: '1290x2796',
      density: '460'
    },
    specs: "8GB • 32GB • 6.7\""
  },
  {
    name: "Pixel 8 Pro",
    icon: "📱",
    config: {
      androidVersion: 'android-34',
      ram: '12288',
      storage: '16384',
      resolution: '1344x2992',
      density: '489'
    },
    specs: "12GB • 16GB • 6.7\""
  },
  {
    name: "Galaxy S24 Ultra",
    icon: "📱",
    config: {
      androidVersion: 'android-34',
      ram: '12288',
      storage: '32768',
      resolution: '1440x3120',
      density: '501'
    },
    specs: "12GB • 32GB • 6.8\""
  },
  {
    name: "OnePlus 12",
    icon: "📱",
    config: {
      androidVersion: 'android-34',
      ram: '16384',
      storage: '32768',
      resolution: '1440x3168',
      density: '510'
    },
    specs: "16GB • 32GB • 6.82\""
  },
  {
    name: "iPad Pro",
    icon: "📟",
    config: {
      androidVersion: 'android-34',
      ram: '16384',
      storage: '65536',
      resolution: '2048x2732',
      density: '264'
    },
    specs: "16GB • 64GB • 12.9\""
  },
  {
    name: "Galaxy Tab S9",
    icon: "📟",
    config: {
      androidVersion: 'android-34',
      ram: '12288',
      storage: '32768',
      resolution: '1752x2800',
      density: '274'
    },
    specs: "12GB • 32GB • 11\""
  },
  {
    name: "Gaming Phone",
    icon: "🎮",
    config: {
      androidVersion: 'android-34',
      ram: '18432',
      storage: '65536',
      resolution: '1440x3200',
      density: '515'
    },
    specs: "18GB • 64GB • Gaming"
  },
  {
    name: "Budget Phone",
    icon: "💰",
    config: {
      androidVersion: 'android-33',
      ram: '3072',
      storage: '8192',
      resolution: '720x1560',
      density: '320'
    },
    specs: "3GB • 8GB • Budget"
  },
  {
    name: "Foldable",
    icon: "📱",
    config: {
      androidVersion: 'android-34',
      ram: '12288',
      storage: '32768',
      resolution: '1768x2208',
      density: '426'
    },
    specs: "12GB • 32GB • Fold"
  },
  {
    name: "Custom Build",
    icon: "🔧",
    config: {
      androidVersion: 'android-34',
      ram: '8192',
      storage: '16384',
      resolution: '1080x1920',
      density: '420'
    },
    specs: "Customizable"
  }
];

const DeviceProfiles = ({ onSelectProfile }) => {
  const handleProfileSelect = (profile) => {
    onSelectProfile({
      ...profile.config,
      name: profile.name
    });
  };

  return (
    <ProfilesContainer>
      <ProfilesTitle>📱 Device Profiles</ProfilesTitle>
      <ProfilesGrid>
        {deviceProfiles.map((profile, index) => (
          <ProfileCard
            key={index}
            onClick={() => handleProfileSelect(profile)}
          >
            <ProfileIcon>{profile.icon}</ProfileIcon>
            <ProfileName>{profile.name}</ProfileName>
            <ProfileSpecs>{profile.specs}</ProfileSpecs>
          </ProfileCard>
        ))}
      </ProfilesGrid>
    </ProfilesContainer>
  );
};

export default DeviceProfiles;
