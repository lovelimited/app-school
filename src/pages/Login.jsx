import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { School, Settings as SettingsIcon, LogIn } from 'lucide-react';

function Login({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [shake, setShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passcode === 'ktw118') {
      setIsSubmitting(true);
      localStorage.setItem('school_app_auth', 'true');
      
      Swal.fire({
        title: 'ยินดีต้อนรับ',
        text: 'เข้าสู่ระบบสำเร็จ',
        icon: 'success',
        confirmButtonColor: '#6366f1',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        onLogin();
      });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      Swal.fire({
        title: 'รหัสผิดพลาด',
        text: 'กรุณากรอกรหัสผ่านอีกครั้ง',
        icon: 'error',
        confirmButtonColor: '#6366f1'
      });
      setPasscode('');
    }
  };

  // Initialize particles once
  const [particles] = useState(() => {
    return [...Array(12)].map((_, i) => ({
      id: i,
      delay: `${Math.random() * 6}s`,
      duration: `${8 + Math.random() * 12}s`,
      xStart: `${Math.random() * 100}%`,
      size: `${4 + Math.random() * 8}px`,
      opacity: 0.15 + Math.random() * 0.25,
    }));
  });

  return (
    <div className="login-page-v2">
      {/* Animated gradient background */}
      <div className="login-bg-gradient"></div>

      {/* Floating particles */}
      <div className="login-particles">
        {particles.map((p) => (
          <div key={p.id} className="particle" style={{
            '--delay': p.delay,
            '--duration': p.duration,
            '--x-start': p.xStart,
            '--size': p.size,
            '--opacity': p.opacity,
          }}></div>
        ))}
      </div>

      {/* Main Card */}
      <div className={`login-card-v2 ${shake ? 'shake-anim' : ''} ${isSubmitting ? 'success-anim' : ''}`}>
        <div className="login-logo-wrap">
          <div className="login-logo-circle">
            <School size={36} color="white" />
          </div>
          <div className="login-logo-glow"></div>
        </div>

        <h1 className="login-title-v2">แอพโรงเรียนวัดครึ่งใต้</h1>
        <p className="login-subtitle-v2">ระบุรหัสผ่านเพื่อเข้าใช้งาน</p>

        <form onSubmit={handleSubmit} className="login-form-v2">
          <div className="input-group-v2">
            <input
              type="password"
              className="glass-input-v2"
              placeholder="รหัสผ่านเข้าใช้งาน"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              autoFocus
            />
            <div className="input-glow"></div>
          </div>
          
          <button type="submit" className="glass-btn-v2" disabled={isSubmitting}>
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : (
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                <LogIn size={20} />
                <span>เข้าสู่ระบบ</span>
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Credits */}
      <div className="login-credits-v2">
        <p>จัดทำโดย: นายกฤตพจน์ แก้วกา (ครูเอ๋)</p>
        <p>แอพโรงเรียนวัดครึ่งใต้</p>
      </div>
    </div>
  );
}

export default Login;
