import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AdminPanel } from './components/Admin/AdminPanel';
import { getCurrentUser } from './lib/auth';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(getCurrentUser());
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

    // Check for logged in user (local storage)
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  return <Dashboard user={user || getCurrentUser()!} theme={theme} onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />;
}
