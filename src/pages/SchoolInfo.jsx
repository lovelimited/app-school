import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import Header from '../components/StudentDb/Header';
import GradePicker from '../components/StudentDb/GradePicker';
import StudentGrid from '../components/StudentDb/StudentGrid';
import StudentDetail from '../components/StudentDb/StudentDetail';
import StudentForm from '../components/StudentDb/StudentForm';
import {
  fetchStudents,
  groupByGrade,
  isAdminLoggedIn,
  isApiConfigured,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../services/studentApi';

export default function SchoolInfo({ onViewChange }) {
  const [view, setView] = useState('home');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn());
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync view change to parent if needed
  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);
  
  // Load data
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const result = await fetchStudents(forceRefresh);
      setStudents(result.data || []);
      setIsDemo(result.isDemo || false);
    } catch (error) {
      console.error('Failed to load students:', error);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดข้อมูลได้',
        text: error.message,
        confirmButtonColor: '#6366f1',
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { loadData(); }, [loadData]);
  
  const gradeGroups = useMemo(() => groupByGrade(students), [students]);
  
  // Navigation
  const handleSelectGrade = (grade) => {
    setSelectedGrade(grade);
    setView('grade');
  };
  
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setView('student');
  };
  
  const handleBack = () => {
    if (view === 'student') {
      setView('grade');
      setSelectedStudent(null);
    } else if (view === 'grade') {
      setView('home');
      setSelectedGrade(null);
    }
  };
  
  // Admin
  const handleAdminChange = (loggedIn) => setIsAdmin(loggedIn);
  
  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowForm(true);
  };
  
  const handleAddNew = () => {
    setEditingStudent(null);
    setShowForm(true);
  };
  
  const handleDelete = async (student) => {
    const fullName = `${student.prefix}${student.first_name} ${student.last_name}`;
    
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      html: `ต้องการลบข้อมูล <strong>${fullName}</strong> หรือไม่?<br/><small style="color:#94a3b8">การลบนี้ไม่สามารถย้อนกลับได้</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: '🗑️ ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const res = await deleteStudent(student.row);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
        
        // Update local state
        if (isDemo) {
          setStudents(prev => prev.filter(s => s.student_id !== student.student_id));
        } else {
          await loadData(true);
        }
        
        // If on detail view, go back
        if (view === 'student') {
          setView('grade');
          setSelectedStudent(null);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: res.error || 'ไม่สามารถลบได้',
          confirmButtonColor: '#6366f1',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message,
        confirmButtonColor: '#6366f1',
      });
    }
  };
  
  const handleFormSave = async (formData) => {
    setSaving(true);
    try {
      const result = editingStudent
        ? await updateStudent(formData)
        : await createStudent(formData);
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: editingStudent ? 'แก้ไขสำเร็จ!' : 'เพิ่มนักเรียนสำเร็จ!',
          text: result.message || '',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
        setShowForm(false);
        setEditingStudent(null);
        
        if (isDemo) {
          if (editingStudent) {
            setStudents(prev => prev.map(s =>
              s.student_id === editingStudent.student_id ? { ...formData, row: s.row } : s
            ));
          } else {
            setStudents(prev => [...prev, { ...formData, row: prev.length + 2 }]);
          }
        } else {
          await loadData(true);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: result.error || 'ไม่สามารถบันทึกได้',
          confirmButtonColor: '#6366f1',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message,
        confirmButtonColor: '#6366f1',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getTitle = () => {
    switch (view) {
      case 'home': return 'ฐานข้อมูลนักเรียน';
      case 'grade': return selectedGrade || '';
      case 'student': return selectedStudent
        ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : '';
      default: return '';
    }
  };

  return (
    <div className="max-w-[420px] mx-auto px-4 pb-28 min-h-screen">
      <Header
        view={view}
        title={getTitle()}
        isAdmin={isAdmin}
        onBack={handleBack}
        onAdminChange={handleAdminChange}
      />
      
      {/* Demo banner */}
      {isDemo && !isApiConfigured() && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl mb-4 text-sm text-orange-800 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          onClick={() => document.getElementById('btn-settings')?.click()}
        >
          <span className="text-xl">🧪</span>
          <div className="flex-1">
            <strong className="block font-semibold">โหมดทดลอง</strong>
            แสดงข้อมูลจำลอง — กดเพื่อเชื่อมต่อ Google Sheets
          </div>
          <span>→</span>
        </div>
      )}
      
      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-11 h-11 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</div>
        </div>
      )}
      
      {/* Content */}
      {!loading && (
        <>
          {view === 'home' && (
            <GradePicker
              gradeGroups={gradeGroups}
              onSelectGrade={handleSelectGrade}
            />
          )}
          
          {view === 'grade' && selectedGrade && (
            <StudentGrid
              students={gradeGroups[selectedGrade] || []}
              grade={selectedGrade}
              isAdmin={isAdmin}
              onSelectStudent={handleSelectStudent}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          
          {view === 'student' && selectedStudent && (
            <StudentDetail
              student={selectedStudent}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBack={handleBack}
            />
          )}
        </>
      )}
      
      {/* FAB — Add Student */}
      {isAdmin && (view === 'grade' || view === 'home') && (
        <button
          className="fixed bottom-[85px] right-6 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-light text-white text-2xl shadow-lg shadow-indigo-300/40 hover:scale-110 hover:rotate-90 hover:shadow-xl hover:shadow-indigo-300/50 active:scale-95 transition-all duration-300 flex items-center justify-center z-50 animate-fab-in cursor-pointer"
          onClick={handleAddNew}
          id="fab-add-student"
          title="เพิ่มนักเรียน"
          aria-label="เพิ่มนักเรียน"
        >
          +
        </button>
      )}
      
      {/* Form Modal */}
      {showForm && (
        <StudentForm
          key={editingStudent ? `edit-${editingStudent.student_id}` : 'new'}
          student={editingStudent}
          onSave={handleFormSave}
          onCancel={() => { setShowForm(false); setEditingStudent(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
