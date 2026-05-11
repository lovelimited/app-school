import React from 'react';
import { User, Phone, ShieldCheck, MapPin, Edit2, Trash2, Smartphone, Users } from 'lucide-react';
import { getGradeNumber, getAvatarColor, parsePhones, processImageUrl, formatDate } from '../../services/studentApi';

export default function StudentDetail({ student, isAdmin, onEdit, onDelete }) {
  if (!student) return null;
  
  const gradeNum = getGradeNumber(student.class_level);
  const avatarColor = getAvatarColor(gradeNum);
  
  const getInitials = () => {
    const first = student.first_name?.[0] || '';
    const last = student.last_name?.[0] || '';
    return `${first}${last}`;
  };
  
  const fullName = `${student.prefix}${student.first_name} ${student.last_name}`;
  const phones = parsePhones(student.phone);
  const parentPhones = parsePhones(student.parent_phone);
  
  const formatPhoneForTel = (phone) => phone.replace(/[\s-]/g, '');
  
  const infoItems = [
    { icon: <User size={18} className="text-gray-500" />, label: 'เลขประจำตัว', value: student.student_id || '-' },
    { icon: <ShieldCheck size={18} className="text-gray-500" />, label: 'เลขบัตรประชาชน', value: student.national_id || '-' },
    { icon: <MapPin size={18} className="text-gray-500" />, label: 'ที่อยู่', value: student.address || '-' },
  ];

  return (
    <div className="animate-fade-in-up pb-8">
      <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] px-5 py-8">
        {/* Header with photo */}
        <div className="text-center mb-8">
          <div className="w-[140px] h-[140px] rounded-[32px] mx-auto mb-6 overflow-hidden shadow-md border-4 border-white bg-gray-50 relative">
            {student.photo_url ? (
              <img
                src={processImageUrl(student.photo_url)}
                alt={fullName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover bg-gray-100"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-bold text-white absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                display: student.photo_url ? 'none' : 'flex'
              }}
            >
              {getInitials()}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{fullName}</h2>
          {student.nickname && (
            <div className="text-lg font-medium text-gray-500 mb-4">({student.nickname})</div>
          )}
          
          <div className="flex justify-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg animate-badge-pulse"
              style={{ background: '#e91e63' }}
            >
              {student.class_level}
            </div>
          </div>
        </div>
        
        {/* Info items */}
        <div className="space-y-6">
          {infoItems.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl text-base shrink-0 bg-gray-50 text-gray-400">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="text-[12px] text-gray-400 font-bold mb-0.5">{item.label}</div>
                <div className="text-[17px] text-gray-800 font-bold break-words">{item.value}</div>
              </div>
            </div>
          ))}
          
          {/* Phone — student */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl text-base shrink-0 bg-gray-50 text-gray-400">
              <Smartphone size={20} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-[12px] text-gray-400 font-bold mb-2">เบอร์โทรนักเรียน</div>
              <div className="flex flex-wrap gap-2">
                {phones.length > 0 ? phones.map((phone, i) => (
                  <a
                    key={i}
                    href={`tel:${formatPhoneForTel(phone)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e0f2fe] text-[#0369a1] rounded-full text-[15px] font-bold shadow-sm"
                  >
                    <Phone size={14} /> {phone}
                  </a>
                )) : <span className="text-gray-400">-</span>}
              </div>
            </div>
          </div>
          
          {/* Phone — parent */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-2xl text-base shrink-0 bg-gray-50 text-gray-400">
              <Users size={20} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="text-[12px] text-gray-400 font-bold mb-2">เบอร์โทรผู้ปกครอง</div>
              <div className="flex flex-wrap gap-2">
                {parentPhones.length > 0 ? parentPhones.map((phone, i) => (
                  <a
                    key={i}
                    href={`tel:${formatPhoneForTel(phone)}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e0f2fe] text-[#0369a1] rounded-full text-[15px] font-bold shadow-sm"
                  >
                    <Phone size={14} /> {phone}
                  </a>
                )) : <span className="text-gray-400">-</span>}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2"></div>

          {/* Health Information */}
          <div>
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>
              <h3 className="font-bold text-gray-800">ข้อมูลสุขภาพ</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/80">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.05em] mb-2 opacity-60">เพศ / วันเกิด</div>
                <div className="space-y-0.5">
                  <div className="text-[17px] font-black text-gray-800 leading-tight">
                    {student.gender || '-'}
                  </div>
                  <div className="text-[14px] font-bold text-gray-500 leading-tight">
                    {formatDate(student.birth_date)}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/80">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.05em] mb-2 opacity-60">นน. / ส่วนสูง</div>
                <div className="space-y-0.5">
                  <div className="text-[17px] font-black text-gray-800 leading-tight">
                    {student.latest_weight_kg ? `${student.latest_weight_kg} kg` : '-'}
                  </div>
                  <div className="text-[17px] font-black text-gray-800 leading-tight">
                    {student.latest_height_cm ? `${student.latest_height_cm} cm` : '-'}
                  </div>
                </div>
              </div>
              {(() => {
                const bmi = student.latest_bmi ? parseFloat(student.latest_bmi).toFixed(1) : '-';
                const bmiLevel = student.latest_bmi_level;
                
                return (
                  <div className="col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100/50 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">ดัชนีมวลกาย (BMI)</div>
                      <div className="text-2xl font-black text-indigo-600">{bmi}</div>
                    </div>
                    {bmiLevel && (
                      <div className={`px-4 py-2 rounded-xl text-sm font-black shadow-sm ${
                        bmiLevel === 'ปกติ' ? 'bg-green-500 text-white' : 
                        bmiLevel?.includes('เกิน') || bmiLevel?.includes('อ้วน') ? 'bg-orange-500 text-white' : 
                        'bg-indigo-500 text-white'
                      }`}>
                        {bmiLevel}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
              <h3 className="font-bold text-gray-800">สรุปการมาเรียน</h3>
            </div>
            <div className="space-y-3">
              {[1, 2].map(term => (
                <div key={term} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    ภาคเรียนที่ {term}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-green-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] font-bold text-green-600 mb-1">มา</div>
                      <div className="text-lg font-black text-green-700">{student[`มา_ท${term}`] ?? '-'}</div>
                    </div>
                    <div className="bg-red-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] font-bold text-red-600 mb-1">ขาด</div>
                      <div className="text-lg font-black text-red-700">{student[`ขาด_ท${term}`] ?? '-'}</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] font-bold text-amber-600 mb-1">ลา</div>
                      <div className="text-lg font-black text-amber-700">{student[`ลา_ท${term}`] ?? '-'}</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl py-2 px-1">
                      <div className="text-[10px] font-bold text-orange-600 mb-1">สาย</div>
                      <div className="text-lg font-black text-orange-700">{student[`สาย_ท${term}`] ?? '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-3 px-6 py-5 bg-gray-50 border-t border-gray-100">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl text-[14px] font-semibold hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
              onClick={() => onEdit(student)}
              id="btn-edit-student"
            >
              <Edit2 size={16} /> แก้ไขข้อมูล
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[14px] font-semibold hover:bg-red-600 hover:text-white active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
              onClick={() => onDelete(student)}
              id="btn-delete-student"
            >
              <Trash2 size={16} /> ลบ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
