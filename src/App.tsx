import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AdminPanel } from './components/Admin/AdminPanel';
import { AuthProvider, useAuth } from './components/Firebase/AuthProvider';
import { Login } from './components/Auth/Login';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('swahivo_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('swahivo_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    // Check for admin route
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminRoute(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return (
    <Dashboard 
      user={user} 
      theme={theme} 
      onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
      onLogout={logout}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
