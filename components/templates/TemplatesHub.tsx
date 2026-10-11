"use client";

import { useState } from "react";
import { TemplateItem } from "@/types";
import { createTemplateAction, deleteTemplateAction } from "@/app/actions/drive";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  X,
  Loader2,
  FileText,
  FileCheck,
  Award,
} from "lucide-react";

const BUILT_IN_TEMPLATES: TemplateItem[] = [
  {
    id: "builtin-sponsorship",
    title: "Corporate Sponsorship Proposal Template",
    category: "Partnerships",
    description: "Standardized outreach packet and tier breakdown for university event sponsors.",
    file_name: "ClubHub_Sponsorship_Proposal_Template.md",
    content: `# CLUB SPONSORSHIP PROPOSAL
**Event / Season**: Academic Year 2026
**Organized by**: ClubHub Leadership

## Executive Summary
Our student club brings together high-performing student innovators across engineering, business, and design.

## Partnership Tiers
- **Platinum Sponsor ($1,500)**: Keynote speaking slot, logo on all marketing collateral, access to student resumes.
- **Gold Sponsor ($800)**: Booth presence, banner branding, social media campaign mention.
- **Silver Sponsor ($400)**: Logo on official event badges and booklet.

## Contact Information
Executive Board: executive@club.org
`,
    created_at: new Date().toISOString(),
  },
  {
    id: "builtin-budget",
    title: "Event Budget & Expense Request Form",
    category: "Finance",
    description: "Financial requisition sheet for venue, logistics, catering, and promotional items.",
    file_name: "ClubHub_Budget_Requisition_Form.txt",
    content: `CLUB EXPENSE REQUISITION FORM
Date: ________________________
Event Title: _________________
Requesting Department: _______

ITEMS BREAKDOWN:
1. Logistics & Venue: $_______
2. Catering & Refreshments: $_______
3. Printing & Merch: $_______
4. Speaker Honorariums: $_______

TOTAL REQUESTED: $_______
Vice-President Approval: [  ] Approved  [  ] Rejected
`,
    created_at: new Date().toISOString(),
  },
  {
    id: "builtin-letterhead",
    title: "Official Administrative Letterhead",
    category: "Administration",
    description: "Formal correspondence template for university dean and student union administration.",
    file_name: "ClubHub_Official_Letterhead.md",
    content: `# STUDENT CLUB LEADERSHIP BOARD
**Address**: University Student Life Center, Room 204
**Email**: contact@club.org | **Web**: clubhub.workspace

---

**Date**: [Date]  
**To**: The Dean of Student Affairs  
**Subject**: Formal Notice of Annual Student Initiative  

Dear Administration,

We hereby submit our official declaration and schedule for the upcoming semester activities.

Respectfully submitted,  
**Club President** & **Vice-President**  
`,
    created_at: new Date().toISOString(),
  },
  {
    id: "builtin-convocation",
    title: "General Assembly Convocation Notice",
    category: "Governance",
    description: "Mandatory statutory notice for member roll call and executive elections.",
    file_name: "ClubHub_General_Assembly_Notice.md",
    content: `# NOTICE OF EXTRAORDINARY GENERAL ASSEMBLY
To all registered club members,

Notice is hereby given that the General Assembly of the club will be held on:
- **Date**: [Date]
- **Time**: 18:00 UTC
- **Location**: Main Amphitheater & ClubHub Workspace

### Agenda:
1. Moral and Financial Report by President
2. Project Retrospective
3. Executive Board Elections
4. Q&A and Member Open Floor
`,
    created_at: new Date().toISOString(),
  },
];

interface TemplatesHubProps {
  initialTemplates: TemplateItem[];
}

export function TemplatesHub({ initialTemplates }: TemplatesHubProps) {
  const { isExecutive } = useAuth();
  const [templates, setTemplates] = useState<TemplateItem[]>([
    ...BUILT_IN_TEMPLATES,
    ...initialTemplates,
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Administration");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");

  const categories = ["all", "Administration", "Partnerships", "Finance", "Governance"];

  const filtered =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleDownload = (template: TemplateItem) => {
    if (!template.content) return;
    const blob = new Blob([template.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("fileName", fileName || `${title.replace(/\s+/g, "_")}.md`);
    formData.append("content", content);

    const result = await createTemplateAction(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.template) {
      setTemplates([...templates, result.template]);
      setTitle("");
      setDescription("");
      setContent("");
      setFileName("");
      setModalOpen(false);
    }
    setLoading(false);
  };

  const handleDelete = async (templateId: string) => {
    if (templateId.startsWith("builtin-")) {
      alert("Built-in official club templates cannot be deleted.");
      return;
    }
    if (!confirm("Delete this template?")) return;

    await deleteTemplateAction(templateId);
    setTemplates(templates.filter((t) => t.id !== templateId));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-[#f0b232]" />
          <h1 className="font-bold text-white text-lg">Official Templates Hub</h1>
        </div>

        {isExecutive && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Template</span>
          </button>
        )}
      </div>

      {/* Categories Bar */}
      <div className="px-6 py-3 border-b border-[#1f2023] bg-[#2b2d31] flex items-center gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
              selectedCategory === cat
                ? "bg-[#5865f2] text-white shadow-sm"
                : "bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c]"
            }`}
          >
            {cat === "all" ? "All Templates" : cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tmpl) => {
            const isBuiltIn = tmpl.id.startsWith("builtin-");

            return (
              <div
                key={tmpl.id}
                className="bg-[#2b2d31] border border-[#3f4147] hover:border-[#5865f2]/50 rounded-xl p-5 shadow flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-[#1e1f22] rounded-xl text-[#f0b232]">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] border border-[#3f4147]">
                      {tmpl.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mb-1.5">
                    {tmpl.title}
                  </h3>
                  {tmpl.description && (
                    <p className="text-xs text-[#949ba4] leading-relaxed mb-4">
                      {tmpl.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#35373c] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#949ba4] truncate max-w-[150px]">
                    {tmpl.file_name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(tmpl)}
                      className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
                      title="Download Template"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {isExecutive && !isBuiltIn && (
                      <button
                        onClick={() => handleDelete(tmpl.id)}
                        className="p-1.5 hover:bg-red-950/60 text-[#949ba4] hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Template Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
              <h3 className="text-base font-bold text-white">Add Official Template</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#949ba4] hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-red-200 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Partnership Agreement Contract"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                  >
                    <option value="Administration">Administration</option>
                    <option value="Partnerships">Partnerships</option>
                    <option value="Finance">Finance</option>
                    <option value="Governance">Governance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="template.md"
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Brief Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Standard contractual agreement for partner outreach..."
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Template Content (Markdown / Text) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# TEMPLATE TITLE&#10;&#10;Standard text and blanks..."
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#5865f2] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#3f4147] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#dbdee1] hover:bg-[#35373c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="px-5 py-2 rounded-lg text-xs font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
