import { User } from '../types';
import { supabase } from './supabase';

const USERS_KEY = 'swahivo_users';
const CURRENT_USER_KEY = 'swahivo_current_user';

export const getStoredUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const setStoredUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getGuestUser = (): User => ({
  id: 'guest_user',
  email: 'guest@swahivo.ai',
  name: 'Guest User',
  role: 'user',
  createdAt: new Date().toISOString(),
});

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : getGuestUser();
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const logout = async () => {
  await supabase.auth.signOut();
  setCurrentUser(null);
  window.location.reload();
};
