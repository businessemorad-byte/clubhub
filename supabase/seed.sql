-- ClubHub Seed Data for Testing & Demo

-- 1. Insert Initial Invitation Codes
INSERT INTO invitations (code, role, expires_at)
VALUES 
  ('CLUB-PRES-2026', 'president', now() + interval '90 days'),
  ('CLUB-VP-2026', 'vice_president', now() + interval '90 days'),
  ('CLUB-EXEC-2026', 'executive', now() + interval '90 days'),
  ('CLUB-MEDIA-2026', 'media_team', now() + interval '90 days'),
  ('CLUB-MEMBER-2026', 'member', now() + interval '90 days'),
  ('CLUB-ALPHA-01', 'member', now() + interval '30 days'),
  ('CLUB-ALPHA-02', 'member', now() + interval '30 days')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Default Channels Exist
INSERT INTO channels (name, description, type)
VALUES 
  ('announcements', 'Official broadcasts and executive board notices', 'announcement'),
  ('general-chat', 'General clubhouse conversations and discussions', 'public'),
  ('projets-activities', 'Agile project coordination and event planning', 'public'),
  ('executive-board', 'Restricted room for President and Vice-President', 'executive')
ON CONFLICT (name) DO NOTHING;

-- 3. Ensure Default Task Columns Exist
INSERT INTO task_columns (name, "order")
VALUES 
  ('To Do', 1),
  ('In Progress', 2),
  ('Done', 3)
ON CONFLICT DO NOTHING;
