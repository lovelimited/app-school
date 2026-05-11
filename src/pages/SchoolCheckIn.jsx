import React, { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { API_URL } from '../config';
import './SchoolCheckIn.css';

const SHEET_ID = '1wGyKQwP74B9aUkcankXprRLMyoHsumcHxqIIkGMQjwE';
const STUDENT_SHEET_NAME = 'นักเรียน';
const TEACHER_SHEET_NAME = 'ครู';
const STUDENT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(STUDENT_SHEET_NAME)}`;
const DASHBOARD_CACHE_KEY = 'school_checkin_dashboard_cache_v1';
const REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80';

const COLORS = {
  มา: '#10b981',
  เข้า: '#10b981',
  สาย: '#f59e0b',
  ลา: '#3b82f6',
  ขาด: '#ef4444',
  ไม่ทราบ: '#9ca3af',
};

const getTeacherTodayURL = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const teacherQuery = encodeURIComponent(`SELECT * WHERE C contains '${yyyy}-${mm}-${dd}'`);
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TEACHER_SHEET_NAME)}&tq=${teacherQuery}`;
};

const isTodayStr = (dateStr) => {
  if (!dateStr) return false;

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const yyyyBE = yyyy + 543;
  const cleaned = dateStr.trim();

  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return (
      slashMatch[1].padStart(2, '0') === dd &&
      slashMatch[2].padStart(2, '0') === mm &&
      (parseInt(slashMatch[3], 10) === yyyy || parseInt(slashMatch[3], 10) === yyyyBE)
    );
  }

  const dashMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) {
    return (
      dashMatch[3] === dd &&
      dashMatch[2] === mm &&
      (parseInt(dashMatch[1], 10) === yyyy || parseInt(dashMatch[1], 10) === yyyyBE)
    );
  }

  return false;
};

const getShortName = (fullName) => {
  if (!fullName) return '';

  const prefixes = ['นาย', 'นาง', 'นางสาว', 'สามเณร', 'พระ', 'เด็กชาย', 'เด็กหญิง', 'ด.ช.', 'ด.ญ.', 'Mr.', 'Mrs.', 'Miss'];
  let name = fullName.trim();

  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length).trim();
      break;
    }
  }

  return name.split(' ')[0] || name;
};

const StudentTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">{label}</p>
        {payload.map((item, index) => {
          const percent = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <p key={index} style={{ color: item.fill, margin: '2px 0', fontSize: '0.9rem' }}>
              {item.name}: {item.value} คน ({percent}%)
            </p>
          );
        })}
        <p style={{ fontWeight: 700, marginTop: 4, fontSize: '0.9rem' }}>รวม {total} คน</p>
      </div>
    );
  }

  return null;
};

const TeacherTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">{`${data.name} : ${data.value} คน`}</p>
        <p className="tooltip-desc">{data.people.join(', ')}</p>
      </div>
    );
  }

  return null;
};

const renderCustomBarLabel = ({ x, y, width, height, value }) => {
  if (!value) return null;

  return (
    <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dy={4} fontSize={12} fontWeight="bold">
      {value}
    </text>
  );
};

const cleanGoogleUrl = (url) => {
  if (!url) return '';
  return url.replace(/\/macros\/u\/\d+\//, '/macros/');
};

const parseCsvRows = (csvText) => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return Array.isArray(result.data) ? result.data : [];
};

const fetchCsvRows = async (url, signal) => {
  const response = await fetch(url, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const csvText = await response.text();
  return parseCsvRows(csvText);
};

const readDashboardCache = () => {
  try {
    const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const writeDashboardCache = (studentRows, teacherRows) => {
  try {
    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({
        studentRows,
        teacherRows,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // ignore cache failures
  }
};

const buildStudentStats = (studentRows) => {
  const levels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  const stats = levels.map((level) => ({ level, มา: 0, สาย: 0, ลา: 0, ขาด: 0 }));

  studentRows.forEach((row) => {
    if (!row.level && !row.status) return;

    const dateField = row.timestamp || row.date || '';
    if (!isTodayStr(dateField)) return;

    const levelStats = stats.find((item) => item.level === row.level?.trim());
    let status = row.status?.trim() || 'ขาด';
    if (status === 'เข้า') status = 'มา';

    if (levelStats) {
      if (levelStats[status] !== undefined) levelStats[status]++;
      else levelStats.ขาด++;
    }
  });

  return stats;
};

const buildTeacherStats = (teacherRows) => {
  const statusMap = { มา: [], สาย: [], ลา: [], ขาด: [] };

  teacherRows.forEach((row) => {
    const nameRaw = row['ชื่อ'] || row.ชื่อ || '';
    if (!nameRaw) return;

    let status = (row['สถานะ'] || row.สถานะ || 'ขาด').trim();
    if (status === 'เข้า') status = 'มา';
    if (!statusMap[status]) statusMap[status] = [];

    statusMap[status].push(getShortName(nameRaw));
  });

  return Object.keys(statusMap)
    .filter((status) => statusMap[status].length > 0)
    .map((status) => ({
      name: status,
      value: statusMap[status].length,
      people: statusMap[status],
    }));
};

export default function SchoolCheckIn() {
  const initialCacheRef = useRef(readDashboardCache());
  const activeRequestRef = useRef(null);
  const initialCache = initialCacheRef.current;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentData, setStudentData] = useState(() => initialCache?.studentRows || []);
  const [teacherData, setTeacherData] = useState(() => initialCache?.teacherRows || []);
  const [loading, setLoading] = useState(() => !initialCache);
  const [loadNotice, setLoadNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => initialCache?.updatedAt || '');
  const [bannerUrl, setBannerUrl] = useState(() => localStorage.getItem('school_banner_url') || DEFAULT_BANNER);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      if (!API_URL || API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        setShowBanner(true);
        return;
      }

      try {
        const response = await fetch(`${API_URL}?action=getConfig`);
        const result = await response.json();

        if (result.status === 'success' && result.data.dashboard_banner_url) {
          const nextUrl = result.data.dashboard_banner_url;
          const cachedUrl = localStorage.getItem('school_banner_url');

          if (nextUrl !== cachedUrl) {
            setBannerUrl(nextUrl);
            localStorage.setItem('school_banner_url', nextUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching banner:', error);
      }
    };

    fetchBanner();
  }, []);

  useEffect(() => {
    if (!loading) {
      const wait = window.requestIdleCallback
        ? window.requestIdleCallback(() => setShowBanner(true))
        : setTimeout(() => setShowBanner(true), 300);

      return () => {
        if (window.cancelIdleCallback) window.cancelIdleCallback(wait);
        else clearTimeout(wait);
      };
    }
  }, [loading]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setLoadNotice('');

      const teacherUrl = getTeacherTodayURL();
      const requestController = new AbortController();
      const timeoutId = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);
      activeRequestRef.current = requestController;

      try {
        const [studentRows, teacherRows] = await Promise.all([
          fetchCsvRows(STUDENT_CSV_URL, requestController.signal),
          fetchCsvRows(teacherUrl, requestController.signal),
        ]);

        if (!isMounted) return;

        const nextStudentData = buildStudentStats(studentRows);
        const nextTeacherData = buildTeacherStats(teacherRows);

        setStudentData(nextStudentData);
        setTeacherData(nextTeacherData);
        setLastUpdated(new Date().toISOString());
        writeDashboardCache(nextStudentData, nextTeacherData);
      } catch (error) {
        if (!isMounted || error.name === 'AbortError') return;

        const cached = readDashboardCache();
        if (cached) {
          setStudentData(cached.studentRows || []);
          setTeacherData(cached.teacherRows || []);
          setLastUpdated(cached.updatedAt || '');
          setLoadNotice('ไม่สามารถเชื่อมต่อ Google Sheets ได้ ตอนนี้กำลังแสดงข้อมูลล่าสุดที่บันทึกไว้');
        } else {
          setStudentData([]);
          setTeacherData([]);
          setLoadNotice('ไม่สามารถเชื่อมต่อ Google Sheets ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือ DNS แล้วลองใหม่อีกครั้ง');
        }
      } finally {
        clearTimeout(timeoutId);
        activeRequestRef.current = null;
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      activeRequestRef.current?.abort();
    };
  }, []);

  const formatDate = (date) =>
    date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (date) =>
    date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatLastUpdated = (isoDate) => {
    if (!isoDate) return '';

    try {
      return new Date(isoDate).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const maxStudentCount = Math.max(...studentData.map((item) => item.มา + item.สาย + item.ลา + item.ขาด), 1);
  const hasStudentData = studentData.some((item) => item.มา + item.สาย + item.ลา + item.ขาด > 0);
  const hasTeacherData = teacherData.length > 0;

  return (
    <div className="dashboard-container">
      <div className="clock-header">
        <h2 className="clock-date">{formatDate(currentTime)}</h2>
        <h1 className="clock-time">{formatTime(currentTime)}</h1>
      </div>

      <div className="dashboard-content">
        {loadNotice && (
          <div className="dashboard-notice">
            <p>{loadNotice}</p>
            {lastUpdated && <span>อัปเดตล่าสุด: {formatLastUpdated(lastUpdated)}</span>}
          </div>
        )}

        <div className="banner-container" style={{ background: showBanner ? 'white' : '#f8fafc', position: 'relative' }}>
          {!showBanner ? (
            <div className="banner-skeleton" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-spinner-small"></div>
              <span style={{ marginLeft: '10px', color: '#94a3b8', fontSize: '0.85rem' }}>เตรียมแบนเนอร์...</span>
            </div>
          ) : (
            <>
              {bannerUrl.includes('/view?embed') || bannerUrl.includes('canva.com') ? (
                <div className="banner-iframe-wrapper">
                  <iframe
                    src={bannerUrl}
                    loading="lazy"
                    title="School Banner"
                    allow="fullscreen"
                    className="dashboard-banner-iframe"
                  ></iframe>
                </div>
              ) : (
                <img
                  src={bannerUrl}
                  alt="School Banner"
                  className="dashboard-banner"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_BANNER;
                  }}
                />
              )}
            </>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">กำลังโหลดข้อมูลล่าสุด...</p>
          </div>
        ) : (
          <>
            <div className="chart-card">
              <h3 className="chart-title student-title">สถิตินักเรียนวันนี้</h3>
              {hasStudentData ? (
                <div className="chart-wrapper student-wrapper">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart layout="vertical" data={studentData} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
                      <XAxis type="number" domain={[0, maxStudentCount]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="level" type="category" width={40} tick={{ fontSize: 13, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<StudentTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                      <Bar dataKey="มา" stackId="a" fill={COLORS.มา} isAnimationActive={false}>
                        <LabelList dataKey="มา" content={renderCustomBarLabel} />
                      </Bar>
                      <Bar dataKey="สาย" stackId="a" fill={COLORS.สาย} isAnimationActive={false}>
                        <LabelList dataKey="สาย" content={renderCustomBarLabel} />
                      </Bar>
                      <Bar dataKey="ลา" stackId="a" fill={COLORS.ลา} isAnimationActive={false}>
                        <LabelList dataKey="ลา" content={renderCustomBarLabel} />
                      </Bar>
                      <Bar dataKey="ขาด" stackId="a" fill={COLORS.ขาด} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                        <LabelList dataKey="ขาด" content={renderCustomBarLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="no-data-msg">ยังไม่มีข้อมูลนักเรียนสำหรับวันนี้</div>
              )}

              <a
                href={cleanGoogleUrl('https://script.google.com/macros/s/AKfycbxoM0CeSpTvRnd1LtEjGWg-xZcjLxe-Wf9-hP9Q6-QWVnX1e1LaUNjioC_irOL8IVdrHA/exec')}
                className="action-button btn-student"
                target="_blank"
                rel="noopener noreferrer"
              >
                กดเช็กชื่อนักเรียน
              </a>
            </div>

            <div className="chart-card">
              <h3 className="chart-title teacher-title">สถิติบุคลากรวันนี้</h3>
              {hasTeacherData ? (
                <div className="chart-wrapper teacher-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={teacherData}
                        cx="50%"
                        cy="50%"
                        innerRadius="45%"
                        outerRadius="80%"
                        paddingAngle={4}
                        dataKey="value"
                        labelLine={false}
                        isAnimationActive={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
                          const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);
                          const pct = (percent * 100).toFixed(0);

                          return percent > 0.05 ? (
                            <text x={x} y={y} fill="white" fontSize={13} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                              <tspan x={x} dy="-0.5em">{teacherData[index].value} คน</tspan>
                              <tspan x={x} dy="1.2em" fontSize={11}>({pct}%)</tspan>
                            </text>
                          ) : null;
                        }}
                      >
                        {teacherData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['ไม่ทราบ']} />
                        ))}
                      </Pie>
                      <Tooltip content={<TeacherTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="no-data-msg">ยังไม่มีข้อมูลบุคลากรสำหรับวันนี้</div>
              )}

              <a
                href={cleanGoogleUrl('https://script.google.com/macros/s/AKfycbzGVS9BzMK321WeIck4oA6QGSOGe4BdmNNUR0FlpIqOEvk18hiVVpCyc3XKovsxRUYg/exec')}
                className="action-button btn-teacher"
                target="_blank"
                rel="noopener noreferrer"
              >
                ดูรายละเอียดครู
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
