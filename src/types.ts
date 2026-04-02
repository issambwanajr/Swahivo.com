export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Stored in localStorage for mock auth
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
