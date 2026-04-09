export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Stored in localStorage for mock auth
  role: 'user' | 'admin';
  createdAt: string;
}

export interface BotConfig {
  id: string;
  user_id: string;
  name: string;
  description: string;
  avatar_url?: string;
  theme_color: string;
  placeholder: string;
  font_family: string;
  system_prompt?: string;
  tone?: string;
  behavior_rules?: string;
  deep_rag_enabled: boolean;
  show_sources: boolean;
  welcome_message: string;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  type: 'whatsapp' | 'google_sheets' | 'excel' | 'messenger' | 'instagram' | 'hubspot' | 'salesforce' | 'zapier' | 'webhook' | 'slack' | 'zendesk';
  status: 'connected' | 'disconnected';
  config: any;
  created_at: string;
}

export interface TrainingMaterial {
  id: string;
  user_id: string;
  type: 'file' | 'link' | 'text' | 'pdf_page' | 'qa' | 'image';
  title: string;
  content: string;
  metadata?: {
    source?: string;
    page_number?: number;
    image_path?: string;
    pdf_name?: string;
  };
  status: 'trained' | 'pending' | 'error' | 'training';
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  intent: string;
  data: any;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface WorkspaceDocument {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  type: 'pdf' | 'url' | 'text';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
