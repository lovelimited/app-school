// Google Sheets API Service
// Handles data fetching, CRUD operations, and caching

const SHEET_ID = '1fPfut--QcBx6ApjMIvnFxYCml8hkzat4v8HgqtF1zL0';
const CACHE_KEY = 'students_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_URL_KEY = 'apps_script_url';
const ADMIN_PASSWORD_KEY = 'admin_session';
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycby15KQWHGUqSuMwFneT2rofx3j_BlppkT4wLjKPNYJ4VCbR5074mSj1vjihvV4gbrPIDg/exec';

// ============================================
// DEMO DATA (used when API not configured)
// ============================================
const DEMO_DATA = [
  { student_id: '65001', national_id: '1-1001-00100-00-1', prefix: 'เด็กชาย', first_name: 'สมชาย', last_name: 'รักเรียน', nickname: 'ชาย', class_level: 'ม.1', address: '123 หมู่ 4 ถ.สุขุมวิท', phone: '081-234-5678', parent_phone: '02-123-4567', photo_url: '', row: 2, gender: 'ชาย', birth_date: '2012-05-15', latest_weight_kg: 45.5, latest_height_cm: 155, latest_bmi: 18.9, latest_bmi_level: 'ปกติ', มา_ท1: 18, ขาด_ท1: 1, ลา_ท1: 1, สาย_ท1: 0, มา_ท2: 15, ขาด_ท2: 0, ลา_ท2: 0, สาย_ท2: 1 },
  { student_id: '65002', national_id: '1-1001-00100-00-2', prefix: 'เด็กหญิง', first_name: 'สมหญิง', last_name: 'ใจดี', nickname: 'หญิง', class_level: 'ม.1', address: '456 หมู่ 2 ถ.พหลโยธิน', phone: '082-345-6789', parent_phone: '02-234-5678', photo_url: '', row: 3, gender: 'หญิง', birth_date: '2012-08-20', latest_weight_kg: 42.0, latest_height_cm: 152, latest_bmi: 18.2, latest_bmi_level: 'ปกติ', มา_ท1: 20, ขาด_ท1: 0, ลา_ท1: 0, สาย_ท1: 0, มา_ท2: 14, ขาด_ท2: 1, ลา_ท2: 1, สาย_ท2: 0 },
  { student_id: '65011', national_id: '1-1001-00100-01-1', prefix: 'นาย', first_name: 'ภาคภูมิ', last_name: 'รักชาติ', nickname: 'ภูมิ', class_level: 'ม.6', address: '555 หมู่ 9 ถ.บางนา', phone: '091-234-5678', parent_phone: '02-123-4567', photo_url: '', row: 12, gender: 'ชาย', birth_date: '2007-03-10', latest_weight_kg: 65.0, latest_height_cm: 175, latest_bmi: 21.2, latest_bmi_level: 'รวมส่วน', มา_ท1: 19, ขาด_ท1: 0, ลา_ท1: 1, สาย_ท1: 0, มา_ท2: 16, ขาด_ท2: 0, ลา_ท2: 0, สาย_ท2: 0 },
  { student_id: '65012', national_id: '1-1001-00100-01-2', prefix: 'นางสาว', first_name: 'ดวงใจ', last_name: 'สุขสันต์', nickname: 'ดวง', class_level: 'ม.6', address: '666 ซอย 15 ถ.อ่อนนุช', phone: '092-345-6789', parent_phone: '02-234-5678', photo_url: '', row: 13, gender: 'หญิง', birth_date: '2007-11-25', latest_weight_kg: 50.0, latest_height_cm: 160, latest_bmi: 19.5, latest_bmi_level: 'ปกติ', มา_ท1: 20, ขาด_ท1: 0, ลา_ท1: 0, สาย_ท1: 0, มา_ท2: 15, ขาด_ท2: 0, ลา_ท2: 1, สาย_ท2: 0 },
];

// ============================================
// API URL MANAGEMENT
// ============================================
export function getApiUrl() {
  return localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

export function setApiUrl(url) {
  localStorage.setItem(API_URL_KEY, url);
}

export function isApiConfigured() {
  return !!getApiUrl();
}

// ============================================
// CACHING
// ============================================
function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // localStorage full - ignore
  }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ============================================
// FETCH STUDENTS
// ============================================
export async function fetchStudents(forceRefresh = false) {
  // If API not configured, use demo data
  if (!isApiConfigured()) {
    return { data: DEMO_DATA, isDemo: true };
  }

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      // Return cached data immediately, refresh in background
      refreshInBackground();
      return { data: cached, isDemo: false, fromCache: true };
    }
  }

  // Fetch from API
  try {
    const url = `${getApiUrl()}?action=read`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Ensure data is array
    const students = Array.isArray(data) ? data : [];
    setCachedData(students);
    return { data: students, isDemo: false };
  } catch (error) {
    // On error, try cache (even if stale)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return { data, isDemo: false, fromCache: true, stale: true };
      }
    } catch {
      // Return stale cache if available
    }
    
    throw error;
  }
}

async function refreshInBackground() {
  try {
    const url = `${getApiUrl()}?action=read`;
    const response = await fetch(url);
    const data = await response.json();
    if (Array.isArray(data)) {
      setCachedData(data);
    }
  } catch {
    // Silent fail for background refresh
  }
}

// ============================================
// ADMIN AUTH
// ============================================
export async function adminLogin(password) {
  if (!isApiConfigured()) {
    // Demo mode: accept "admin1234"
    if (password === 'admin1234') {
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
      return { success: true };
    }
    return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' };
  }

  try {
    const url = `${getApiUrl()}?action=login&password=${encodeURIComponent(password)}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
}

export function isAdminLoggedIn() {
  return !!sessionStorage.getItem(ADMIN_PASSWORD_KEY);
}

function getAdminPassword() {
  return sessionStorage.getItem(ADMIN_PASSWORD_KEY) || '';
}

// ============================================
// CRUD OPERATIONS
// ============================================
export async function createStudent(studentData) {
  if (!isApiConfigured()) {
    // Demo mode: simulate success
    return { success: true, message: 'เพิ่มนักเรียนสำเร็จ (โหมดทดลอง)' };
  }

  try {
    const params = new URLSearchParams({
      action: 'create',
      password: getAdminPassword(),
      data: JSON.stringify(studentData)
    });
    
    const url = `${getApiUrl()}?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      clearCache();
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateStudent(studentData) {
  if (!isApiConfigured()) {
    return { success: true, message: 'แก้ไขข้อมูลสำเร็จ (โหมดทดลอง)' };
  }

  try {
    const params = new URLSearchParams({
      action: 'update',
      password: getAdminPassword(),
      data: JSON.stringify(studentData)
    });
    
    const url = `${getApiUrl()}?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      clearCache();
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteStudent(row) {
  if (!isApiConfigured()) {
    return { success: true, message: 'ลบนักเรียนสำเร็จ (โหมดทดลอง)' };
  }

  try {
    const params = new URLSearchParams({
      action: 'delete',
      password: getAdminPassword(),
      row: row.toString()
    });
    
    const url = `${getApiUrl()}?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      clearCache();
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// HELPERS
// ============================================
export function groupByGrade(students) {
  const grades = {};
  const levels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  
  levels.forEach(level => {
    grades[level] = [];
  });
  
  students.forEach(student => {
    const level = student.class_level;
    if (grades[level]) {
      grades[level].push(student);
    }
  });
  
  return grades;
}

export function getGradeNumber(classLevel) {
  const match = classLevel?.match(/(\d)/);
  return match ? match[1] : '1';
}

export function getAvatarColor(gradeNum) {
  const colors = {
    '1': '#e91e63',
    '2': '#4caf50',
    '3': '#2196f3',
    '4': '#ff9800',
    '5': '#9c27b0',
    '6': '#ff5722',
  };
  return colors[gradeNum] || '#6366f1';
}

export function getGradeBadgeColor(gradeNum) {
  return getAvatarColor(gradeNum);
}

export function formatPhoneForTel(phone) {
  return phone.replace(/[\s-]/g, '');
}

export function parsePhones(phoneStr) {
  if (!phoneStr || phoneStr === '-') return [];
  
  // Convert to string and trim
  let raw = phoneStr.toString().trim();

  // HEAL: Strip Google Sheets numeric grouping commas (e.g., "9,876,543...")
  // We detect this if comma is followed by exactly 3 digits repeatedly
  if (raw.includes(',') && /^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(raw)) {
    raw = raw.replace(/,/g, '');
  }
  
  // Handle scientific notation or large numbers
  if (raw.includes('E') || raw.includes('e')) {
    try {
      raw = BigInt(raw.replace('+', '')).toString();
    } catch {
      console.warn('Failed to parse phone number as BigInt:', raw);
    }
  }

  // Remove trailing .0 from Google Sheets numbers if any
  raw = raw.replace(/\.0$/, '');

  // Smart Detection: If string is very long and has no commas (or we just stripped them), 
  // it's likely multiple numbers merged (e.g., 08123456780987654321)
  if (raw.length >= 18 && !raw.includes(',')) {
    // 19-digit case: likely two 10-digit numbers but first '0' was dropped by Google Sheets
    // We split as 9 digits + 10 digits to correctly catch the second '0'
    if (raw.length === 19 && !raw.startsWith('0')) {
      raw = raw.replace(/^([89][0-9]{8})([0][0-9]{9})$/, '$1,$2');
    }
    
    // Fallback/Generic: Basic regex to find two Thai mobile patterns
    if (!raw.includes(',')) {
      raw = raw.replace(/([089][0-9]{8,9})([089][0-9]{8,9})/, '$1,$2');
    }
  }

  return raw.split(',').map(p => {
    let cleaned = p.trim();
    // Auto-prepend 0 if it's a 9 or 8 digit number missing the leading zero
    if ((cleaned.length === 9 || cleaned.length === 8) && !cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    return cleaned;
  }).filter(Boolean);
}

export function processImageUrl(url) {
  if (!url) return '';
  // Handle Google Drive /file/d/ID/view links
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w400`;
  }
  // Handle Google Drive uc?id=ID links
  const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com/uc') && ucMatch) {
    return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w400`;
  }
  return url;
}

export function formatDate(dateVal) {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateVal;
  }
}

export function getBmiLevel(bmi) {
  const b = parseFloat(bmi);
  if (isNaN(b)) return 'ไม่ระบุ';
  if (b < 18.5) return 'ผอม';
  if (b < 23) return 'ปกติ';
  if (b < 25) return 'รวมส่วน';
  if (b < 30) return 'เริ่มอ้วน';
  return 'อ้วน';
}
