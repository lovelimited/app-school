import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './pages/MainLayout';
import PWAPrompt from './components/PWAPrompt';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('school_app_auth') === 'true');

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />} />
          <Route path="/*" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />} />
        </Routes>
      </HashRouter>
      <PWAPrompt />
    </>
  );
}

export default App;
