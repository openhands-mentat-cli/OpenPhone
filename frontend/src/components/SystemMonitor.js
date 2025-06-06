import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const MonitorContainer = styled.div`
  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid #444;
`;

const MonitorHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 20px;
`;

const MonitorTitle = styled.h3`
  margin: 0;
  color: #4CAF50;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RefreshButton = styled.button`
  background: linear-gradient(145deg, #555, #444);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(145deg, #666, #555);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const MetricCard = styled.div`
  background: linear-gradient(145deg, #1a1a1a, #222);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
`;

const MetricTitle = styled.div`
  color: #ccc;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetricValue = styled.div`
  color: ${props => 
    props.warning ? '#FF9800' :
    props.critical ? '#f44336' :
    '#4CAF50'
  };
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const MetricSubtext = styled.div`
  color: #888;
  font-size: 11px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => 
    props.percentage > 90 ? '#f44336' :
    props.percentage > 70 ? '#FF9800' :
    '#4CAF50'
  };
  width: ${props => props.percentage}%;
  transition: all 0.3s ease;
`;

const PhoneMetrics = styled.div`
  margin-top: 20px;
`;

const PhoneMetricRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PhoneName = styled.div`
  flex: 1;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const PhoneStatus = styled.div`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  background: ${props => props.running ? '#4CAF50' : '#666'};
  color: white;
  margin: 0 10px;
`;

const PhoneMetric = styled.div`
  color: #ccc;
  font-size: 12px;
  min-width: 80px;
  text-align: right;
`;

const SystemMonitor = ({ phones }) => {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: { usage: 0, cores: 0 },
    memory: { used: 0, total: 0, free: 0 },
    disk: { used: 0, total: 0, free: 0 },
    network: { download: 0, upload: 0 },
    uptime: 0
  });
  const [phoneMetrics, setPhoneMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate system metrics (in production, get from backend API)
      const mockSystemMetrics = {
        cpu: { 
          usage: Math.random() * 100, 
          cores: 8 
        },
        memory: { 
          used: Math.random() * 16384, 
          total: 16384, 
          free: 16384 - Math.random() * 16384 
        },
        disk: { 
          used: Math.random() * 500, 
          total: 1000, 
          free: 1000 - Math.random() * 500 
        },
        network: { 
          download: Math.random() * 100, 
          upload: Math.random() * 50 
        },
        uptime: Date.now() - (Math.random() * 86400000) // Random uptime up to 24h
      };
      
      setSystemMetrics(mockSystemMetrics);
      
      // Generate phone-specific metrics
      const phoneMetricsData = {};
      phones.forEach(phone => {
        phoneMetricsData[phone.id] = {
          cpu: phone.status?.running ? Math.random() * 100 : 0,
          memory: phone.status?.running ? Math.random() * 4096 : 0,
          network: phone.status?.running ? Math.random() * 50 : 0,
          uptime: phone.status?.running ? Math.random() * 3600000 : 0
        };
      });
      
      setPhoneMetrics(phoneMetricsData);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [phones]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const memoryUsagePercent = (systemMetrics.memory.used / systemMetrics.memory.total) * 100;
  const diskUsagePercent = (systemMetrics.disk.used / systemMetrics.disk.total) * 100;

  return (
    <MonitorContainer>
      <MonitorHeader>
        <MonitorTitle>
          📊 System Monitor
        </MonitorTitle>
        <RefreshButton onClick={fetchMetrics} disabled={loading}>
          {loading ? '🔄' : '↻'} Refresh
        </RefreshButton>
      </MonitorHeader>

      <MetricsGrid>
        <MetricCard>
          <MetricTitle>
            🖥️ CPU Usage
          </MetricTitle>
          <MetricValue 
            warning={systemMetrics.cpu.usage > 70}
            critical={systemMetrics.cpu.usage > 90}
          >
            {systemMetrics.cpu.usage.toFixed(1)}%
          </MetricValue>
          <MetricSubtext>{systemMetrics.cpu.cores} cores available</MetricSubtext>
          <ProgressBar>
            <ProgressFill percentage={systemMetrics.cpu.usage} />
          </ProgressBar>
        </MetricCard>

        <MetricCard>
          <MetricTitle>
            💾 Memory Usage
          </MetricTitle>
          <MetricValue 
            warning={memoryUsagePercent > 70}
            critical={memoryUsagePercent > 90}
          >
            {memoryUsagePercent.toFixed(1)}%
          </MetricValue>
          <MetricSubtext>
            {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
          </MetricSubtext>
          <ProgressBar>
            <ProgressFill percentage={memoryUsagePercent} />
          </ProgressBar>
        </MetricCard>

        <MetricCard>
          <MetricTitle>
            💿 Disk Usage
          </MetricTitle>
          <MetricValue 
            warning={diskUsagePercent > 80}
            critical={diskUsagePercent > 95}
          >
            {diskUsagePercent.toFixed(1)}%
          </MetricValue>
          <MetricSubtext>
            {formatBytes(systemMetrics.disk.used * 1024 * 1024 * 1024)} / 
            {formatBytes(systemMetrics.disk.total * 1024 * 1024 * 1024)}
          </MetricSubtext>
          <ProgressBar>
            <ProgressFill percentage={diskUsagePercent} />
          </ProgressBar>
        </MetricCard>

        <MetricCard>
          <MetricTitle>
            🌐 Network Activity
          </MetricTitle>
          <MetricValue>
            ↓ {systemMetrics.network.download.toFixed(1)} MB/s
          </MetricValue>
          <MetricSubtext>
            ↑ {systemMetrics.network.upload.toFixed(1)} MB/s
          </MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricTitle>
            ⏱️ System Uptime
          </MetricTitle>
          <MetricValue>
            {formatUptime(systemMetrics.uptime)}
          </MetricValue>
          <MetricSubtext>
            Last restart: {new Date(Date.now() - systemMetrics.uptime).toLocaleDateString()}
          </MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricTitle>
            📱 Active Phones
          </MetricTitle>
          <MetricValue>
            {phones.filter(p => p.status?.running).length} / {phones.length}
          </MetricValue>
          <MetricSubtext>
            {phones.length === 0 ? 'No phones created' : `${phones.length} total phones`}
          </MetricSubtext>
        </MetricCard>
      </MetricsGrid>

      {phones.length > 0 && (
        <PhoneMetrics>
          <MetricTitle style={{ marginBottom: '10px' }}>
            📱 Phone Performance
          </MetricTitle>
          {phones.map(phone => (
            <PhoneMetricRow key={phone.id}>
              <PhoneName>{phone.name}</PhoneName>
              <PhoneStatus running={phone.status?.running}>
                {phone.status?.running ? 'Running' : 'Stopped'}
              </PhoneStatus>
              {phone.status?.running && phoneMetrics[phone.id] && (
                <>
                  <PhoneMetric>
                    CPU: {phoneMetrics[phone.id].cpu.toFixed(1)}%
                  </PhoneMetric>
                  <PhoneMetric>
                    RAM: {formatBytes(phoneMetrics[phone.id].memory * 1024 * 1024)}
                  </PhoneMetric>
                  <PhoneMetric>
                    Net: {phoneMetrics[phone.id].network.toFixed(1)} MB/s
                  </PhoneMetric>
                  <PhoneMetric>
                    Up: {formatUptime(phoneMetrics[phone.id].uptime)}
                  </PhoneMetric>
                </>
              )}
            </PhoneMetricRow>
          ))}
        </PhoneMetrics>
      )}

      {lastUpdate && (
        <MetricSubtext style={{ textAlign: 'center', marginTop: '15px' }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </MetricSubtext>
      )}
    </MonitorContainer>
  );
};

export default SystemMonitor;
