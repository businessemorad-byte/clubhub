-- ClubHub Database Schema & RLS Policies Migration
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM (
  'president',
  'vice_president',
  'executive',
  'media_team',
  'member'
);

CREATE TYPE channel_type AS ENUM (
  'public',
  'announcement',
  'dm',
  'executive'
);

CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'late'
);

CREATE TYPE document_type AS ENUM (
  'playbook',
  'pv',
  'template',
  'asset'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Helper function to check if a user is an executive
CREATE OR REPLACE FUNCTION is_executive(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
      AND role IN ('president', 'vice_president', 'executive')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. INVITATIONS
CREATE TABLE invitations (
  code TEXT PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'member',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Executives can view invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (is_executive(auth.uid()));

CREATE POLICY "Executives can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_executive(auth.uid()));

CREATE POLICY "Executives can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (is_executive(auth.uid()));

-- 4. CHANNELS
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type channel_type NOT NULL DEFAULT 'public',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels visible based on type"
  ON channels FOR SELECT
  TO authenticated
  USING (
    type != 'executive' OR is_executive(auth.uid())
  );

CREATE POLICY "Only executives can create channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (is_executive(auth.uid()));

-- 5. CHANNEL MEMBERS
CREATE TABLE channel_members (
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (channel_id, user_id)
);

ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view channel members"
  ON channel_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join public channels"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages readable if channel accessible"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
        AND (channels.type != 'executive' OR is_executive(auth.uid()))
    )
  );

CREATE POLICY "Post messages to channels"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
        AND (
          (channels.type = 'announcement' AND is_executive(auth.uid()))
          OR (channels.type = 'executive' AND is_executive(auth.uid()))
          OR (channels.type = 'public')
        )
    )
  );

-- 7. DIRECT MESSAGES (DMs)
CREATE TABLE dms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dms_unique_pair UNIQUE (user_a, user_b),
  CONSTRAINT dms_distinct_users CHECK (user_a <> user_b)
);

ALTER TABLE dms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DMs viewable by participants"
  ON dms FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Authenticated users can create DMs"
  ON dms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_id UUID NOT NULL REFERENCES dms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DM messages viewable by participants"
  ON dm_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dms
      WHERE dms.id = dm_messages.dm_id
        AND (dms.user_a = auth.uid() OR dms.user_b = auth.uid())
    )
  );

CREATE POLICY "DM messages insertable by participants"
  ON dm_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM dms
      WHERE dms.id = dm_messages.dm_id
        AND (dms.user_a = auth.uid() OR dms.user_b = auth.uid())
    )
  );

-- 8. KANBAN TASK COLUMNS
CREATE TABLE task_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task columns viewable by all"
  ON task_columns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage columns"
  ON task_columns FOR ALL
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- 9. TASKS
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES task_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deadline TIMESTAMPTZ,
  priority task_priority NOT NULL DEFAULT 'medium',
  "order" INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by all authenticated users"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (is_executive(auth.uid()));

CREATE POLICY "Executives can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (is_executive(auth.uid()));

CREATE POLICY "Executives can update any task, members can update assigned task column"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    is_executive(auth.uid()) OR assignee_id = auth.uid()
  )
  WITH CHECK (
    is_executive(auth.uid()) OR assignee_id = auth.uid()
  );

-- 10. SUBTASKS
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subtasks viewable by all"
  ON subtasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can insert subtasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (is_executive(auth.uid()));

CREATE POLICY "Executives or task assignees can update subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    is_executive(auth.uid())
    OR EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.assignee_id = auth.uid()
    )
  )
  WITH CHECK (
    is_executive(auth.uid())
    OR EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.assignee_id = auth.uid()
    )
  );

CREATE POLICY "Executives can delete subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (is_executive(auth.uid()));

-- 11. MEETINGS
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetings viewable by all"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- 12. ATTENDANCE
CREATE TABLE attendance (
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'absent',
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (meeting_id, user_id)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance viewable by all"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can insert and update attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- 13. DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type document_type NOT NULL DEFAULT 'playbook',
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents viewable by all"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage documents"
  ON documents FOR ALL
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- 14. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs viewable by executives"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_executive(auth.uid()));

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- 15. SEED DATA & INITIAL CHANNELS FUNCTION
CREATE OR REPLACE FUNCTION initialize_default_channels_and_columns()
RETURNS void AS $$
BEGIN
  -- Default Channels
  INSERT INTO channels (name, description, type)
  VALUES 
    ('announcements', 'Official executive announcements and updates', 'announcement'),
    ('general-chat', 'General club conversations and discussions', 'public'),
    ('projets-activities', 'Discussions related to club projects and events', 'public'),
    ('executive-board', 'Private room for club executives', 'executive')
  ON CONFLICT (name) DO NOTHING;

  -- Default Task Columns
  INSERT INTO task_columns (name, "order")
  VALUES 
    ('To Do', 1),
    ('In Progress', 2),
    ('Done', 3)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the initialization
SELECT initialize_default_channels_and_columns();

-- 16. REALTIME REPLICATION ENABLE
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
