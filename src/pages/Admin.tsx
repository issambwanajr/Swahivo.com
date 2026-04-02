import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Users, Mail, Trash2, ShieldCheck } from 'lucide-react';

export function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAdmin(true);
    } else {
      alert('Invalid admin credentials');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    // Note: Supabase doesn't allow listing users from the client SDK for security.
    // In a real app, you'd use a service role or a custom edge function.
    // For this demo, we'll just fetch inquiries.
    const { data: inqData } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    setInquiries(inqData || []);
    setLoading(false);
  };

  const deleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (!error) {
      setInquiries(inquiries.filter(i => i.id !== id));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-2xl border border-border-subtle shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/20 rounded-xl text-accent mb-4">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-text-main">Admin Access</h2>
            <p className="text-text-muted mt-2">Please enter admin credentials</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-2 border border-border-subtle rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-2 border border-border-subtle rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-accent"
            />
            <button type="submit" className="w-full bg-accent text-white font-bold py-2 rounded-lg hover:opacity-90">
              Login as Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-text-main">Admin Control Center</h1>
            <p className="text-text-muted mt-1">Manage users and inquiries</p>
          </div>
          <button onClick={() => setIsAdmin(false)} className="text-text-muted hover:text-text-main">Logout Admin</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inquiries Section */}
          <section className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center gap-2">
              <Mail className="text-accent" size={20} />
              <h2 className="text-lg font-semibold text-text-main">Recent Inquiries</h2>
            </div>
            <div className="divide-y divide-border-subtle">
              {loading ? (
                <div className="p-8 text-center text-text-muted">Loading...</div>
              ) : inquiries.length === 0 ? (
                <div className="p-8 text-center text-text-muted">No inquiries found</div>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="p-6 hover:bg-surface-2 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-text-main">{inq.name}</h3>
                        <p className="text-sm text-text-muted">{inq.email}</p>
                      </div>
                      <button 
                        onClick={() => deleteInquiry(inq.id)}
                        className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-text-muted mt-2 bg-bg/50 p-3 rounded-lg border border-border-subtle">
                      {inq.message}
                    </p>
                    <span className="text-[10px] text-text-dim mt-4 block uppercase tracking-wider">
                      {new Date(inq.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Users Section (Placeholder) */}
          <section className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center gap-2">
              <Users className="text-accent" size={20} />
              <h2 className="text-lg font-semibold text-text-main">Registered Users</h2>
            </div>
            <div className="p-8 text-center">
              <p className="text-text-muted">
                User management is handled via Supabase Dashboard for security.
              </p>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noreferrer"
                className="inline-block mt-4 text-accent hover:underline font-medium"
              >
                Open Supabase Dashboard →
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
