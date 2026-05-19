import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAPrompt = () => {
  // --- Service Worker Update Prompt ---
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const closeUpdatePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // --- Install Prompt ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Check if user has dismissed it recently (optional, but good UX)
      const dismissed = sessionStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed, hide prompt
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  // Only show one prompt at a time (Update takes precedence)
  if (needRefresh || offlineReady) {
    return (
      <div style={promptStyle}>
        <style>{animationStyle}</style>
        <div style={contentWrapperStyle}>
          <div style={{...iconBoxStyle, background: 'linear-gradient(135deg, #10b981, #059669)'}}>
            <RefreshCw size={20} />
          </div>
          <div>
            <h4 style={titleStyle}>
              {needRefresh ? 'มีอัปเดตใหม่!' : 'แอปพร้อมใช้งานออฟไลน์'}
            </h4>
            <p style={subtitleStyle}>
              {needRefresh ? 'กรุณารีเฟรชเพื่อใช้งานเวอร์ชันล่าสุด' : 'คุณสามารถใช้งานแอปได้แม้ไม่มีอินเทอร์เน็ต'}
            </p>
          </div>
        </div>
        
        <div style={actionWrapperStyle}>
          {needRefresh && (
            <button onClick={() => updateServiceWorker(true)} style={{...primaryBtnStyle, background: '#10b981', boxShadow: '0 4px 10px rgba(16,185,129,0.3)'}}>
              รีเฟรช
            </button>
          )}
          <button onClick={closeUpdatePrompt} style={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (showInstallPrompt) {
    return (
      <div style={promptStyle}>
        <style>{animationStyle}</style>
        <div style={contentWrapperStyle}>
          <div style={iconBoxStyle}>
            <Download size={20} />
          </div>
          <div>
            <h4 style={titleStyle}>ติดตั้งแอปพลิเคชัน</h4>
            <p style={subtitleStyle}>เพื่อการใช้งานที่สะดวกรวดเร็ว</p>
          </div>
        </div>
        
        <div style={actionWrapperStyle}>
          <button onClick={handleInstallClick} style={primaryBtnStyle}>
            ติดตั้ง
          </button>
          <button onClick={handleDismissInstall} style={closeBtnStyle}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// --- Styles ---
const promptStyle = {
  position: 'fixed',
  bottom: '80px', // above bottom nav
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90%',
  maxWidth: '400px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: '12px 16px',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: 9999,
  border: '1px solid rgba(255,255,255,0.6)',
  animation: 'slideUpPWA 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
};

const animationStyle = `
  @keyframes slideUpPWA {
    0% { opacity: 0; transform: translate(-50%, 30px); }
    100% { opacity: 1; transform: translate(-50%, 0); }
  }
`;

const contentWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flex: 1
};

const iconBoxStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  flexShrink: 0
};

const titleStyle = {
  margin: 0,
  fontSize: '0.95rem',
  color: '#1f2937',
  fontWeight: 600
};

const subtitleStyle = {
  margin: 0,
  fontSize: '0.8rem',
  color: '#6b7280'
};

const actionWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const primaryBtnStyle = {
  background: '#6366f1',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(99,102,241,0.3)',
  transition: 'transform 0.2s ease'
};

const closeBtnStyle = {
  background: 'rgba(0,0,0,0.05)',
  color: '#6b7280',
  border: 'none',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s ease'
};

export default PWAPrompt;
