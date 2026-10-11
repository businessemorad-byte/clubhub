"use client";

import { useState } from "react";
import { MeetingPV, Meeting } from "@/types";
import { createMeetingPVAction, deleteMeetingPVAction } from "@/app/actions/pvs";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  FileCheck2,
  Calendar,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";

interface MeetingPVsArchiveProps {
  initialPVs: MeetingPV[];
  meetings: Meeting[];
}

export function MeetingPVsArchive({ initialPVs, meetings }: MeetingPVsArchiveProps) {
  const { isExecutive } = useAuth();
  const [pvs, setPVs] = useState<MeetingPV[]>(initialPVs);
  const [selectedPVId, setSelectedPVId] = useState<string>(
    initialPVs[0]?.id || ""
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [date, setDate] = useState("");
  const [attendees, setAttendees] = useState("");
  const [decisions, setDecisions] = useState("");
  const [content, setContent] = useState("");

  const selectedPV = pvs.find((p) => p.id === selectedPVId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    if (meetingId) formData.append("meetingId", meetingId);
    if (date) formData.append("date", date);
    if (attendees) formData.append("attendees", attendees);
    if (decisions) formData.append("decisions", decisions);
    formData.append("content", content);

    const result = await createMeetingPVAction(formData);
    if (result.error) {
      setError(result.error);
    } else if (result.pv) {
      setPVs([result.pv, ...pvs]);
      setSelectedPVId(result.pv.id);
      setTitle("");
      setAttendees("");
      setDecisions("");
      setContent("");
      setModalOpen(false);
    }
    setLoading(false);
  };

  const handleDelete = async (pv: MeetingPV) => {
    if (!confirm(`Delete meeting minutes "${pv.title}"?`)) return;

    await deleteMeetingPVAction(pv.id);
    const updated = pvs.filter((p) => p.id !== pv.id);
    setPVs(updated);
    if (selectedPVId === pv.id) {
      setSelectedPVId(updated[0]?.id || "");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-[#23a55a]" />
          <h1 className="font-bold text-white text-lg">Meeting Minutes (PVs) Archive</h1>
        </div>

        {isExecutive && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record New PV</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: PV List */}
        <div className="w-full md:w-72 bg-[#2b2d31] border-r border-[#1e1f22] flex flex-col h-auto md:h-full overflow-y-auto">
          <div className="p-3 border-b border-[#35373c] text-xs font-bold uppercase text-[#949ba4] tracking-wider">
            Executive Minutes Logs ({pvs.length})
          </div>

          <div className="p-2 space-y-1">
            {pvs.map((pv) => {
              const isSelected = pv.id === selectedPVId;
              return (
                <div
                  key={pv.id}
                  onClick={() => setSelectedPVId(pv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#35373c] text-white font-medium border-l-4 border-[#23a55a]"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <h4 className="font-semibold text-sm truncate">{pv.title}</h4>
                    <p className="text-xs text-[#949ba4] mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#f0b232]" />
                      {formatDate(pv.date)}
                    </p>
                  </div>

                  {isExecutive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(pv);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#949ba4] hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {pvs.length === 0 && (
              <div className="p-4 text-center text-xs text-[#949ba4] italic">
                No meeting minutes recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: PV Document View */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#313338]">
          {selectedPV ? (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* PV Title & Date */}
              <div className="border-b border-[#3f4147] pb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#23a55a] bg-[#23a55a]/10 px-2.5 py-1 rounded-full border border-[#23a55a]/30">
                  Official Minutes of Meeting
                </span>
                <h2 className="text-2xl font-bold text-white mt-3">{selectedPV.title}</h2>
                <div className="flex items-center gap-4 text-xs text-[#949ba4] mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#f0b232]" />
                    {formatDateTime(selectedPV.date)}
                  </span>
                  {selectedPV.author && (
                    <span>Logged by: {selectedPV.author.full_name}</span>
                  )}
                </div>
              </div>

              {/* Attendees */}
              {selectedPV.attendees && (
                <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#949ba4] mb-2 tracking-wider">
                    <Users className="w-4 h-4 text-[#5865f2]" />
                    <span>Members Present & Board Attendance</span>
                  </div>
                  <p className="text-sm text-[#dbdee1] leading-relaxed">
                    {selectedPV.attendees}
                  </p>
                </div>
              )}

              {/* Key Decisions Callout */}
              {selectedPV.decisions && (
                <div className="bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#23a55a] mb-2 tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    <span>Key Executive Board Decisions Made</span>
                  </div>
                  <div className="text-sm text-white font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedPV.decisions}
                  </div>
                </div>
              )}

              {/* Detailed Minutes Content */}
              <div>
                <h3 className="text-xs font-bold uppercase text-[#949ba4] tracking-wider mb-2">
                  Full Meeting Record
                </h3>
                <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-6 text-sm text-[#dbdee1] leading-relaxed whitespace-pre-wrap">
                  {selectedPV.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-[#949ba4]">
              <FileCheck2 className="w-12 h-12 text-[#23a55a]/40 mb-3" />
              <p className="text-base font-semibold">Select a meeting minutes record to view</p>
            </div>
          )}
        </div>
      </div>

      {/* Record PV Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
              <h3 className="text-base font-bold text-white">Record Meeting Minutes (PV)</h3>
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
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. PV #04: Semester Planning & Budget Allocation"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    Link Scheduled Meeting
                  </label>
                  <select
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                  >
                    <option value="">None / Standalone</option>
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Attendees Present
                </label>
                <input
                  type="text"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="e.g. President, Vice-President, Media Lead, 14 Members"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Key Decisions & Approvals
                </label>
                <textarea
                  rows={2}
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  placeholder="1. Approved $300 budget for venue&#10;2. Delegated design deliverables to Media Team"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Full Minutes Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detailed deliberations, discussions, and items addressed..."
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-xs resize-none"
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
                  Save Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
