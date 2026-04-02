import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getStoredUsers, setStoredUsers, setCurrentUser } from '../../lib/auth';
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

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !name) {
      setError('All fields are required');
      return;
    }

    const users = getStoredUsers();
    if (users.find(u => u.email === email)) {
      setError('Email already exists');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      password,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    setStoredUsers([...users, newUser]);
    setCurrentUser(newUser);
    onSuccess(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = getStoredUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      setCurrentUser(user);
      onSuccess(user);
    } else {
      setError('Invalid email or password');
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getStoredUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      alert(`Your password is: ${user.password}`);
      setMode('login');
    } else {
      setError('Email not found');
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
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </h2>

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
              placeholder="name@example.com"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
              <input
                type="password"
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
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' ? (
            <>
              <p className="text-sm text-text-muted">
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-text-main font-medium hover:underline">Sign up</button>
              </p>
              <button onClick={() => setMode('forgot')} className="text-sm text-text-dim hover:text-text-main transition-colors">Forgot password?</button>
            </>
          ) : (
            <p className="text-sm text-text-muted">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-text-main font-medium hover:underline">Sign in</button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
