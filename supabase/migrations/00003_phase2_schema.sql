-- Phase 2 Database Schema Migration

-- Helper function to check if user is President or Vice-President
CREATE OR REPLACE FUNCTION is_presidency(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
      AND role IN ('president', 'vice_president')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. MESSAGE ENHANCEMENTS: Threaded replies and Pinning
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- Allow executives to pin/unpin messages
CREATE POLICY "Executives can pin and unpin messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- Add passcode column to channels for password-protected private rooms
ALTER TABLE channels
  ADD COLUMN IF NOT EXISTS passcode TEXT;

-- 2. LIVE IN-CHAT POLLS
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls viewable by authenticated users"
  ON polls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create polls"
  ON polls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Poll creators or executives can update polls"
  ON polls FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id OR is_executive(auth.uid()))
  WITH CHECK (auth.uid() = creator_id OR is_executive(auth.uid()));

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Poll options viewable by authenticated users"
  ON poll_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create poll options"
  ON poll_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_poll_user_vote UNIQUE (poll_id, user_id)
);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Poll votes viewable by authenticated users"
  ON poll_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can cast and change their vote"
  ON poll_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their vote"
  ON poll_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. RESOURCE & FILE DRIVE
CREATE TYPE resource_category AS ENUM (
  'posters',
  'assets',
  'letters',
  'forms'
);

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category resource_category NOT NULL DEFAULT 'assets',
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resources viewable by authenticated users"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Executives or uploaders can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (is_executive(auth.uid()) OR auth.uid() = uploaded_by);

-- 4. MEETING MINUTES (PVs) ARCHIVE
CREATE TABLE IF NOT EXISTS meeting_pvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  content TEXT NOT NULL,
  attendees TEXT,
  decisions TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE meeting_pvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meeting PVs viewable by authenticated users"
  ON meeting_pvs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage meeting PVs"
  ON meeting_pvs FOR ALL
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- 5. OFFICIAL TEMPLATES HUB
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  file_name TEXT NOT NULL,
  content TEXT,
  storage_path TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable by all authenticated users"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Executives can manage templates"
  ON templates FOR ALL
  TO authenticated
  USING (is_executive(auth.uid()))
  WITH CHECK (is_executive(auth.uid()));

-- Storage Bucket setup for 'resources'
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public can view resources bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resources');

CREATE POLICY "Authenticated can upload to resources bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resources');

CREATE POLICY "Executives or uploaders can delete from resources bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND (is_executive(auth.uid()) OR auth.uid() = owner));

-- Realtime publication updates
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
