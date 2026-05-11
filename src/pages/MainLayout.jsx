import React, { useState } from 'react';
import { Home, LayoutGrid, Users, Info, Settings as SettingsIcon } from 'lucide-react';
import SchoolCheckIn from './SchoolCheckIn';
import AppHub from './AppHub';
import Teachers from './Teachers';
import SchoolInfo from './SchoolInfo';
import Settings from './Settings';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('checkin');


  const renderContent = () => {
    switch (activeTab) {
      case 'checkin': return <SchoolCheckIn />;
      case 'hub': return <AppHub />;
      case 'teachers': return <Teachers />;
      case 'info': return <SchoolInfo />;
      case 'settings': return <Settings />;
      default: return <SchoolCheckIn />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'checkin': return 'หน้าหลัก';
      case 'hub': return 'รวมระบบ';
      case 'teachers': return 'ข้อมูลครูและบุคลากร';
      case 'info': return 'ข้อมูลโรงเรียน';
      case 'settings': return 'ตั้งค่าระบบ';
      default: return 'School Hub App';
    }
  };

  const showStandardHeader = activeTab !== 'info';

  return (
    <div className="main-layout">
      {showStandardHeader && (
        <header className="app-header">
          <h1 className="header-title">{getHeaderTitle()}</h1>
        </header>
      )}
      
      <main className={`page-content ${!showStandardHeader ? 'no-header !pb-0 !bg-transparent' : ''}`}>
        {renderContent()}
      </main>

      <nav className="bottom-nav">
        <div 
          className={`nav-item ${activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkin')}
        >
          <Home size={24} />
          <span className="nav-label">หน้าหลัก</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'hub' ? 'active' : ''}`}
          onClick={() => setActiveTab('hub')}
        >
          <LayoutGrid size={24} />
          <span className="nav-label">รวมระบบ</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
        >
          <Users size={24} />
          <span className="nav-label">บุคลากร</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Info size={24} />
          <span className="nav-label">ข้อมูลนร.</span>
        </div>
        <div 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={24} />
          <span className="nav-label">ตั้งค่า</span>
        </div>
      </nav>
    </div>
  );
}

export default MainLayout;
