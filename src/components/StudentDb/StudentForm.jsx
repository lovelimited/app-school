import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { parsePhones } from '../../services/studentApi';

const PREFIXES = ['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว'];
const GENDERS = ['ชาย', 'หญิง'];
const CLASS_LEVELS = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

const emptyForm = {
  student_id: '',
  national_id: '',
  prefix: 'เด็กชาย',
  first_name: '',
  last_name: '',
  nickname: '',
  class_level: 'ม.1',
  address: '',
  phone: '',
  parent_phone: '',
  photo_url: '',
};

export default function StudentForm({ student, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => student ? {
    student_id: student.student_id || '',
    national_id: student.national_id || '',
    prefix: student.prefix || 'เด็กชาย',
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    nickname: student.nickname || '',
    class_level: student.class_level || 'ม.1',
    address: student.address || '',
    phone: student.phone || '',
    parent_phone: student.parent_phone || '',
    photo_url: student.photo_url || '',
    row: student.row,
    gender: student.gender || 'ชาย',
    birth_date: student.birth_date || '',
    latest_weight_kg: student.latest_weight_kg || '',
    latest_height_cm: student.latest_height_cm || '',
    latest_bmi: student.latest_bmi || '',
    latest_bmi_level: student.latest_bmi_level || '',
    มา_ท1: student.มา_ท1 || '',
    ขาด_ท1: student.ขาด_ท1 || '',
    ลา_ท1: student.ลา_ท1 || '',
    สาย_ท1: student.สาย_ท1 || '',
    มา_ท2: student.มา_ท2 || '',
    ขาด_ท2: student.ขาด_ท2 || '',
    ลา_ท2: student.ลา_ท2 || '',
    สาย_ท2: student.สาย_ท2 || '',
  } : {
    ...emptyForm,
    gender: 'ชาย',
    birth_date: '',
    latest_weight_kg: '',
    latest_height_cm: '',
    มา_ท1: '', ขาด_ท1: '', ลา_ท1: '', สาย_ท1: '',
    มา_ท2: '', ขาด_ท2: '', ลา_ท2: '', สาย_ท2: '',
  });

  const [phoneArr, setPhoneArr] = useState(() => {
    const phones = student ? parsePhones(student.phone) : [];
    return phones.length > 0 ? phones : [''];
  });

  const [parentPhoneArr, setParentPhoneArr] = useState(() => {
    const phones = student ? parsePhones(student.parent_phone) : [];
    return phones.length > 0 ? phones : [''];
  });
  
  const isEdit = !!student;
  
  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-calculate BMI if weight/height changes
      if (field === 'latest_weight_kg' || field === 'latest_height_cm') {
        const w = parseFloat(field === 'latest_weight_kg' ? value : next.latest_weight_kg);
        const h = parseFloat(field === 'latest_height_cm' ? value : next.latest_height_cm);
        
        if (w && h) {
          const bmi = (w / ((h / 100) ** 2)).toFixed(1);
          next.latest_bmi = bmi;
          // next.latest_bmi_level left for manual/sheet entry
        } else {
          next.latest_bmi = '';
          next.latest_bmi_level = '';
        }
      }
      
      return next;
    });
  };

  const handlePhoneChange = (arr, setArr, index, value) => {
    const nextArr = [...arr];
    // Digits only and limit to 10 chars
    nextArr[index] = value.replace(/[^\d]/g, '').slice(0, 10);
    setArr(nextArr);
  };

  const addField = (arr, setArr) => {
    setArr([...arr, '']);
  };

  const removeField = (arr, setArr, index) => {
    if (arr.length <= 1) {
      setArr(['']);
      return;
    }
    const nextArr = arr.filter((_, i) => i !== index);
    setArr(nextArr);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Smart split any long strings first (to avoid concatenation even if user pastes long string in one field)
    const splitAndFormat = (arr) => {
      const allNumbers = [];
      arr.forEach(n => {
        let val = n.trim();
        if (!val) return;
        
        // If one field has concatenated numbers, split them
        if (val.length >= 18 && !val.includes(',')) {
          val = val.replace(/([089][0-9]{8,9})([089][0-9]{8,9})/, '$1,$2');
        }
        
        val.split(',').forEach(subN => {
          let cleaned = subN.trim();
          if (!cleaned) return;
          // Prepend 0 if missing (9 or 8 digits)
          if ((cleaned.length === 9 || cleaned.length === 8) && !cleaned.startsWith('0')) {
            cleaned = '0' + cleaned;
          }
          allNumbers.push(cleaned);
        });
      });
      return allNumbers.join(',');
    };

    const finalForm = {
      ...form,
      // Prepend ' to force Google Sheets to treat as literal text (preserving leading 0)
      phone: phoneArr.length > 0 ? "'" + splitAndFormat(phoneArr) : "",
      parent_phone: parentPhoneArr.length > 0 ? "'" + splitAndFormat(parentPhoneArr) : ""
    };
    
    onSave(finalForm);
  };
  
  const isValid = form.student_id && form.first_name && form.last_name;

  const inputClass = "w-full px-3.5 py-2.5 border-2 border-gray-100 rounded-xl bg-gray-50/80 text-sm text-gray-800 transition-all duration-200 outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  const renderPhoneInputs = (label, arr, setArr, idPrefix) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="space-y-2">
        {arr.map((val, idx) => (
          <div key={idx} className="flex gap-2">
            <div className="relative flex-1">
              <input
                className={inputClass}
                type="text"
                value={val}
                onChange={e => handlePhoneChange(arr, setArr, idx, e.target.value)}
                placeholder="เช่น 0812345678"
                maxLength={10}
                id={`${idPrefix}-${idx}`}
              />
            </div>
            {arr.length > 1 && (
              <button
                type="button"
                className="w-10 h-10 shrink-0 flex items-center justify-center bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                onClick={() => removeField(arr, setArr, idx)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 text-xs font-bold text-accent hover:text-accent-dark flex items-center gap-1 transition-colors cursor-pointer"
        onClick={() => addField(arr, setArr)}
      >
        <Plus size={14} /> เพิ่มเบอร์โทร
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fade-in" onClick={onCancel}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
          </h2>
          <button
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 hover:bg-red-500 hover:text-white transition-all duration-200 cursor-pointer"
            onClick={onCancel}
            id="btn-close-form"
          >
            ✕
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Row: Student ID + National ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">เลขประจำตัว *</label>
                <input
                  className={inputClass}
                  type="text"
                  value={form.student_id}
                  onChange={e => handleChange('student_id', e.target.value)}
                  placeholder="เช่น 65001"
                  required
                  id="input-student-id"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">เลขบัตรประชาชน</label>
                <input
                  className={inputClass}
                  type="text"
                  value={form.national_id}
                  onChange={e => handleChange('national_id', e.target.value)}
                  placeholder="x-xxxx-xxxxx-xx-x"
                  id="input-national-id"
                />
              </div>
            </div>
            
            {/* Prefix */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">คำนำหน้า</label>
              <select
                className={inputClass}
                value={form.prefix}
                onChange={e => handleChange('prefix', e.target.value)}
                id="select-prefix"
              >
                {PREFIXES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            {/* Row: First + Last Name + Nickname */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">ชื่อ *</label>
                <input
                  className={inputClass}
                  type="text"
                  value={form.first_name}
                  onChange={e => handleChange('first_name', e.target.value)}
                  placeholder="ชื่อ"
                  required
                  id="input-first-name"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">นามสกุล *</label>
                <input
                  className={inputClass}
                  type="text"
                  value={form.last_name}
                  onChange={e => handleChange('last_name', e.target.value)}
                  placeholder="นามสกุล"
                  required
                  id="input-last-name"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">ชื่อเล่น</label>
                <input
                  className={inputClass}
                  type="text"
                  value={form.nickname}
                  onChange={e => handleChange('nickname', e.target.value)}
                  placeholder="ชื่อเล่น"
                  id="input-nickname"
                />
              </div>
            </div>
            
            {/* Class Level */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">ระดับชั้น</label>
              <select
                className={inputClass}
                value={form.class_level}
                onChange={e => handleChange('class_level', e.target.value)}
                id="select-class-level"
              >
                {CLASS_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">ที่อยู่</label>
              <textarea
                className={`${inputClass} resize-y min-h-[70px]`}
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="ที่อยู่..."
                rows={2}
                id="input-address"
              />
            </div>
            
            {/* Phone Student */}
            {renderPhoneInputs('เบอร์โทรนักเรียน', phoneArr, setPhoneArr, 'student-phone')}
            
            {/* Phone Parent */}
            {renderPhoneInputs('เบอร์โทรผู้ปกครอง', parentPhoneArr, setParentPhoneArr, 'parent-phone')}
            
            {/* Photo URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">URL รูปภาพ</label>
              <input
                className={inputClass}
                type="url"
                value={form.photo_url}
                onChange={e => handleChange('photo_url', e.target.value)}
                placeholder="https://..."
                id="input-photo-url"
              />
              <p className="text-xs text-gray-400 mt-1">ลิงก์รูปภาพ (Google Drive, เว็บไซต์, ฯลฯ)</p>
            </div>

            <div className="h-px bg-gray-100 my-2"></div>
            
            {/* Health Section */}
            <div>
              <h3 className="text-[12px] font-bold text-indigo-500 uppercase tracking-wider mb-3">ข้อมูลสุขภาพ</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">เพศ</label>
                  <select
                    className={inputClass}
                    value={form.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">วันเกิด</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={form.birth_date}
                    onChange={e => handleChange('birth_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">น้ำหนัก (กก.)</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.1"
                    value={form.latest_weight_kg}
                    onChange={e => handleChange('latest_weight_kg', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">ส่วนสูง (ซม.)</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.1"
                    value={form.latest_height_cm}
                    onChange={e => handleChange('latest_height_cm', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">ดัชนีมวลกาย (BMI)</div>
                  <div className="text-xl font-black text-indigo-600">{form.latest_bmi || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">ระดับ BMI</div>
                  <div className="text-sm font-bold text-indigo-600">{form.latest_bmi_level || 'ระบุ นน./สส.'}</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-2"></div>

            {/* Attendance Section */}
            <div>
              <h3 className="text-[12px] font-bold text-indigo-500 uppercase tracking-wider mb-3">สรุปการมาเรียน</h3>
              
              {[1, 2].map(term => (
                <div key={term} className="mb-4 last:mb-0">
                  <div className="text-[11px] font-bold text-gray-400 mb-2 px-1">ภาคเรียนที่ {term}</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1 text-center">มา</label>
                      <input
                        className={`${inputClass} !px-2 text-center`}
                        type="number"
                        value={form[`มา_ท${term}`]}
                        onChange={e => handleChange(`มา_ท${term}`, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1 text-center">ขาด</label>
                      <input
                        className={`${inputClass} !px-2 text-center`}
                        type="number"
                        value={form[`ขาด_ท${term}`]}
                        onChange={e => handleChange(`ขาด_ท${term}`, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1 text-center">ลา</label>
                      <input
                        className={`${inputClass} !px-2 text-center`}
                        type="number"
                        value={form[`ลา_ท${term}`]}
                        onChange={e => handleChange(`ลา_ท${term}`, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1 text-center">สาย</label>
                      <input
                        className={`${inputClass} !px-2 text-center`}
                        type="number"
                        value={form[`สาย_ท${term}`]}
                        onChange={e => handleChange(`สาย_ท${term}`, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer Buttons */}
          <div className="flex gap-2.5 px-6 py-4 border-t border-gray-50">
            <button
              type="button"
              className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200 cursor-pointer"
              onClick={onCancel}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-sm cursor-pointer"
              disabled={!isValid || saving}
              id="btn-save-student"
            >
              {saving ? 'กำลังบันทึก...' : (isEdit ? 'บันทึก' : 'เพิ่ม')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
