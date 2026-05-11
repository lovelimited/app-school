import React from 'react';
import Swal from 'sweetalert2';
import { Settings, Lock, Unlock, ChevronLeft, ShieldCheck } from 'lucide-react';
import { adminLogin, adminLogout, setApiUrl, isApiConfigured } from '../../services/studentApi';

export default function Header({ view, title, isAdmin, onBack, onAdminChange }) {
  
  const handleAdminClick = async () => {
    if (isAdmin) {
      const result = await Swal.fire({
        title: 'ออกจากระบบ',
        text: 'ต้องการออกจากระบบผู้ดูแลหรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'rounded-3xl' }
      });
      
      if (result.isConfirmed) {
        adminLogout();
        onAdminChange(false);
        Swal.fire({
          icon: 'success',
          title: 'ออกจากระบบแล้ว',
          timer: 1500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          customClass: { popup: 'rounded-xl' }
        });
      }
    } else {
      const { value: password } = await Swal.fire({
        title: 'เข้าสู่ระบบผู้ดูแล',
        input: 'password',
        inputLabel: 'กรอกรหัสผ่าน',
        inputPlaceholder: 'รหัสผ่าน...',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'เข้าสู่ระบบ',
        cancelButtonText: 'ยกเลิก',
        inputAttributes: { autocomplete: 'off' },
        customClass: { popup: 'rounded-3xl' }
      });
      
      if (password) {
        const result = await adminLogin(password);
        if (result.success) {
          onAdminChange(true);
          Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ!',
            text: 'คุณสามารถจัดการข้อมูลนักเรียนได้แล้ว',
            timer: 2000,
            showConfirmButton: false,
            position: 'top-end',
            toast: true,
            customClass: { popup: 'rounded-xl' }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            text: 'รหัสผ่านไม่ถูกต้อง',
            confirmButtonColor: '#6366f1',
            customClass: { popup: 'rounded-3xl' }
          });
        }
      }
    }
  };
  
  const handleSettingsClick = async () => {
    const currentUrl = isApiConfigured() ? localStorage.getItem('apps_script_url') : '';
    
    const { value: url } = await Swal.fire({
      title: 'ตั้งค่าเชื่อมต่อ API',
      html: `
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">
          กรอก URL ของ Google Apps Script Web App
        </p>
      `,
      input: 'url',
      inputLabel: 'Apps Script Web App URL',
      inputValue: currentUrl,
      inputPlaceholder: 'https://script.google.com/macros/s/.../exec',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'rounded-3xl' }
    });
    
    if (url !== undefined) {
      setApiUrl(url);
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'เชื่อมต่อ Google Sheets แล้ว กรุณารีเฟรช',
        confirmButtonColor: '#6366f1',
        customClass: { popup: 'rounded-3xl' }
      }).then(() => window.location.reload());
    }
  };

  return (
    <header className="py-4 sticky top-0 z-50 bg-white/70 backdrop-blur-lg -mx-4 px-4 mb-4">
      <div className="flex items-center justify-between">
        {view === 'home' ? (
          <div className="flex flex-col">
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent drop-shadow-sm font-sans tracking-tight leading-tight">
              ฐานข้อมูลนักเรียน
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">เลือกระดับชั้นเพื่อดูข้อมูลนักเรียน</p>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-sm active:scale-95 transition-all duration-200 text-gray-400 hover:text-accent cursor-pointer"
              onClick={onBack}
              id="btn-back"
              aria-label="ย้อนกลับ"
            >
              <ChevronLeft size={20} className="stroke-[2.5px]" />
            </button>
            <span className="text-xl font-bold text-gray-800 whitespace-nowrap">{title}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 text-gray-400 hover:text-accent cursor-pointer"
              onClick={handleSettingsClick}
              id="btn-settings"
              aria-label="ตั้งค่า"
              title="ตั้งค่าเชื่อมต่อ"
            >
              <Settings size={20} className="stroke-[2.5px]" />
            </button>
          )}
          
          <button
            className={`flex items-center justify-center w-10 h-10 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${
              isAdmin
                ? 'bg-gradient-to-tr from-accent to-accent-light text-white shadow-indigo-200'
                : 'bg-white text-gray-400 hover:text-accent'
            }`}
            onClick={handleAdminClick}
            id="btn-admin"
            aria-label={isAdmin ? 'ออกจากระบบ' : 'เข้าสู่ระบบผู้ดูแล'}
            title={isAdmin ? 'ออกจากระบบ' : 'เข้าสู่ระบบผู้ดูแล'}
          >
            {isAdmin ? <Unlock size={18} className="stroke-[2.5px]" /> : <Lock size={18} className="stroke-[2.5px]" />}
          </button>
        </div>
      </div>
    </header>
  );
}
