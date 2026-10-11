export type UserRole =
  | 'president'
  | 'vice_president'
  | 'executive'
  | 'media_team'
  | 'member';

export type ChannelType = 'public' | 'announcement' | 'dm' | 'executive';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type DocumentType = 'playbook' | 'pv' | 'template' | 'asset';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface Invitation {
  code: string;
  role: UserRole;
  created_by?: string | null;
  used_by?: string | null;
  used_at?: string | null;
  expires_at: string;
  created_at: string;
  creator?: Profile | null;
  user?: Profile | null;
}

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: ChannelType;
  created_by?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface DM {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  other_user?: Profile;
}

export interface DMMessage {
  id: string;
  dm_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface TaskColumn {
  id: string;
  name: string;
  order: number;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  deadline?: string | null;
  priority: TaskPriority;
  order: number;
  created_by?: string | null;
  created_at: string;
  assignee?: Profile | null;
  subtasks?: Subtask[];
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  created_by?: string | null;
  created_at: string;
}

export interface Attendance {
  meeting_id: string;
  user_id: string;
  status: AttendanceStatus;
  marked_by?: string | null;
  updated_at: string;
  user?: Profile;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: DocumentType;
  storage_path: string;
  uploaded_by?: string | null;
  created_at: string;
  uploader?: Profile;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  target?: string | null;
  meta?: Record<string, any>;
  created_at: string;
  actor?: Profile;
}

export const EXECUTIVE_ROLES: UserRole[] = ['president', 'vice_president', 'executive'];

export function isExecutive(role?: UserRole | null): boolean {
  if (!role) return false;
  return EXECUTIVE_ROLES.includes(role);
}
