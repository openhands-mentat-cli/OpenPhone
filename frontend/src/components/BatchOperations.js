import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

const BatchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  border-radius: 8px;
  border: 1px solid #444;
  margin: 10px 0;
`;

const BatchSelect = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 12px;
`;

const SelectAllCheckbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #4CAF50;
  cursor: pointer;
`;

const BatchActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const BatchButton = styled.button`
  background: ${props => 
    props.start ? 'linear-gradient(145deg, #4CAF50, #45a049)' :
    props.stop ? 'linear-gradient(145deg, #f44336, #da190b)' :
    props.delete ? 'linear-gradient(145deg, #FF9800, #F57C00)' :
    'linear-gradient(145deg, #2196F3, #1976D2)'
  };
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  transition: all 0.2s ease;
  
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

const BatchCount = styled.span`
  color: #4CAF50;
  font-weight: bold;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 6px;
  margin-left: 10px;
`;

const QuickActionButton = styled.button`
  background: linear-gradient(145deg, #555, #444);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(145deg, #666, #555);
  }
`;

const BatchOperations = ({ 
  phones, 
  selectedPhones, 
  setSelectedPhones, 
  onBatchStart, 
  onBatchStop, 
  onBatchDelete,
  onBatchClone
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedPhones(phones.map(p => p.id));
    } else {
      setSelectedPhones([]);
    }
  }, [phones, setSelectedPhones]);

  const isAllSelected = phones.length > 0 && selectedPhones.length === phones.length;
  const selectedCount = selectedPhones.length;
  const hasSelected = selectedCount > 0;

  const handleBatchAction = useCallback(async (action) => {
    if (!hasSelected || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await action(selectedPhones);
    } finally {
      setIsProcessing(false);
    }
  }, [hasSelected, isProcessing, selectedPhones]);

  const selectedRunningPhones = phones.filter(p => 
    selectedPhones.includes(p.id) && p.status?.running
  ).length;

  const selectedStoppedPhones = phones.filter(p => 
    selectedPhones.includes(p.id) && !p.status?.running
  ).length;

  return (
    <BatchContainer>
      <BatchSelect>
        <SelectAllCheckbox
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
        <span>
          {hasSelected ? (
            <>Select <BatchCount>{selectedCount}</BatchCount> phone{selectedCount !== 1 ? 's' : ''}</>
          ) : (
            'Select phones for batch operations'
          )}
        </span>
      </BatchSelect>

      {hasSelected && (
        <BatchActions>
          {selectedStoppedPhones > 0 && (
            <BatchButton
              start
              disabled={isProcessing}
              onClick={() => handleBatchAction(onBatchStart)}
            >
              🚀 Start {selectedStoppedPhones}
            </BatchButton>
          )}
          
          {selectedRunningPhones > 0 && (
            <BatchButton
              stop
              disabled={isProcessing}
              onClick={() => handleBatchAction(onBatchStop)}
            >
              🛑 Stop {selectedRunningPhones}
            </BatchButton>
          )}
          
          <BatchButton
            disabled={isProcessing}
            onClick={() => handleBatchAction(onBatchClone)}
          >
            📋 Clone
          </BatchButton>
          
          <BatchButton
            delete
            disabled={isProcessing || selectedRunningPhones > 0}
            onClick={() => handleBatchAction(onBatchDelete)}
          >
            🗑️ Delete {selectedCount}
          </BatchButton>
        </BatchActions>
      )}

      <QuickActions>
        <QuickActionButton onClick={() => handleSelectAll(false)}>
          Clear
        </QuickActionButton>
        <QuickActionButton onClick={() => {
          const stoppedPhones = phones.filter(p => !p.status?.running).map(p => p.id);
          setSelectedPhones(stoppedPhones);
        }}>
          Stopped
        </QuickActionButton>
        <QuickActionButton onClick={() => {
          const runningPhones = phones.filter(p => p.status?.running).map(p => p.id);
          setSelectedPhones(runningPhones);
        }}>
          Running
        </QuickActionButton>
      </QuickActions>
    </BatchContainer>
  );
};

export default BatchOperations;
