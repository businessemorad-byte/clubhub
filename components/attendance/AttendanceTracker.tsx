"use client";

import { useState } from "react";
import { Meeting, Attendance, Profile, AttendanceStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime, formatDate, getInitials, getRoleBadgeClass, getRoleDisplayName } from "@/lib/utils";
import {
  createMeetingAction,
  updateAttendanceAction,
  deleteMeetingAction,
} from "@/app/actions/attendance";
import {
  CalendarCheck2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  X,
} from "lucide-react";

interface AttendanceTrackerProps {
  initialMeetings: Meeting[];
  initialAttendance: Attendance[];
  members: Profile[];
}

export function AttendanceTracker({
  initialMeetings,
  initialAttendance,
  members,
}: AttendanceTrackerProps) {
  const { isExecutive } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    initialMeetings[0]?.id || ""
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);

  // Filter attendance for currently selected meeting
  const currentMeetingAttendance = attendance.filter(
    (a) => a.meeting_id === selectedMeetingId
  );

  const getStatusForUser = (userId: string): AttendanceStatus => {
    const record = currentMeetingAttendance.find((a) => a.user_id === userId);
    return record?.status || "absent";
  };

  const handleStatusChange = async (userId: string, newStatus: AttendanceStatus) => {
    if (!isExecutive || !selectedMeetingId) return;

    // Optimistic update
    setAttendance((prev) => {
      const filtered = prev.filter(
        (a) => !(a.meeting_id === selectedMeetingId && a.user_id === userId)
      );
      return [
        ...filtered,
        {
          meeting_id: selectedMeetingId,
          user_id: userId,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
      ];
    });

    await updateAttendanceAction(selectedMeetingId, userId, newStatus);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("date", newDate);

    const result = await createMeetingAction(formData);
    if (result.success && result.meeting) {
      setMeetings([result.meeting, ...meetings]);
      setSelectedMeetingId(result.meeting.id);
      setNewTitle("");
      setNewDate("");
      setModalOpen(false);
    }
    setLoading(false);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    await deleteMeetingAction(meetingId);
    const updated = meetings.filter((m) => m.id !== meetingId);
    setMeetings(updated);
    if (selectedMeetingId === meetingId) {
      setSelectedMeetingId(updated[0]?.id || "");
    }
  };

  // Stats calculation
  const totalCount = members.length;
  const presentCount = members.filter((m) => getStatusForUser(m.id) === "present").length;
  const lateCount = members.filter((m) => getStatusForUser(m.id) === "late").length;
  const absentCount = members.filter((m) => getStatusForUser(m.id) === "absent").length;
  const rate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-[#1f2023] px-6 flex items-center justify-between bg-[#313338] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <CalendarCheck2 className="w-5 h-5 text-[#23a55a]" />
          <h1 className="font-bold text-white text-lg">Meeting Attendance Tracker</h1>
        </div>

        {isExecutive && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Meeting</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left pane: Meetings list */}
        <div className="w-full md:w-72 bg-[#2b2d31] border-r border-[#1e1f22] flex flex-col h-auto md:h-full overflow-y-auto">
          <div className="p-3 border-b border-[#35373c] text-xs font-bold uppercase text-[#949ba4] tracking-wider">
            Club Meetings ({meetings.length})
          </div>

          <div className="p-2 space-y-1">
            {meetings.map((m) => {
              const isSelected = m.id === selectedMeetingId;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeetingId(m.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#35373c] text-white border-l-4 border-[#5865f2]"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm truncate">{m.title}</h4>
                    <p className="text-xs text-[#949ba4] mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(m.date)}
                    </p>
                  </div>

                  {isExecutive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeeting(m.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#949ba4] hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {meetings.length === 0 && (
              <div className="p-4 text-center text-xs text-[#949ba4] italic">
                No meetings scheduled yet.
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Attendance sheet */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-6">
          {selectedMeeting ? (
            <>
              {/* Meeting info & stats header */}
              <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-5 mb-6 shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedMeeting.title}</h2>
                    <p className="text-sm text-[#949ba4] mt-0.5">
                      Scheduled for {formatDateTime(selectedMeeting.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#23a55a]">{rate}%</span>
                    <span className="text-xs text-[#949ba4] block uppercase font-bold tracking-wider">
                      Turnout Rate
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#35373c] text-center">
                  <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-green-500/20">
                    <span className="text-lg font-bold text-[#23a55a]">{presentCount}</span>
                    <span className="text-[10px] text-[#949ba4] block uppercase font-semibold">
                      Present
                    </span>
                  </div>
                  <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-yellow-500/20">
                    <span className="text-lg font-bold text-[#f0b232]">{lateCount}</span>
                    <span className="text-[10px] text-[#949ba4] block uppercase font-semibold">
                      Late
                    </span>
                  </div>
                  <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-red-500/20">
                    <span className="text-lg font-bold text-[#f23f43]">{absentCount}</span>
                    <span className="text-[10px] text-[#949ba4] block uppercase font-semibold">
                      Absent
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Attendance List */}
              <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl overflow-hidden shadow">
                <div className="p-4 border-b border-[#3f4147] font-bold text-sm text-white flex items-center justify-between">
                  <span>Member Roll Call</span>
                  <span className="text-xs text-[#949ba4] font-normal">
                    {isExecutive ? "One-click toggle attendance status" : "View attendance status"}
                  </span>
                </div>

                <div className="divide-y divide-[#35373c]">
                  {members.map((member) => {
                    const status = getStatusForUser(member.id);

                    return (
                      <div
                        key={member.id}
                        className="p-3.5 flex items-center justify-between hover:bg-[#35373c]/40 transition-colors"
                      >
                        {/* Member profile info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#1e1f22] text-[#dbdee1] flex items-center justify-center font-bold text-xs uppercase">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.full_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(member.full_name)
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-white block">
                              {member.full_name}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${getRoleBadgeClass(
                                member.role
                              )}`}
                            >
                              {getRoleDisplayName(member.role)}
                            </span>
                          </div>
                        </div>

                        {/* Status buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={!isExecutive}
                            onClick={() => handleStatusChange(member.id, "present")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              status === "present"
                                ? "bg-[#23a55a] text-white shadow-md shadow-green-900/30 font-bold"
                                : "bg-[#1e1f22] text-[#949ba4] hover:bg-[#35373c] hover:text-white"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            disabled={!isExecutive}
                            onClick={() => handleStatusChange(member.id, "late")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              status === "late"
                                ? "bg-[#f0b232] text-black shadow-md shadow-amber-900/30 font-bold"
                                : "bg-[#1e1f22] text-[#949ba4] hover:bg-[#35373c] hover:text-white"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Late</span>
                          </button>

                          <button
                            type="button"
                            disabled={!isExecutive}
                            onClick={() => handleStatusChange(member.id, "absent")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              status === "absent"
                                ? "bg-[#f23f43] text-white shadow-md shadow-red-900/30 font-bold"
                                : "bg-[#1e1f22] text-[#949ba4] hover:bg-[#35373c] hover:text-white"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#949ba4]">
              <CalendarCheck2 className="w-12 h-12 mb-3 text-[#5865f2]/50" />
              <p className="text-base font-medium">Select a meeting or schedule a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* New Meeting Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
              <h3 className="text-lg font-bold text-white">Schedule Club Meeting</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#949ba4] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekly Executive Board Sync"
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#b5bac1] mb-1.5">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-white focus:outline-none focus:border-[#5865f2] text-sm"
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
                  disabled={loading}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-[#5865f2] hover:bg-[#4752c4] text-white flex items-center gap-2 shadow"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
