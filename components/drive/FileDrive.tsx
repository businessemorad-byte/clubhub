"use client";

import { useState } from "react";
import { ResourceItem, ResourceCategory } from "@/types";
import { uploadResourceAction, deleteResourceAction } from "@/app/actions/drive";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  Folder,
  Upload,
  File,
  Image,
  FileText,
  Download,
  Trash2,
  Plus,
  Loader2,
  X,
  HardDrive,
} from "lucide-react";

interface FileDriveProps {
  initialResources: ResourceItem[];
}

export function FileDrive({ initialResources }: FileDriveProps) {
  const { user, isExecutive } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [activeCategory, setActiveCategory] = useState<ResourceCategory | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ResourceCategory>("assets");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const supabase = createClient();

  const categories: { key: ResourceCategory | "all"; label: string }[] = [
    { key: "all", label: "All Files" },
    { key: "posters", label: "Event Posters" },
    { key: "assets", label: "Design & Media Assets" },
    { key: "letters", label: "Official Letters" },
    { key: "forms", label: "Forms & Agreements" },
  ];

  const filteredResources =
    activeCategory === "all"
      ? resources
      : resources.filter((r) => r.category === activeCategory);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("category", newCategory);
    formData.append("file", selectedFile);

    const result = await uploadResourceAction(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.resource) {
      setResources([result.resource, ...resources]);
      setNewTitle("");
      setSelectedFile(null);
      setModalOpen(false);
    }
    setUploading(false);
  };

  const handleDelete = async (res: ResourceItem) => {
    if (!confirm(`Delete "${res.title}"?`)) return;

    await deleteResourceAction(res.id, res.storage_path);
    setResources(resources.filter((r) => r.id !== res.id));
  };

  const handleDownload = async (res: ResourceItem) => {
    const { data } = await supabase.storage
      .from("resources")
      .download(res.storage_path);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const getFileIcon = (category: ResourceCategory) => {
    switch (category) {
      case "posters":
      case "assets":
        return <Image className="w-8 h-8 text-[#5865f2]" />;
      case "letters":
      case "forms":
      default:
        return <FileText className="w-8 h-8 text-[#23a55a]" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-5 h-5 text-[#5865f2]" />
          <h1 className="font-bold text-white text-lg">Resource & File Drive</h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Categories Bar */}
      <div className="px-6 py-3 border-b border-[#1f2023] bg-[#2b2d31] flex items-center gap-2 overflow-x-auto">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#5865f2] text-white shadow-sm"
                  : "bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c]"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Files Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredResources.length === 0 ? (
          <div className="h-64 border border-dashed border-[#3f4147] rounded-xl flex flex-col items-center justify-center text-[#949ba4] p-6 text-center">
            <Folder className="w-12 h-12 text-[#5865f2]/40 mb-2" />
            <h3 className="font-semibold text-white text-sm">No files uploaded yet</h3>
            <p className="text-xs mt-1">Upload event posters, club logos, forms or official letters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredResources.map((res) => {
              const canDelete = isExecutive || res.uploaded_by === user?.id;

              return (
                <div
                  key={res.id}
                  className="bg-[#2b2d31] border border-[#3f4147] hover:border-[#5865f2]/50 rounded-xl p-4 shadow flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 bg-[#1e1f22] rounded-xl">
                        {getFileIcon(res.category)}
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#1e1f22] text-[#949ba4] border border-[#3f4147]">
                        {res.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm truncate mb-1" title={res.title}>
                      {res.title}
                    </h4>
                    <p className="text-xs text-[#949ba4] truncate" title={res.file_name}>
                      {res.file_name}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#35373c] flex items-center justify-between text-xs text-[#949ba4]">
                    <div>
                      <span>{formatFileSize(res.file_size)}</span>
                      <span className="block text-[10px] mt-0.5">
                        {formatDate(res.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(res)}
                        className="p-1.5 hover:bg-[#35373c] text-[#5865f2] hover:text-white rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(res)}
                          className="p-1.5 hover:bg-red-950/60 text-[#949ba4] hover:text-red-400 rounded-lg transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
              <h3 className="text-base font-bold text-white">Upload to File Drive</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#949ba4] hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-red-200 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Club Logo High-Res Vector"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Folder Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ResourceCategory)}
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
                >
                  <option value="posters">Event Posters</option>
                  <option value="assets">Design & Media Assets</option>
                  <option value="letters">Official Letters</option>
                  <option value="forms">Forms & Agreements</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  File Attachment <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[#949ba4] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#5865f2] file:text-white hover:file:bg-[#4752c4] cursor-pointer"
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
                  disabled={uploading || !newTitle.trim() || !selectedFile}
                  className="px-5 py-2 rounded-lg text-xs font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
