# 🚀 ClubHub — Student Club Workspace

A centralized internal workspace and management platform designed specifically for student club leadership and members. Built with Next.js 14, Tailwind CSS, TypeScript, and Supabase.

---

## 🛠️ Tech Stack
- **Frontend & Backend**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Dark Discord-themed UI)
- **Database & Auth & Realtime & Storage**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Validation**: Zod
- **Markdown Rendering**: React-Markdown + Remark-GFM

---

## 📦 Features Implemented (MVP)

1. **Database Schema & Row Level Security (RLS)**:
   - Full PostgreSQL schema with tables: `profiles`, `invitations`, `channels`, `channel_members`, `messages`, `dms`, `dm_messages`, `task_columns`, `tasks`, `subtasks`, `meetings`, `attendance`, `documents`, and `audit_logs`.
   - Granular RLS policies enforcing club roles (`president`, `vice_president`, `executive`, `media_team`, `member`).
   - SQL migrations located in `/supabase/migrations/`.

2. **Scaffold & Dark Discord UI**:
   - Leftmost server/section icon rail.
   - Channel navigation sidebar with real-time active indicators and user status footer.
   - Fully responsive layout with mobile drawer navigation.

3. **Auth + Invite Code Verification + RBAC**:
   - Email/password signup and login.
   - Signup strictly requires a valid, unredeemed executive invitation code.
   - `/admin/invites` (Executive-only) dashboard to generate, copy, track, and revoke invitation keys.
   - Role-based Next.js middleware protecting routes and checking executive permissions.

4. **Channels + Real-Time Chat + DMs**:
   - Channels: `#announcements` (read-only for members, executive broadcasts), `#general-chat`, `#projets-activities`, and `#executive-board` (restricted).
   - Real-time messages powered by Supabase Realtime postgres changes.
   - Real-time presence indicator showing online members per channel.
   - 1-on-1 Direct Messaging (DM) between any two members.
   - Quick role mention chips (`@Executive`, `@MediaTeam`) with Discord-like highlight styling.

5. **Agile Kanban Board**:
   - Columns: `To Do`, `In Progress`, `Done`.
   - Native HTML5 drag-and-drop between columns + mobile column selectors.
   - Tasks with priority badges (`urgent`, `high`, `medium`, `low`), deadlines, assignees, and interactive subtask checklists.
   - Executives can create/delete tasks; members can update their assigned tasks and complete subtasks.

6. **Meeting Attendance Tracker**:
   - Executive meeting scheduler.
   - One-click roll call logging (`Present`, `Late`, `Absent`).
   - Real-time attendance rate calculation and turnout metrics.

7. **Club Playbook & Statutes Viewer**:
   - Built-in official club statutes and operational guidelines.
   - Supabase Storage bucket integration for markdown (`.md`) playbook uploads and viewing.

---

## ⚡ Quickstart

### 1. Environment Configuration
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Apply Database Migrations & Seeds in Supabase
In your Supabase project dashboard -> SQL Editor, run:
1. `supabase/migrations/00001_initial_schema.sql`
2. `supabase/migrations/00002_functions_and_storage.sql`
3. `supabase/seed.sql`

### 3. Pre-configured Invitation Keys for Testing
Once the seed SQL is applied, use any of these keys during signup:
- **President**: `CLUB-PRES-2026`
- **Vice President**: `CLUB-VP-2026`
- **Executive**: `CLUB-EXEC-2026`
- **Media Team**: `CLUB-MEDIA-2026`
- **Member**: `CLUB-MEMBER-2026`

### 4. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deployment to Vercel
1. Push this repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Set the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Deploy!
