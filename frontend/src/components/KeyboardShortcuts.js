import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = ({
  onCreatePhone,
  onStartPhone,
  onStopPhone,
  onToggleMonitor,
  activePhoneId,
  phones
}) => {
  const handleKeyDown = useCallback((event) => {
    // Check if user is typing in an input field
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
      return;
    }

    // Ctrl/Cmd key combinations
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          onCreatePhone();
          break;
        case 's':
          event.preventDefault();
          if (activePhoneId) {
            const activePhone = phones.find(p => p.id === activePhoneId);
            if (activePhone?.status?.running) {
              onStopPhone();
            } else {
              onStartPhone();
            }
          }
          break;
        case 'm':
          event.preventDefault();
          onToggleMonitor();
          break;
        default:
          break;
      }
    }

    // Number keys for phone selection
    if (event.key >= '1' && event.key <= '9') {
      const phoneIndex = parseInt(event.key) - 1;
      if (phones[phoneIndex]) {
        // Switch to phone by number
        const phoneId = phones[phoneIndex].id;
        if (phoneId !== activePhoneId) {
          // This would need to be passed as a prop
          // onSelectPhone(phoneId);
        }
      }
    }

    // ESC key to close modals/clear selections
    if (event.key === 'Escape') {
      // This would need to be implemented based on current modal state
      // onEscapeKey();
    }
  }, [
    onCreatePhone,
    onStartPhone,
    onStopPhone,
    onToggleMonitor,
    activePhoneId,
    phones
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Keyboard shortcuts help component
const KeyboardShortcutsHelp = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #2d2d2d, #1a1a1a)',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '500px',
        border: '1px solid #444',
        color: 'white'
      }}>
        <h3 style={{ color: '#4CAF50', marginTop: 0 }}>⌨️ Keyboard Shortcuts</h3>
        
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><kbd>Ctrl/Cmd + N</kbd></span>
            <span>Create new phone</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><kbd>Ctrl/Cmd + S</kbd></span>
            <span>Start/Stop active phone</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><kbd>Ctrl/Cmd + M</kbd></span>
            <span>Toggle system monitor</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><kbd>1-9</kbd></span>
            <span>Select phone by number</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><kbd>Esc</kbd></span>
            <span>Close modals/Clear selections</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><kbd>?</kbd></span>
            <span>Show this help</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            background: 'linear-gradient(145deg, #4CAF50, #45a049)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export { useKeyboardShortcuts, KeyboardShortcutsHelp };
