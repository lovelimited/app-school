import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Settings as SettingsIcon, Plus, LayoutGrid, Users, Image as ImageIcon, Save, X, LogIn } from 'lucide-react';
import { API_URL } from '../config';

function Settings() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [shake, setShake] = useState(false);
  
  const [apps, setApps] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [activeSegment, setActiveSegment] = useState('apps');
  const [actionType, setActionType] = useState('create');
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const touchStartY = useRef(null);
  const touchItemRef = useRef(null);
  const listRef = useRef(null);
  const dragIndexRef = useRef(null);
  const activeSegmentRef = useRef(activeSegment);
  const listDataRef = useRef([]); // To keep track of current list data (apps or teachers)

  useEffect(() => {
    activeSegmentRef.current = activeSegment;
    listDataRef.current = activeSegment === 'apps' ? apps : teachers;
  }, [activeSegment, apps, teachers]);

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (passcode === 'ktw118') {
      setIsAuthenticated(true);
      Swal.fire({ title: 'เข้าสู่ผู้ดูแลระบบ', icon: 'success', timer: 1000, showConfirmButton: false });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      Swal.fire('รหัสไม่ถูกต้อง', 'กรุณาลองใหม่อีกครั้ง', 'error');
      setPasscode('');
    }
  };

  useEffect(() => {
    if (isAuthenticated) { fetchAllData(); fetchBannerConfig(); }
  }, [isAuthenticated, activeSegment]);

  const fetchBannerConfig = async () => {
    if (API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") return;
    try {
      const res = await fetch(`${API_URL}?action=getConfig`);
      const result = await res.json();
      if (result.status === 'success' && result.data.dashboard_banner_url) setBannerUrl(result.data.dashboard_banner_url);
    } catch (err) { console.error('fetchBannerConfig error:', err); }
  };

  const handleBannerSave = async () => {
    if (API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") { Swal.fire('ข้อผิดพลาด', 'กรุณาตั้งค่า API URL ก่อน', 'error'); return; }
    setIsSubmitting(true);
    try {
      await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'updateConfig', data: { key: 'dashboard_banner_url', value: bannerUrl.trim() } }) });
      Swal.fire('สำเร็จ', 'อัปเดตรูปแบนเนอร์หน้าหลักแล้ว', 'success');
    } catch { Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกแบนเนอร์ได้', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const fetchAllData = async () => {
    if (API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") return;
    setIsLoadingData(true);
    try {
      const resApps = await fetch(`${API_URL}?action=getApps`);
      const dataApps = await resApps.json();
      if (dataApps.status === 'success') {
        const savedOrder = JSON.parse(localStorage.getItem('school_apps_order') || '[]');
        if (savedOrder.length > 0) {
          const sorted = [...dataApps.data].sort((a, b) => {
            const ia = savedOrder.indexOf(String(a.ID));
            const ib = savedOrder.indexOf(String(b.ID));
            if (ia === -1 && ib === -1) return 0;
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
          });
          setApps(sorted);
        } else {
          setApps(dataApps.data);
        }
      }
      const resT = await fetch(`${API_URL}?action=getTeachers`);
      const dataT = await resT.json();
      if (dataT.status === 'success') {
        const savedOrderT = JSON.parse(localStorage.getItem('school_teachers_order') || '[]');
        if (savedOrderT.length > 0) {
          const sortedT = [...dataT.data].sort((a, b) => {
            const ia = savedOrderT.indexOf(String(a.ID));
            const ib = savedOrderT.indexOf(String(b.ID));
            if (ia === -1 && ib === -1) return 0;
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
          });
          setTeachers(sortedT);
        } else {
          setTeachers(dataT.data);
        }
      }
    } catch (err) { console.error('Fetch error:', err); }
    finally { setIsLoadingData(false); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setSelectedFile(e.target.files?.[0] || null);

  const handleSelectItem = (item) => {
    setFormData(item); setSelectedFile(null); setActionType(''); setShowForm(false);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  // === DRAG AND DROP (touch + mouse) ===
  const handleDragStart = (idx) => { 
    setDragIndex(idx); 
    dragIndexRef.current = idx;
  };
  
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    const currentDragIdx = dragIndexRef.current;
    if (currentDragIdx !== null && currentDragIdx !== idx) {
      const setter = activeSegment === 'apps' ? setApps : setTeachers;
      setter(prevList => {
        const updated = [...prevList];
        const [moved] = updated.splice(currentDragIdx, 1);
        updated.splice(idx, 0, moved);
        return updated;
      });
      setDragIndex(idx);
      dragIndexRef.current = idx;
    }
    setOverIndex(idx);
  };

  const saveOrderToLocal = async (updatedList) => {
    const currentSegment = activeSegmentRef.current;
    const key = currentSegment === 'apps' ? 'school_apps_order' : 'school_teachers_order';
    const cacheKey = currentSegment === 'apps' ? 'school_apps_cache' : 'school_teachers_cache';
    const orderIds = updatedList.map(item => String(item.ID));
    const orderStr = JSON.stringify(orderIds);
    localStorage.setItem(key, orderStr);
    localStorage.removeItem(cacheKey);
    console.log(`Order for ${currentSegment} saved locally`);
    
    // Save to remote server so all apps sync
    if (API_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
      try {
        await fetch(API_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'updateConfig',
            data: { key: key, value: orderStr }
          })
        });
        console.log(`Order for ${currentSegment} synced to server`);
      } catch (err) {
        console.error('Failed to sync order:', err);
      }
    }
  };

  const handleDragEnd = () => {
    const currentSegment = activeSegmentRef.current;
    const list = currentSegment === 'apps' ? apps : teachers;
    saveOrderToLocal(list);
    setDragIndex(null); 
    setOverIndex(null);
    dragIndexRef.current = null;
  };

  // Touch drag
  const handleTouchStart = (e, idx) => {
    // Start drag
    touchStartY.current = e.touches[0].clientY;
    touchItemRef.current = idx;
    setDragIndex(idx);
    dragIndexRef.current = idx;
  };

  const handleTouchMove = (e) => {
    const currentDragIdx = dragIndexRef.current;
    if (currentDragIdx === null || !listRef.current) return;
    
    // Prevent scrolling while dragging
    if (e.cancelable) e.preventDefault();
    
    const touch = e.touches[0];
    const items = listRef.current.querySelectorAll('.drag-item');
    
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        if (currentDragIdx !== i) {
          const currentSegment = activeSegmentRef.current;
          const setter = currentSegment === 'apps' ? setApps : setTeachers;
          setter(prevList => {
            const updated = [...prevList];
            if (currentDragIdx >= 0 && currentDragIdx < updated.length && i >= 0 && i < updated.length) {
              const [moved] = updated.splice(currentDragIdx, 1);
              updated.splice(i, 0, moved);
            }
            return updated;
          });
          setDragIndex(i);
          dragIndexRef.current = i;
        }
        setOverIndex(i);
        break;
      }
    }
  };

  const handleTouchEnd = () => { 
    const currentSegment = activeSegmentRef.current;
    const list = currentSegment === 'apps' ? apps : teachers;
    saveOrderToLocal(list);
    setDragIndex(null); 
    setOverIndex(null); 
    dragIndexRef.current = null;
    touchItemRef.current = null; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (API_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") { Swal.fire('ข้อผิดพลาด', 'กรุณาตั้งค่า API URL ใน config.js ก่อนทำการบันทึก', 'error'); return; }
    if (actionType === 'delete') {
      const confirm = await Swal.fire({ title: 'ยืนยันการลบ?', text: "คุณต้องการลบข้อมูลนี้ใช่หรือไม่!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'ลบเลย!', cancelButtonText: 'ยกเลิก' });
      if (!confirm.isConfirmed) return;
    }
    setIsSubmitting(true);
    let finalFormData = { ...formData };
    if (!selectedFile && actionType === 'update') {
      if (finalFormData.IconURL?.startsWith('data:image')) delete finalFormData.IconURL;
      if (finalFormData.ImageURL?.startsWith('data:image')) delete finalFormData.ImageURL;
    }
    try {
      if (selectedFile && actionType !== 'delete') {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let w = img.width, h = img.height;
              if (w > 200) { h *= 200 / w; w = 200; }
              if (h > 200) { w *= 200 / h; h = 200; }
              canvas.width = w; canvas.height = h;
              canvas.getContext('2d').drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve(event.target.result);
            img.src = event.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        const uploadRes = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'uploadImage', base64: base64Data, mimeType: selectedFile.type, fileName: selectedFile.name }) });
        const uploadResult = await uploadRes.json();
        if (uploadResult.status === 'success') {
          if (activeSegment === 'apps') finalFormData.IconURL = uploadResult.url;
          else finalFormData.ImageURL = uploadResult.url;
        } else throw new Error(uploadResult.message || "อัพโหลดรูปล้มเหลว");
      }
      await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: actionType, sheetName: activeSegment === 'apps' ? 'AppHub' : 'Teachers', data: finalFormData }) });
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลและส่งไปยังระบบแล้ว', 'success');
      setFormData({}); setSelectedFile(null); setActionType('create'); setShowForm(false);
      setTimeout(() => fetchAllData(), 1500);
    } catch (err) { Swal.fire('ข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error'); }
    finally { setIsSubmitting(false); }
  };

  // === RENDER: Settings Login ===
  if (!isAuthenticated) {
    return (
      <div className="settings-login-wrap">
        <div className="settings-login-bg"></div>
        <div className={`login-card-v2 settings-login-card ${shake ? 'shake-anim' : ''}`}>
          <div className="login-logo-wrap">
            <div className="login-logo-circle"><SettingsIcon size={32} color="#6366f1" /></div>
          </div>
          <h2 className="login-title-v2" style={{fontSize:'1.3rem'}}>เข้าสู่ระบบตั้งค่า</h2>
          <p className="login-subtitle-v2">ระบุรหัสผ่านแอดมินเพื่อเข้าสู่การตั้งค่า</p>
          
          <form onSubmit={handleAdminAuth} className="login-form-v2" style={{width: '100%'}}>
            <div className="input-group-v2">
              <input
                type="password"
                className="glass-input-v2"
                style={{background: 'rgba(99, 102, 241, 0.05)', color: '#1f2937', borderColor: 'rgba(99, 102, 241, 0.2)'}}
                placeholder="รหัสผ่านแอดมิน"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="glass-btn-v2" style={{marginTop: '15px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
              <LogIn size={20} />
              <span>เข้าสู่ระบบ</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentDataList = activeSegment === 'apps' ? apps : teachers;

  // === RENDER: Main Settings ===
  return (
    <div className="page-container settings-page-bg" style={{margin:0,maxWidth:'none',minHeight:'100%',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 className="page-title" style={{margin:0,color:'#1f2937'}}>ตั้งค่าระบบ (Admin)</h2>
        <button onClick={() => {setActionType('create');setFormData({});setSelectedFile(null);setShowForm(true);}}
          style={{background:'#10b981',color:'white',border:'none',borderRadius:'50%',width:'42px',height:'42px',fontSize:'1.8rem',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 10px rgba(16,185,129,0.4)',cursor:'pointer'}}
          title="เพิ่มข้อมูลใหม่">+</button>
      </div>

      {/* Banner Setting */}
      <div style={{background:'white',borderRadius:'12px',padding:'16px',marginBottom:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <h3 style={{margin:'0 0 12px 0',fontSize:'1rem',color:'#1f2937'}}>🖼️ รูปแบนเนอร์หน้าหลัก</h3>
        {bannerUrl && (
          <div style={{marginBottom:'10px',borderRadius:'8px',overflow:'hidden',background:'white',border:'1px solid #e2e8f0'}}>
            {bannerUrl.includes('/view?embed') || bannerUrl.includes('canva.com') ? (
              <div style={{position:'relative',width:'100%',paddingTop:'25%'}}>
                <iframe src={bannerUrl} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}} title="Banner Preview"></iframe>
              </div>
            ) : (
              <img src={bannerUrl} alt="Preview" style={{width:'100%',height:'80px',objectFit:'cover'}} onError={(e)=>{e.currentTarget.style.display='none';}} />
            )}
          </div>
        )}
        <input type="text" className="form-input" placeholder="วาง URL รูปภาพแบนเนอร์" value={bannerUrl} onChange={(e)=>setBannerUrl(e.target.value)} style={{marginBottom:'8px'}} />
        <button onClick={handleBannerSave} style={{width:'100%',padding:'10px',borderRadius:'8px',border:'none',background:'#8b5cf6',color:'white',fontWeight:600,cursor:'pointer'}}>บันทึกแบนเนอร์</button>
      </div>

      {/* Segment Tabs */}
      <div style={{display:'flex',gap:'10px',marginBottom:'20px'}}>
        <button onClick={()=>{setActiveSegment('apps');setFormData({});setSelectedFile(null);setActionType('create');setShowForm(false);}}
          style={{flex:1,padding:'12px 10px',borderRadius:'12px',border:'none',background:activeSegment==='apps'?'#3b82f6':'#e2e8f0',color:activeSegment==='apps'?'white':'#475569',fontWeight:600}}>
          จัดการรวมระบบ
        </button>
        <button onClick={()=>{setActiveSegment('teachers');setFormData({});setSelectedFile(null);setActionType('create');setShowForm(false);}}
          style={{flex:1,padding:'12px 10px',borderRadius:'12px',border:'none',background:activeSegment==='teachers'?'#3b82f6':'#e2e8f0',color:activeSegment==='teachers'?'white':'#475569',fontWeight:600}}>
          จัดการบุคลากร
        </button>
      </div>

      {/* App List with Drag Reorder */}
      <div className="settings-form mb-4" style={{maxHeight:'400px',overflowY:'auto',overflowX:'hidden'}}>
        <h3 className="mb-4" style={{borderBottom:'1px solid #e2e8f0',paddingBottom:'10px'}}>
          รายการข้อมูล{activeSegment==='apps'?'แอพ':'ครู'} (ลากที่ ☰ เพื่อเรียงลำดับ / กดที่ชื่อเพื่อแก้ไข)
        </h3>
        {isLoadingData ? (
          <p className="text-center" style={{color:'#6b7280'}}>กำลังโหลดข้อมูล...</p>
        ) : currentDataList.length === 0 ? (
          <p className="text-center" style={{color:'#6b7280'}}>ไม่มีข้อมูลในระบบ</p>
        ) : (
          <div ref={listRef} style={{display:'flex',flexDirection:'column',gap:'10px',width:'100%'}}
            onTouchMove={handleTouchMove}>
            {currentDataList.map((item, idx) => (
              <div key={item.ID||idx}
                className={`drag-item ${dragIndex===idx?'dragging':''} ${overIndex===idx&&dragIndex!==idx?'drag-over':''}`}
                draggable={true}
                onDragStart={()=>handleDragStart(idx)}
                onDragOver={(e)=>handleDragOver(e,idx)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e)=>handleTouchStart(e,idx)}
                onTouchEnd={handleTouchEnd}
                onClick={()=>handleSelectItem(item)}
                style={{
                  display:'flex',alignItems:'center',padding:'12px',
                  border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',
                  backgroundColor:formData.ID===item.ID?'#eff6ff':'white',
                  borderColor:formData.ID===item.ID?'#3b82f6':'#e2e8f0',
                  width:'100%',boxSizing:'border-box',transition:'all 0.2s ease'
                }}>
                <div className="drag-handle" style={{
                  marginRight:'10px', color:'#94a3b8', fontSize:'1.4rem', 
                  cursor:'grab', touchAction:'none', userSelect:'none', 
                  padding:'10px 15px', marginLeft:'-12px', display:'flex', alignItems:'center'
                }}>☰</div>

                <img src={activeSegment==='apps'?item.IconURL:item.ImageURL} alt=""
                  style={{width:'40px',height:'40px',borderRadius:activeSegment==='apps'?'8px':'50%',objectFit:'cover',marginRight:'15px'}}
                  onError={(e)=>{e.currentTarget.onerror=null;e.currentTarget.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23e2e8f0%22/%3E%3C/svg%3E';}}
                />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'0.95rem',wordBreak:'break-word',color:'#1f2937'}}>{activeSegment==='apps'?item.AppName:item.Name}</div>
                  {activeSegment==='teachers' && <div style={{fontSize:'0.8rem',color:'#6b7280'}}>{item.Subject}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Edit/Delete buttons */}
      {formData.ID && !showForm && (
        <div style={{display:'flex',gap:'8px',marginBottom:'15px'}}>
          <button onClick={()=>{setActionType('update');setShowForm(true);}}
            style={{flex:1,padding:'10px',borderRadius:'8px',border:'1px solid #f59e0b',background:'#f59e0b',color:'white',fontWeight:500}}>แก้ไขรายการนี้</button>
          <button onClick={()=>{setActionType('delete');setShowForm(true);}}
            style={{flex:1,padding:'10px',borderRadius:'8px',border:'1px solid #ef4444',background:'#ef4444',color:'white',fontWeight:500}}>ลบรายการนี้</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form className="settings-form" onSubmit={handleSubmit}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #e2e8f0',paddingBottom:'10px',marginBottom:'15px'}}>
            <h3 style={{margin:0}}>ฟอร์ม{actionType==='create'?'เพิ่ม':actionType==='update'?'แก้ไข':'ยืนยันการลบ'}</h3>
            <button type="button" onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#6b7280',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
          </div>
          {(actionType==='update'||actionType==='delete') && (
            <div className="form-group"><label className="form-label">ID รีฟเรนซ์*</label><input type="text" name="ID" className="form-input" value={formData.ID||''} readOnly style={{background:'#f1f5f9'}} /></div>
          )}
          {actionType!=='delete' && activeSegment==='apps' && (<>
            <div className="form-group"><label className="form-label">ชื่อแอปพลิเคชัน</label><input type="text" name="AppName" className="form-input" value={formData.AppName||''} onChange={handleInputChange} required={actionType==='create'} /></div>
            <div className="form-group">
              <label className="form-label">อัพโหลดไอคอน</label>
              <input type="file" accept="image/*" className="form-input" style={{padding:'8px'}} onChange={handleFileChange} />
              <div style={{fontSize:'0.8rem',color:'#6b7280',marginTop:'4px'}}>หรือใช้ URL:</div>
              <input type="text" name="IconURL" className="form-input mt-2"
                value={formData.IconURL?.startsWith('data:image')?'--- รูปภาพถูกอัพโหลดแล้ว ---':(formData.IconURL||'')}
                onChange={(e)=>{if(e.target.value!=='--- รูปภาพถูกอัพโหลดแล้ว ---')handleInputChange(e);}}
                disabled={formData.IconURL?.startsWith('data:image')} placeholder="วาง URL ไอคอน" required={actionType==='create'&&!selectedFile} />
            </div>
            <div className="form-group"><label className="form-label">ลิงก์ปลายทาง (URL)</label><input type="text" name="LinkURL" className="form-input" value={formData.LinkURL||''} onChange={handleInputChange} required={actionType==='create'} /></div>
          </>)}
          {actionType!=='delete' && activeSegment==='teachers' && (<>
            <div className="form-group"><label className="form-label">ชื่อ - นามสกุล</label><input type="text" name="Name" className="form-input" value={formData.Name||''} onChange={handleInputChange} required={actionType==='create'} /></div>
            <div className="form-group">
              <label className="form-label">อัพโหลดรูปภาพ</label>
              <input type="file" accept="image/*" className="form-input" style={{padding:'8px'}} onChange={handleFileChange} />
              <div style={{fontSize:'0.8rem',color:'#6b7280',marginTop:'4px'}}>หรือใช้ URL:</div>
              <input type="text" name="ImageURL" className="form-input mt-2"
                value={formData.ImageURL?.startsWith('data:image')?'--- รูปภาพถูกอัพโหลดแล้ว ---':(formData.ImageURL||'')}
                onChange={(e)=>{if(e.target.value!=='--- รูปภาพถูกอัพโหลดแล้ว ---')handleInputChange(e);}}
                disabled={formData.ImageURL?.startsWith('data:image')} placeholder="https://..." required={actionType==='create'&&!selectedFile} />
            </div>
            <div className="form-group"><label className="form-label">วิชาที่สอน / ตำแหน่ง</label><input type="text" name="Subject" className="form-input" value={formData.Subject||''} onChange={handleInputChange} required={actionType==='create'} /></div>
            <div className="form-group"><label className="form-label">เบอร์โทรศัพท์ที่ 1</label><input type="text" name="Phone1" className="form-input" value={formData.Phone1||''} onChange={handleInputChange} /></div>
            <div className="form-group"><label className="form-label">เบอร์โทรศัพท์ที่ 2</label><input type="text" name="Phone2" className="form-input" value={formData.Phone2||''} onChange={handleInputChange} /></div>
          </>)}
          <button type="submit" className="btn-primary mt-4" disabled={isSubmitting}
            style={{background:actionType==='delete'?'#ef4444':actionType==='update'?'#f59e0b':'#10b981'}}>
            {isSubmitting?'กำลังดำเนินการ...':actionType==='create'?'บันทึกข้อมูลใหม่':actionType==='update'?'บันทึกการแก้ไข':'ยืนยันการลบทิ้ง'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Settings;
