import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const ToastContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  
  @media (max-width: 768px) {
    top: 60px;
    right: 15px;
    left: 15px;
    max-width: none;
  }
`;

const Toast = styled.div`
  background: ${props => 
    props.type === 'success' ? 'linear-gradient(145deg, #4CAF50, #45a049)' :
    props.type === 'error' ? 'linear-gradient(145deg, #f44336, #da190b)' :
    props.type === 'warning' ? 'linear-gradient(145deg, #FF9800, #F57C00)' :
    'linear-gradient(145deg, #2196F3, #1976D2)'
  };
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ToastIcon = styled.div`
  font-size: 20px;
  min-width: 20px;
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
`;

const ToastMessage = styled.div`
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.8;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    background: rgba(255,255,255,0.1);
  }
`;

const ToastNotifications = ({ toasts, removeToast }) => {
  return (
    <ToastContainer>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          type={toast.type}
          onClick={() => removeToast(toast.id)}
        >
          <ToastIcon>
            {toast.type === 'success' ? '✅' :
             toast.type === 'error' ? '❌' :
             toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </ToastIcon>
          <ToastContent>
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastMessage>{toast.message}</ToastMessage>
          </ToastContent>
          <CloseButton onClick={(e) => {
            e.stopPropagation();
            removeToast(toast.id);
          }}>
            ×
          </CloseButton>
        </Toast>
      ))}
    </ToastContainer>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title, message) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title, message) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((title, message) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title, message) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

export default ToastNotifications;
