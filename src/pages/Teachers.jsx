import React, { useState, useEffect, useCallback } from 'react';
import { Phone, BookOpen, X } from 'lucide-react';
import { API_URL } from '../config';

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const sortByOrder = (data, customOrderStr = null) => {
    const orderToUse = customOrderStr || localStorage.getItem('school_teachers_order') || '[]';
    let savedOrder = [];
    try {
      savedOrder = JSON.parse(orderToUse);
    } catch {
      savedOrder = [];
    }
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

  const fetchTeachers = useCallback(async () => {
    try {
      if (!API_URL || API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        setError("กรุณาตั้งค่า API_URL ใน config.js ก่อนครับ");
        setLoading(false);
        return;
      }

      // โหลดจาก cache ก่อนเพื่อให้แสดงทันที
      const cached = localStorage.getItem('school_teachers_cache');
      if (cached) {
        setTeachers(sortByOrder(JSON.parse(cached)));
        setLoading(false);
      }

      // ยกเลิก fetch ถ้าใช้เวลานานเกิน 8 วินาที
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const [response, configRes] = await Promise.all([
        fetch(`${API_URL}?action=getTeachers`, { signal: controller.signal }),
        fetch(`${API_URL}?action=getConfig`, { signal: controller.signal }).catch(() => null)
      ]);
      clearTimeout(timeoutId);

      let serverOrder = null;
      if (configRes && configRes.ok) {
        try {
          const configResult = await configRes.json();
          if (configResult.status === 'success' && configResult.data?.school_teachers_order) {
            serverOrder = configResult.data.school_teachers_order;
            localStorage.setItem('school_teachers_order', serverOrder);
          }
        } catch (e) {
          console.error("Error parsing config", e);
        }
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        const sorted = sortByOrder(result.data, serverOrder);
        setTeachers(sorted);
        try {
          localStorage.setItem('school_teachers_cache', JSON.stringify(result.data));
        } catch {
          console.warn('LocalStorage quota exceeded, skipping cache for Teachers.');
        }
        setError(null);
      } else if (!cached) {
        setError(result.message);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch timeout');
      } else {
        console.error(err);
      }
      if (!localStorage.getItem('school_teachers_cache')) setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, []); // เอา teachers.length ออกเพื่อป้องกัน loop

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const openModal = (teacher) => {
    setSelectedTeacher(teacher);
  };

  const closeModal = () => {
    setSelectedTeacher(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูลบุคลากร...</p>
      </div>
    );
  }

  if (error) {
    return <div className="page-container text-center"><p className="mt-4 text-red-500">{error}</p></div>;
  }

  const formatPhone = (phone) => {
    if (!phone) return '';
    const p = phone.toString().trim();
    if (p.length === 9 && !p.startsWith('0')) return '0' + p;
    return p;
  };

  return (
    <div className="page-container">
      <h2 className="page-title">บุคลากรโรงเรียน</h2>
      
      {teachers.length === 0 ? (
        <p className="text-center mt-4">ไม่มีข้อมูลบุคลากร</p>
      ) : (
        <div className="grid-2col">
          {teachers.map((t) => (
            <div 
              key={t.ID} 
              className="grid-card"
              onClick={() => openModal(t)}
            >
              <img 
                src={t.ImageURL || 'https://via.placeholder.com/150'} 
                alt={t.Name} 
                style={{borderRadius: '50%', width: '80px', height: '80px'}} 
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = 'https://www.svgrepo.com/show/452208/google-classroom.svg'; // Default teacher icon
                }}
              />
              <div style={{fontWeight: 600, fontSize: '0.95rem', lineHeight: '1.2', margin: '4px 0'}}>
                {t.Name ? t.Name.split(/[\s,]+/).map((part, i) => <div key={i}>{part}</div>) : ''}
              </div>
              <span style={{fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', wordBreak: 'break-word', textAlign: 'center', width: '100%', display: 'block'}}>
                {t.Subject ? t.Subject.split(',').map((part, i) => <div key={i}>{part.trim()}</div>) : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedTeacher && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>
              <X size={20} />
            </button>
            
            <div className="teacher-modal-header">
              <img 
                src={selectedTeacher.ImageURL || 'https://via.placeholder.com/150'} 
                alt={selectedTeacher.Name} 
                className="teacher-modal-image" 
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = 'https://www.svgrepo.com/show/452208/google-classroom.svg'; // Default teacher icon
                }}
              />
              <h3 className="teacher-modal-name">{selectedTeacher.Name}</h3>
              <p className="teacher-modal-subject">
                <BookOpen size={16} style={{display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom'}}/>
                ครูผู้สอนวิชา{selectedTeacher.Subject}
              </p>
            </div>
            
            <div className="contact-list">
              {selectedTeacher.Phone1 && (
                <a href={`tel:${formatPhone(selectedTeacher.Phone1)}`} className="contact-btn">
                  <Phone size={20} /> โทร {formatPhone(selectedTeacher.Phone1)}
                </a>
              )}
              {selectedTeacher.Phone2 && (
                <a href={`tel:${formatPhone(selectedTeacher.Phone2)}`} className="contact-btn">
                  <Phone size={20} /> โทร {formatPhone(selectedTeacher.Phone2)}
                </a>
              )}
              {!selectedTeacher.Phone1 && !selectedTeacher.Phone2 && (
                <p className="text-center" style={{color: '#6b7280'}}>ไม่มีข้อมูลเบอร์โทรศัพท์</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
