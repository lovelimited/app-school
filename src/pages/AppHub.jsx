import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { API_URL } from '../config';

function AppHub() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const sortByOrder = (data) => {
    const savedOrder = JSON.parse(localStorage.getItem('school_apps_order') || '[]');
    if (savedOrder.length === 0) return data;
    return [...data].sort((a, b) => {
      const ia = savedOrder.indexOf(String(a.ID));
      const ib = savedOrder.indexOf(String(b.ID));
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  };

  const fetchApps = useCallback(async (isManual = false) => {
    try {
      if (!API_URL || API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        setError("กรุณาตั้งค่า API_URL ใน config.js ก่อนครับ");
        setLoading(false);
        return;
      }

      if (isManual) setLoading(true);
      else setRefreshing(true);

      // โหลดจาก Cache ก่อน
      const cached = localStorage.getItem('school_apps_cache');
      if (cached && !isManual) {
        setApps(sortByOrder(JSON.parse(cached)));
        setLoading(false);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_URL}?action=getApps`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const result = await response.json();
      
      if (result.status === 'success') {
        const sorted = sortByOrder(result.data);
        setApps(sorted);
        localStorage.setItem('school_apps_cache', JSON.stringify(result.data));
        setError(null);
      } else if (!cached) {
        setError(result.message);
      }
    } catch (err) {
      if (err.name === 'AbortError') console.log('Fetch timeout');
      else console.error('Fetch error:', err);
      if (!localStorage.getItem('school_apps_cache')) {
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  if (loading && apps.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>กำลังโหลดแอปพลิเคชัน...</p>
      </div>
    );
  }

  if (error && apps.length === 0) {
    return (
      <div className="page-container text-center">
        <p className="mt-4 text-red-500">{error}</p>
        <button onClick={() => fetchApps(true)} className="btn-primary mt-4" style={{ maxWidth: '200px' }}>
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  const cleanGoogleUrl = (url) => {
    if (!url) return '';
    return url.trim();
  };

  const handleAppClick = (e, app) => {
    e.preventDefault();
    const rawUrl = app.LinkURL ? app.LinkURL.trim() : '';
    const url = cleanGoogleUrl(rawUrl);
    
    console.log(`Opening App: ${app.AppName}, Original: ${rawUrl}, Cleaned: ${url}`);

    if (url === '' || url === '#' || url === '.') {
      Swal.fire({ icon: 'info', title: 'ระบบกำลังพัฒนา...', text: 'แอปพลิเคชันนี้ยังไม่เปิดให้บริการในขณะนี้ครับ', confirmButtonColor: '#3b82f6', confirmButtonText: 'ตกลง' });
      return;
    }

    if (!url.startsWith('http')) {
      Swal.fire({ icon: 'warning', title: 'ลิงก์ไม่ถูกต้อง', text: 'URL ของระบบนี้ไม่ถูกต้อง กรุณาตรวจสอบ', confirmButtonColor: '#3b82f6' });
      return;
    }

    const finalUrl = url.includes('script.google.com') && !url.includes('?') ? url + '?nocache=1' : url;
    const newWindow = window.open('', '_blank');
    if (newWindow) newWindow.location.href = finalUrl;
    else window.location.href = finalUrl;
  };

  return (
    <div className="page-container" style={{ position: 'relative', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="page-title" style={{ margin: 0 }}>ระบบทั้งหมด</h2>
        {refreshing && (
          <div style={{ fontSize: '0.8rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' }}>
             <div className="loading-spinner-small"></div> อัปเดตข้อมูล...
          </div>
        )}
      </div>
      
      {apps.length === 0 ? (
        <p className="text-center mt-4">ไม่มีข้อมูลระบบ</p>
      ) : (
        <div className="grid-2col">
          {apps.map((app) => (
            <a 
              key={app.ID} 
              href="#"
              onClick={(e) => handleAppClick(e, app)}
              className="grid-card"
              style={{ cursor: 'pointer', padding: '15px' }}
            >
              <div className="app-icon-wrapper" style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.03)'
              }}>
                <img 
                  src={app.IconURL || '/pwa-192x192.png'} 
                  alt={app.AppName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { 
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = '/pwa-192x192.png';
                  }}
                />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{app.AppName}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppHub;
