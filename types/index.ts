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

export type ResourceCategory = 'posters' | 'assets' | 'letters' | 'forms';

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
  passcode?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  order: number;
  votes_count?: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface Poll {
  id: string;
  channel_id: string;
  creator_id: string;
  question: string;
  is_closed: boolean;
  created_at: string;
  creator?: Profile;
  options?: PollOption[];
  votes?: PollVote[];
  user_voted_option_id?: string | null;
  total_votes?: number;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  is_pinned?: boolean;
  pinned_by?: string | null;
  pinned_at?: string | null;
  sender?: Profile;
  replies_count?: number;
  poll?: Poll | null;
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

export interface ResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  file_name: string;
  file_size: number;
  file_type?: string | null;
  storage_path: string;
  uploaded_by?: string | null;
  created_at: string;
  uploader?: Profile;
}

export interface MeetingPV {
  id: string;
  meeting_id?: string | null;
  title: string;
  date: string;
  content: string;
  attendees?: string | null;
  decisions?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface TemplateItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_name: string;
  content?: string | null;
  storage_path?: string | null;
  created_by?: string | null;
  created_at: string;
  author?: Profile;
}

export interface MemberPerformance {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  attendance_rate: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  total_meetings: number;
  completed_tasks: number;
  total_tasks: number;
  messages_sent: number;
  score: number;
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

export function isPresidency(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === 'president' || role === 'vice_president';
}
