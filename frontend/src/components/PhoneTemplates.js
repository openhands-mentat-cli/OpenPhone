import React, { useState } from 'react';
import styled from 'styled-components';

const TemplatesContainer = styled.div`
  margin: 15px 0;
`;

const TemplatesTitle = styled.h4`
  color: #4CAF50;
  margin: 0 0 10px 0;
  font-size: 14px;
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
`;

const TemplateCard = styled.button`
  background: linear-gradient(145deg, #333, #2a2a2a);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  color: white;
  
  &:hover {
    border-color: #4CAF50;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const TemplateName = styled.div`
  font-weight: bold;
  font-size: 12px;
  color: #4CAF50;
  margin-bottom: 4px;
`;

const TemplateSpecs = styled.div`
  font-size: 10px;
  color: #ccc;
  line-height: 1.3;
`;

const phoneTemplates = [
  {
    name: "🔋 Basic Phone",
    config: {
      androidVersion: 'android-34',
      ram: '2048',
      storage: '4096',
      resolution: '720x1280',
      density: '320'
    },
    specs: "2GB RAM • 4GB Storage • HD"
  },
  {
    name: "⚡ Performance",
    config: {
      androidVersion: 'android-34',
      ram: '8192',
      storage: '16384',
      resolution: '1080x1920',
      density: '420'
    },
    specs: "8GB RAM • 16GB Storage • FHD"
  },
  {
    name: "🎮 Gaming",
    config: {
      androidVersion: 'android-34',
      ram: '16384',
      storage: '32768',
      resolution: '1440x2560',
      density: '560'
    },
    specs: "16GB RAM • 32GB Storage • 2K"
  },
  {
    name: "🏢 Business",
    config: {
      androidVersion: 'android-34',
      ram: '4096',
      storage: '8192',
      resolution: '1080x1920',
      density: '420'
    },
    specs: "4GB RAM • 8GB Storage • FHD"
  },
  {
    name: "🧪 Testing",
    config: {
      androidVersion: 'android-33',
      ram: '4096',
      storage: '8192',
      resolution: '1080x1920',
      density: '420'
    },
    specs: "Android 13 • 4GB RAM • 8GB"
  },
  {
    name: "📱 Flagship",
    config: {
      androidVersion: 'android-34',
      ram: '12288',
      storage: '65536',
      resolution: '1440x3120',
      density: '640'
    },
    specs: "12GB RAM • 64GB Storage • 2K+"
  }
];

const PhoneTemplates = ({ onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.name);
    onSelectTemplate(template.config);
    
    // Reset selection after animation
    setTimeout(() => setSelectedTemplate(null), 300);
  };

  return (
    <TemplatesContainer>
      <TemplatesTitle>📱 Quick Templates</TemplatesTitle>
      <TemplatesGrid>
        {phoneTemplates.map((template, index) => (
          <TemplateCard
            key={index}
            onClick={() => handleTemplateSelect(template)}
            style={{
              transform: selectedTemplate === template.name ? 'scale(0.95)' : 'scale(1)',
              borderColor: selectedTemplate === template.name ? '#4CAF50' : '#444'
            }}
          >
            <TemplateName>{template.name}</TemplateName>
            <TemplateSpecs>{template.specs}</TemplateSpecs>
          </TemplateCard>
        ))}
      </TemplatesGrid>
    </TemplatesContainer>
  );
};

export default PhoneTemplates;
