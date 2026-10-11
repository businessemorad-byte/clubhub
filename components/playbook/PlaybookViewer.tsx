"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocumentItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { uploadPlaybookAction, deletePlaybookAction } from "@/app/actions/playbook";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  FileCode,
} from "lucide-react";

const DEFAULT_PLAYBOOK = `# 🚀 ClubHub: Official Statutes & Operational Guidelines

Welcome to the **ClubHub Operational Playbook**. This document contains the official regulations, role responsibilities, communication policies, and project workflows for all student club members and executive leadership.

---

## 🏛️ 1. Organizational Structure & Roles

### 👑 President & Vice-President
- Oversee all operations, strategic direction, and external university relations.
- Sole authority to create and manage the restricted **#executive-board** room and validate invitations.
- Manage high-level project milestones and final review of deliverable submissions.

### 💼 Executive Board
- Manage weekly team meetings, monitor member attendance, and assign tasks on the Agile Kanban board.
- Post official broadcasts in **#announcements**.
- Issue restricted invitation keys for incoming recruits.

### 🎨 Media & Technical Team
- Handle branding, social channels, design assets, and event documentation.
- Update deliverable submissions directly on the Kanban task cards.

### 🤝 Club Members
- Participate in discussions across **#general-chat** and **#projets-activities**.
- Execute assigned tasks, complete subtask checklists, and log meeting presence.

---

## 💬 2. Real-Time Communication Protocols
1. **Announcements Channel**: Strictly reserved for executive broadcasts. Read-only for general members to minimize noise.
2. **Role Mentions**:
   - Use \`@Executive\` to alert board members for urgent assistance.
   - Use \`@MediaTeam\` for design and visual asset deadlines.
3. **Direct Messages (DMs)**: Use 1-on-1 private messaging for personal or departmental check-ins.

---

## 📋 3. Kanban Task Execution Workflow
1. **To Do**: Newly created deliverables by leadership.
2. **In Progress**: Tasks actively being worked on by assigned members.
3. **Done**: Completed tasks where all subtask checklists are verified.

---

## 📊 4. Attendance & Good Standing
- Attendance at weekly club meetings is mandatory.
- Status is logged in the Digital Attendance Tracker (\`Present\`, \`Late\`, or \`Absent\`).
- A minimum 75% attendance rate is required to remain in good standing for certificate issuance.
`;

interface PlaybookViewerProps {
  initialDocuments: DocumentItem[];
}

export function PlaybookViewer({ initialDocuments }: PlaybookViewerProps) {
  const { isExecutive } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedDocId, setSelectedDocId] = useState<string>("default");
  const [docContent, setDocContent] = useState<string>(DEFAULT_PLAYBOOK);
  const [loadingContent, setLoadingContent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [markdownText, setMarkdownText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (selectedDocId === "default") {
      setDocContent(DEFAULT_PLAYBOOK);
      return;
    }

    const doc = documents.find((d) => d.id === selectedDocId);
    if (!doc) return;

    const fetchContent = async () => {
      setLoadingContent(true);
      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .download(doc.storage_path);

        if (error || !data) {
          setDocContent(`### Error loading document\n\n${error?.message || "File could not be downloaded."}`);
        } else {
          const text = await data.text();
          setDocContent(text);
        }
      } catch (e: any) {
        setDocContent(`### Error\n\n${e.message}`);
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, [selectedDocId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", newTitle);
    if (selectedFile) formData.append("file", selectedFile);
    if (markdownText) formData.append("markdownText", markdownText);

    const result = await uploadPlaybookAction(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.document) {
      setDocuments([result.document, ...documents]);
      setSelectedDocId(result.document.id);
      setNewTitle("");
      setMarkdownText("");
      setSelectedFile(null);
      setModalOpen(false);
    }
    setUploading(false);
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Delete playbook "${doc.title}"?`)) return;

    await deletePlaybookAction(doc.id, doc.storage_path);
    const updated = documents.filter((d) => d.id !== doc.id);
    setDocuments(updated);
    if (selectedDocId === doc.id) {
      setSelectedDocId("default");
    }
  };

  const currentDoc =
    selectedDocId === "default"
      ? { title: "Club Statutes & Operational Guidelines", created_at: null }
      : documents.find((d) => d.id === selectedDocId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[#5865f2]" />
          <h1 className="font-bold text-white text-lg">Club Playbook & Statutes</h1>
        </div>

        {isExecutive && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Playbook</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Documents Navigation */}
        <div className="w-full md:w-64 bg-[#2b2d31] border-r border-[#1e1f22] flex flex-col h-auto md:h-full overflow-y-auto">
          <div className="p-3 border-b border-[#35373c] text-xs font-bold uppercase text-[#949ba4] tracking-wider">
            Club Documentation
          </div>

          <div className="p-2 space-y-1">
            {/* Built-in Statutes */}
            <div
              onClick={() => setSelectedDocId("default")}
              className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                selectedDocId === "default"
                  ? "bg-[#35373c] text-white font-medium border-l-4 border-[#5865f2]"
                  : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className="w-4 h-4 text-[#5865f2] flex-shrink-0" />
                <span className="text-sm truncate">Club Statutes</span>
              </div>
              <span className="text-[10px] bg-[#1e1f22] px-1.5 py-0.5 rounded text-[#949ba4]">
                Official
              </span>
            </div>

            {/* Custom Uploaded Documents */}
            {documents.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#35373c] text-white font-medium border-l-4 border-[#5865f2]"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-[#23a55a] flex-shrink-0" />
                    <span className="text-sm truncate">{doc.title}</span>
                  </div>

                  {isExecutive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#949ba4] hover:text-red-400 rounded transition-opacity"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Markdown Content Viewer */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#313338] p-6 md:p-10">
          <div className="max-w-4xl mx-auto w-full">
            {/* Header info */}
            <div className="border-b border-[#3f4147] pb-4 mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">
                {currentDoc?.title}
              </h2>
              {currentDoc?.created_at && (
                <p className="text-xs text-[#949ba4]">
                  Uploaded on {formatDate(currentDoc.created_at)}
                </p>
              )}
            </div>

            {loadingContent ? (
              <div className="flex items-center justify-center p-12 text-[#949ba4] gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading playbook document...</span>
              </div>
            ) : (
              <article className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-[#00a8fc] prose-strong:text-white prose-code:text-[#f0b232] prose-pre:bg-[#1e1f22] prose-hr:border-[#3f4147] leading-relaxed text-[#dbdee1]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {docContent}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </div>

      {/* Upload Playbook Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
              <h3 className="text-lg font-bold text-white">Upload Club Playbook (.md)</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#949ba4] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-red-200 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Playbook Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Event Organization Handbook"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Upload Markdown File (.md)
                </label>
                <input
                  type="file"
                  accept=".md,.markdown,text/markdown"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#949ba4] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#5865f2] file:text-white hover:file:bg-[#4752c4] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Or Paste Markdown Content
                </label>
                <textarea
                  rows={5}
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="# Playbook Title&#10;&#10;Write markdown documentation here..."
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#5865f2] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#3f4147] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#dbdee1] hover:bg-[#35373c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !newTitle.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
