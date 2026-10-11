# 🚀 ClubHub — Student Club Workspace

A centralized internal workspace and management platform designed specifically for student club leadership and members. Built with Next.js 14, Tailwind CSS, TypeScript, and Supabase.

---

## 🛠️ Tech Stack
- **Frontend & Backend**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS (Dark Discord-themed UI)
- **Database & Auth & Realtime & Storage**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Validation**: Zod
- **Data Visualization**: Recharts
- **Document & Spreadsheet Export**: jsPDF + jsPDF-AutoTable, SheetJS (xlsx)
- **Markdown Rendering**: React-Markdown + Remark-GFM

---

## 📦 Features Implemented

### Phase 1: Core Foundation
1. **Database Schema & Row Level Security (RLS)**:
   - Full PostgreSQL schema with tables: `profiles`, `invitations`, `channels`, `channel_members`, `messages`, `dms`, `dm_messages`, `task_columns`, `tasks`, `subtasks`, `meetings`, `attendance`, `documents`, and `audit_logs`.
   - SQL migrations located in `/supabase/migrations/`.
2. **Scaffold & Dark Discord UI**:
   - Icon dock navigation rail, channel sidebar with live presence, and user status footer.
3. **Auth + Invite Code Verification + RBAC**:
   - Email/password signup strictly requires executive invitation key.
   - `/admin/invites` dashboard for executives.
4. **Channels + Real-Time Chat + DMs**:
   - Channels: `#announcements`, `#general-chat`, `#projets-activities`.
   - Real-time messaging and 1-on-1 DMs with presence and `@Executive`/`@MediaTeam` mentions.
5. **Agile Kanban Board**:
   - Columns: `To Do`, `In Progress`, `Done` with drag-and-drop, priority flags, deadlines, and subtask checklists.
6. **Meeting Attendance Tracker**:
   - Roll call logging (`Present`, `Late`, `Absent`) and live turnout rate.
7. **Club Playbook & Statutes Viewer**:
   - Markdown viewer with Supabase Storage integration.

### Phase 2: Collaboration, Documentation & Analytics
1. **Chat Enhancements**:
   - **Threaded Replies**: Side panel contextual replies per message with real-time sync.
   - **Message Pinning**: Executive pin/unpin action, pinned badges, and channel-wide pinned messages modal.
   - **Live In-Chat Polls**: Create 2–5 option polls with real-time single-click voting, progress percentage bars, and close controls.
   - **Executive Private Room**: Password-protected `#executive-board` restricted exclusively to the President and Vice-President.
2. **Files & Documentation**:
   - **Resource & File Drive** (`/drive`): Categorized folders for `Event Posters`, `Design Assets`, `Official Letters`, and `Forms & Agreements` with Supabase Storage RLS.
   - **Meeting Minutes (PVs) Archive** (`/pvs`): Create, list, and view formal executive board PVs, attendee roll calls, and key decisions.
   - **Official Templates Hub** (`/templates`): Downloadable standardized club templates (sponsorship proposals, budget requisition, administrative letterhead, general assembly notice).
3. **Analytics & Dashboard** (`/analytics`):
   - **Member Performance Profiles**: Detailed individual tracking of attendance %, completed tasks, and contribution score.
   - **Executive Dashboard**: Turnout trends and Kanban task distribution charts using Recharts.
4. **Executive Exports**:
   - Export attendance reports as PDF and Excel (`.xlsx`).
   - Export activity reports as PDF and Excel (`.xlsx`).

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
3. `supabase/migrations/00003_phase2_schema.sql`
4. `supabase/seed.sql`

### 3. Pre-configured Invitation Keys for Testing
- **President**: `CLUB-PRES-2026`
- **Vice President**: `CLUB-VP-2026`
- **Executive**: `CLUB-EXEC-2026`
- **Media Team**: `CLUB-MEDIA-2026`
- **Member**: `CLUB-MEMBER-2026`

*Executive Private Room Passcode*: `CLUB2026`

### 4. Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
