import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getStoredUsers, setStoredUsers, setCurrentUser } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '@/src/lib/utils';

interface AuthFormsProps {
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export function AuthForms({ onSuccess, initialMode = 'login' }: AuthFormsProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'newPassword'>('email');
  const [newPassword, setNewPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !name) {
      setError('All fields are required');
      return;
    }

    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('Email already exists');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      password,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    setStoredUsers([...users, newUser]);
    setCurrentUser(newUser);
    onSuccess(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);

    if (user) {
      setCurrentUser(user);
      onSuccess(user);
    } else {
      setError('Invalid email or password');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error signing in with Google');
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getStoredUsers();
    const user = users.find(u => u.email === email);
    
    if (resetStep === 'email') {
      if (user) {
        setResetStep('newPassword');
      } else {
        setError('Email not found');
      }
    } else {
      if (!newPassword) {
        setError('Please enter a new password');
        return;
      }
      const updatedUsers = users.map(u => 
        u.email === email ? { ...u, password: newPassword } : u
      );
      setStoredUsers(updatedUsers);
      setMode('login');
      setResetStep('email');
      setNewPassword('');
      alert('Password reset successful! You can now sign in with your new password.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-surface border border-border-muted rounded-3xl shadow-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={mode}
      >
        <h2 className="text-2xl font-semibold mb-6 text-text-main">
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : resetStep === 'email' ? 'Reset password' : 'Set new password'}
        </h2>

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}
          
          {resetStep === 'email' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="name@example.com"
              />
            </div>
          )}

          {mode === 'forgot' && resetStep === 'newPassword' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">New Password</label>
              <input
                type="password"
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
              <input
                type="password"
                name="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all active:scale-95"
          >
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Sign up' : resetStep === 'email' ? 'Continue' : 'Update password'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => {
                setEmail('issambwana087@gmail.com');
                setPassword('Swahivo2026!');
              }}
              className="w-full py-2 text-xs text-text-dim hover:text-text-main transition-colors border border-dashed border-white/10 rounded-lg"
            >
              Autofill Demo Account
            </button>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-text-dim">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3 bg-surface-2 border border-border-subtle text-text-main font-semibold rounded-xl hover:bg-surface-3 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </>
          )}
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' ? (
            <>
              <p className="text-sm text-text-muted">
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-text-main font-medium hover:underline">Sign up</button>
              </p>
              <button onClick={() => { setMode('forgot'); setResetStep('email'); }} className="text-sm text-text-dim hover:text-text-main transition-colors">Forgot password?</button>
            </>
          ) : (
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setResetStep('email'); }} className="text-text-main font-medium hover:underline">Sign in</button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
