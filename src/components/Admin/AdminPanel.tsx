import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { getStoredUsers, setStoredUsers } from '../../lib/auth';
import { Users, Trash2, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function AdminPanel() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      setUsers(getStoredUsers());
    }
  }, [isAdminLoggedIn]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAdminLoggedIn(true);
      setError('');
    } else {
      setError('Invalid admin credentials');
    }
  };

  const deleteUser = (id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setStoredUsers(updatedUsers);
    setUsers(updatedUsers);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-border-muted p-8 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <ShieldCheck size={32} className="text-accent" />
            <h2 className="text-2xl font-bold">Admin Portal</h2>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border border-border-subtle rounded-xl text-text-main focus:border-accent outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all active:scale-95">
              Login as Admin
            </button>
          </form>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full mt-4 flex items-center justify-center gap-2 text-text-dim hover:text-text-main transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-text-muted">Total registered users: {users.length}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdminLoggedIn(false)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-2 border border-border-subtle rounded-xl hover:bg-surface-3 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </header>

        <div className="bg-surface border border-border-subtle rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-2 border-b border-border-subtle">
                <th className="px-6 py-4 font-semibold text-text-muted uppercase text-xs tracking-wider">User</th>
                <th className="px-6 py-4 font-semibold text-text-muted uppercase text-xs tracking-wider">Role</th>
                <th className="px-6 py-4 font-semibold text-text-muted uppercase text-xs tracking-wider">Joined</th>
                <th className="px-6 py-4 font-semibold text-text-muted uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-3 rounded-full flex items-center justify-center text-text-main font-bold">
                        {u.name[0]}
                      </div>
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-sm text-text-dim">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      u.role === 'admin' ? "bg-accent/20 text-accent" : "bg-surface-3 text-text-muted"
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-text-muted text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button 
                      onClick={() => deleteUser(u.id)}
                      className="p-2 text-text-dim hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-text-dim italic">
              No registered users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
