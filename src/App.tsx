import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AuthForms } from './components/Auth/AuthForms';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AdminPanel } from './components/Admin/AdminPanel';
import { getCurrentUser } from './lib/auth';
import { User } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check for admin route
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminRoute(true);
    }

    // Check for logged in user
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  if (user) {
    return <Dashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-bg selection:bg-accent/30 selection:text-accent-light flex flex-col">
      <Navbar onLoginClick={() => setShowAuth(true)} />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-light/10 blur-[120px] rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <Hero onGetStarted={() => setShowAuth(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md px-4"
            >
              <AuthForms onSuccess={(u) => setUser(u)} />
              <button 
                onClick={() => setShowAuth(false)}
                className="mt-6 w-full text-text-dim hover:text-text-main transition-colors text-sm font-medium"
              >
                ← Back to home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <div className="py-5 px-6 text-center text-[0.78rem] text-text-dim bg-bg z-50">
        By messaging Swahivo, an AI chatbot, you agree to our <a href="#" className="underline underline-offset-2 hover:text-text-muted transition-colors">Terms</a> and have read our <a href="#" className="underline underline-offset-2 hover:text-text-muted transition-colors">Privacy Policy</a>.
      </div>
    </div>
  );
}
