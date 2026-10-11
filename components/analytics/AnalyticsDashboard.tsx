"use client";

import { useState } from "react";
import {
  Meeting,
  Profile,
  Attendance,
  Task,
  TaskColumn,
  MemberPerformance,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getRoleBadgeClass, getRoleDisplayName, getInitials, formatDate } from "@/lib/utils";
import {
  exportAttendanceToPDF,
  exportAttendanceToExcel,
  exportActivityReportToPDF,
  exportActivityReportToExcel,
} from "@/lib/exportUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  CalendarCheck2,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Award,
} from "lucide-react";

interface AnalyticsDashboardProps {
  meetings: Meeting[];
  members: Profile[];
  attendance: Attendance[];
  tasks: Task[];
  columns: TaskColumn[];
}

const COLORS = ["#5865f2", "#23a55a", "#f0b232", "#f23f43", "#9b59b6"];

export function AnalyticsDashboard({
  meetings,
  members,
  attendance,
  tasks,
  columns,
}: AnalyticsDashboardProps) {
  const { isExecutive } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Calculate Member Performance metrics
  const memberPerformances: MemberPerformance[] = members.map((member) => {
    const memberAttendance = attendance.filter((a) => a.user_id === member.id);
    const presentCount = memberAttendance.filter((a) => a.status === "present").length;
    const lateCount = memberAttendance.filter((a) => a.status === "late").length;
    const absentCount = memberAttendance.filter((a) => a.status === "absent").length;
    const totalMeetings = meetings.length;

    const attendanceRate =
      totalMeetings > 0
        ? Math.round(((presentCount + lateCount * 0.5) / totalMeetings) * 100)
        : 100;

    const assignedTasks = tasks.filter((t) => t.assignee_id === member.id);
    // Task is completed if in a column named "Done"
    const doneColId = columns.find((c) => c.name.toLowerCase().includes("done"))?.id;
    const completedTasks = assignedTasks.filter((t) => t.column_id === doneColId).length;

    // Contributions score formula
    const score = Math.round(
      attendanceRate * 0.5 + completedTasks * 15 + presentCount * 5
    );

    return {
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      avatar_url: member.avatar_url,
      attendance_rate: attendanceRate,
      present_count: presentCount,
      late_count: lateCount,
      absent_count: absentCount,
      total_meetings: totalMeetings,
      completed_tasks: completedTasks,
      total_tasks: assignedTasks.length,
      messages_sent: 0,
      score,
    };
  });

  // KPI calculations
  const totalTasks = tasks.length;
  const doneColId = columns.find((c) => c.name.toLowerCase().includes("done"))?.id;
  const completedTasks = tasks.filter((t) => t.column_id === doneColId).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalPossibleAttendance = meetings.length * members.length;
  const totalAttended = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const overallAttendanceRate =
    totalPossibleAttendance > 0
      ? Math.round((totalAttended / totalPossibleAttendance) * 100)
      : 100;

  // Chart 1: Attendance Turnout by Meeting
  const meetingTurnoutData = meetings.map((m) => {
    const meetingRecords = attendance.filter((a) => a.meeting_id === m.id);
    const present = meetingRecords.filter((a) => a.status === "present" || a.status === "late").length;
    const rate = members.length > 0 ? Math.round((present / members.length) * 100) : 0;
    return {
      name: m.title.length > 15 ? m.title.substring(0, 15) + "..." : m.title,
      turnout: rate,
      present,
    };
  });

  // Chart 2: Task distribution across columns
  const taskColumnData = columns.map((col) => {
    const count = tasks.filter((t) => t.column_id === col.id).length;
    return {
      name: col.name,
      value: count,
    };
  });

  // Filtering members table
  const filteredMembers = memberPerformances.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || m.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-y-auto p-6 md:p-8 space-y-8">
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#3f4147]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#5865f2]" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Club Analytics & Member Profiles
            </h1>
          </div>
          <p className="text-xs text-[#949ba4] mt-1">
            Real-time metric tracking for meetings, deliverables, and member engagement.
          </p>
        </div>

        {/* Executive Exports */}
        {isExecutive && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportAttendanceToPDF(meetings, members, attendance)}
              className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
              title="Export Attendance as PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>Attendance PDF</span>
            </button>

            <button
              onClick={() => exportAttendanceToExcel(meetings, members, attendance)}
              className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
              title="Export Attendance as Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
              <span>Attendance Excel</span>
            </button>

            <button
              onClick={() => exportActivityReportToPDF(tasks, members, meetings)}
              className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
              title="Export Activity Report as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Activity PDF</span>
            </button>

            <button
              onClick={() => exportActivityReportToExcel(tasks)}
              className="px-3 py-1.5 bg-[#23a55a] hover:bg-[#1f934f] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
              title="Export Activity Report as Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Activity Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-[#949ba4] font-semibold uppercase mb-1">
            <span>Overall Turnout</span>
            <CalendarCheck2 className="w-4 h-4 text-[#23a55a]" />
          </div>
          <div className="text-2xl font-black text-white">{overallAttendanceRate}%</div>
          <span className="text-[11px] text-[#949ba4] block mt-1">
            Across {meetings.length} meeting{meetings.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-[#949ba4] font-semibold uppercase mb-1">
            <span>Task Completion</span>
            <CheckCircle2 className="w-4 h-4 text-[#5865f2]" />
          </div>
          <div className="text-2xl font-black text-white">{taskCompletionRate}%</div>
          <span className="text-[11px] text-[#949ba4] block mt-1">
            {completedTasks} of {totalTasks} deliverables done
          </span>
        </div>

        <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-[#949ba4] font-semibold uppercase mb-1">
            <span>Total Members</span>
            <Users className="w-4 h-4 text-[#f0b232]" />
          </div>
          <div className="text-2xl font-black text-white">{members.length}</div>
          <span className="text-[11px] text-[#949ba4] block mt-1">
            Registered on workspace
          </span>
        </div>

        <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-[#949ba4] font-semibold uppercase mb-1">
            <span>Active Initiatives</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTasks - completedTasks}</div>
          <span className="text-[11px] text-[#949ba4] block mt-1">
            Projects in progress
          </span>
        </div>
      </div>

      {/* Visual Charts Row (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Turnout per Meeting Bar Chart */}
        <div className="lg:col-span-2 bg-[#2b2d31] border border-[#3f4147] rounded-xl p-5 shadow">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center justify-between">
            <span>Meeting Attendance Turnout Rate (%)</span>
            <span className="text-xs text-[#949ba4] font-normal">Per Scheduled Session</span>
          </h3>
          <div className="h-64 w-full">
            {meetingTurnoutData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#949ba4] italic">
                Schedule meetings in Attendance tracker to display trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meetingTurnoutData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#35373c" />
                  <XAxis dataKey="name" stroke="#949ba4" fontSize={11} />
                  <YAxis stroke="#949ba4" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1f22", borderColor: "#3f4147", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="turnout" fill="#5865f2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Columns Distribution Pie Chart */}
        <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-5 shadow flex flex-col">
          <h3 className="font-bold text-white text-sm mb-2">
            Kanban Task Distribution
          </h3>
          <div className="h-56 w-full flex-1">
            {tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#949ba4] italic">
                No tasks created on Kanban board.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskColumnData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskColumnData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e1f22", borderColor: "#3f4147", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            {taskColumnData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-[#949ba4]">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Performance Profiles Table */}
      <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl overflow-hidden shadow">
        <div className="p-4 border-b border-[#3f4147] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base">
              Member Performance Profiles
            </h3>
            <p className="text-xs text-[#949ba4]">
              Individual accountability, completed deliverables, and contribution score.
            </p>
          </div>

          {/* Filter / Search input */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search member..."
                className="pl-8 pr-3 py-1.5 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-xs text-white focus:outline-none focus:border-[#5865f2]"
              />
              <Search className="w-3.5 h-3.5 text-[#949ba4] absolute left-2.5 top-2.5" />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2.5 py-1.5 bg-[#1e1f22] border border-[#3f4147] rounded-lg text-xs text-white focus:outline-none focus:border-[#5865f2]"
            >
              <option value="all">All Roles</option>
              <option value="president">President</option>
              <option value="vice_president">Vice President</option>
              <option value="executive">Executive</option>
              <option value="media_team">Media Team</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>

        {/* Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e1f22] text-[#949ba4] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Present / Late / Absent</th>
                <th className="py-3 px-4">Tasks Completed</th>
                <th className="py-3 px-4 text-right">Contribution Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#35373c] text-[#dbdee1]">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#35373c]/30 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#1e1f22] text-white flex items-center justify-center font-bold text-xs uppercase shadow">
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
                      <span className="font-semibold text-white block">
                        {member.full_name}
                      </span>
                      <span className="text-[11px] text-[#949ba4]">{member.email}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${getRoleBadgeClass(
                        member.role
                      )}`}
                    >
                      {getRoleDisplayName(member.role)}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold">
                    <span
                      className={
                        member.attendance_rate >= 75
                          ? "text-[#23a55a]"
                          : member.attendance_rate >= 50
                          ? "text-[#f0b232]"
                          : "text-[#f23f43]"
                      }
                    >
                      {member.attendance_rate}%
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[#949ba4]">
                    <span className="text-[#23a55a] font-semibold">{member.present_count}P</span>{" "}
                    • <span className="text-[#f0b232] font-semibold">{member.late_count}L</span>{" "}
                    • <span className="text-[#f23f43] font-semibold">{member.absent_count}A</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-white">
                      {member.completed_tasks}
                    </span>{" "}
                    <span className="text-[#949ba4]">
                      / {member.total_tasks} assigned
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-base text-[#5865f2] bg-[#5865f2]/10 px-2.5 py-1 rounded-full border border-[#5865f2]/30">
                      ★ {member.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
