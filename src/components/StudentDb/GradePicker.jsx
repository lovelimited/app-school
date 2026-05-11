import React from 'react';
import { getGradeNumber } from '../../services/studentApi';
import { BookOpen, GraduationCap, Award, Microscope, Palette, Compass } from 'lucide-react';

const GRADE_INFO = [
  { level: 'ม.1', icon: BookOpen, label: 'มัธยมศึกษาปีที่ 1' },
  { level: 'ม.2', icon: Compass, label: 'มัธยมศึกษาปีที่ 2' },
  { level: 'ม.3', icon: GraduationCap, label: 'มัธยมศึกษาปีที่ 3' },
  { level: 'ม.4', icon: Microscope, label: 'มัธยมศึกษาปีที่ 4' },
  { level: 'ม.5', icon: Palette, label: 'มัธยมศึกษาปีที่ 5' },
  { level: 'ม.6', icon: Award, label: 'มัธยมศึกษาปีที่ 6' },
];

const GRADE_GRADIENTS = {
  '1': 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
  '2': 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  '3': 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
  '4': 'linear-gradient(135deg, #fff8e1, #ffecb3)',
  '5': 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
  '6': 'linear-gradient(135deg, #fbe9e7, #ffccbc)',
};

const GRADE_COLORS = {
  '1': '#e91e63',
  '2': '#4caf50',
  '3': '#2196f3',
  '4': '#ff9800',
  '5': '#9c27b0',
  '6': '#ff5722',
};

export default function GradePicker({ gradeGroups, onSelectGrade }) {
  return (
    <div className="animate-fade-in-up pb-8">
      {/* Grade Grid */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        {GRADE_INFO.map((item) => {
          const { level, icon: GradeIcon } = item;
          const count = gradeGroups[level]?.length || 0;
          const gradeNum = getGradeNumber(level);
          
          return (
            <button
              key={level}
              className="grade-circle relative overflow-hidden rounded-[24px] py-10 px-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:-translate-y-1.5 focus:outline-none focus:ring-4 focus:ring-indigo-50 active:scale-95 border border-white/50"
              style={{
                background: GRADE_GRADIENTS[gradeNum],
                color: GRADE_COLORS[gradeNum],
              }}
              onClick={() => onSelectGrade(level)}
              id={`grade-card-${gradeNum}`}
            >
              <div className="bg-white/40 p-3.5 rounded-2xl mb-3 shadow-sm backdrop-blur-sm">
                <GradeIcon size={32} strokeWidth={2} />
              </div>
              <div className="text-[26px] font-black tracking-tight mb-0.5 relative z-10">{level}</div>
              <div className="text-xs font-bold opacity-75 relative z-10 bg-black/5 px-3 py-1 rounded-full mt-1.5">{count}คน</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
