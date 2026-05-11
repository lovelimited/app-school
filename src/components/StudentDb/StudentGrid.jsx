import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { getGradeNumber, getAvatarColor, processImageUrl } from '../../services/studentApi';

export default function StudentGrid({ students, grade, isAdmin, onSelectStudent, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  
  const gradeNum = getGradeNumber(grade);
  const avatarColor = getAvatarColor(gradeNum);
  
  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s => 
      `${s.prefix}${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.student_id?.toString().includes(q)
    );
  }, [students, search]);
  
  const handleDelete = (e, student) => {
    e.stopPropagation();
    onDelete(student);
  };
  
  const handleEdit = (e, student) => {
    e.stopPropagation();
    onEdit(student);
  };
  
  const getInitials = (student) => {
    const first = student.first_name?.[0] || '';
    const last = student.last_name?.[0] || '';
    return `${first}${last}`;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Search Bar */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400 pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="ค้นหาชื่อหรือเลขประจำตัว..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="search-input"
          className="w-full py-3 pl-11 pr-4 bg-white border-2 border-transparent rounded-xl shadow-sm text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 focus:border-accent-light focus:shadow-md focus:ring-2 focus:ring-indigo-100"
        />
      </div>
      
      {/* Student Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-sm">
              {search ? 'ไม่พบนักเรียนที่ค้นหา' : 'ยังไม่มีนักเรียนในชั้นนี้'}
            </div>
          </div>
        )}
        
        {filtered.map((student, index) => (
          <div
            key={student.student_id || index}
            className="group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-white/50 animate-fade-in-up"
            onClick={() => onSelectStudent(student)}
            id={`student-card-${student.student_id}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Admin controls — TOP RIGHT */}
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-white/50 backdrop-blur-md rounded-lg p-1 shadow-sm">
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent hover:text-white transition-colors duration-150 text-sm"
                  onClick={(e) => handleEdit(e, student)}
                  title="แก้ไข"
                >
                  ✏️
                </button>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors duration-150 text-sm"
                  onClick={(e) => handleDelete(e, student)}
                  title="ลบ"
                >
                  🗑️
                </button>
              </div>
            )}
            
            {/* Avatar Rectangular */}
            <div className="relative aspect-[3/4] overflow-hidden">
              {student.photo_url ? (
                <img
                  src={processImageUrl(student.photo_url)}
                  alt={student.first_name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-full h-full flex items-center justify-center text-4xl font-bold text-white absolute inset-0"
                style={{ 
                  background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
                  display: student.photo_url ? 'none' : 'flex' 
                }}
              >
                {getInitials(student)}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Info */}
            <div className="p-5">
              <div className="text-xs font-bold text-pink-500 mb-1 font-prompt tracking-wider uppercase">{index + 1}</div>
              <h3 className="text-black font-extrabold text-lg leading-tight font-prompt group-hover:text-accent transition-colors duration-200">
                {student.prefix}{student.first_name} {student.last_name}
              </h3>
              <div className="flex items-center justify-between mt-3 text-gray-400">
                <span className="text-sm font-prompt">{student.nickname ? `(${student.nickname})` : ''}</span>
                <span className="text-xs font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{student.student_id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
