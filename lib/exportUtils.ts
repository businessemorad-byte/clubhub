"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Meeting, Profile, Attendance, Task } from "@/types";
import { formatDate } from "@/lib/utils";

// 1. Export Attendance to PDF
export function exportAttendanceToPDF(
  meetings: Meeting[],
  members: Profile[],
  attendance: Attendance[]
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.setTextColor(30, 31, 34);
  doc.text("ClubHub Official Attendance Report", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Members: ${members.length} | Meetings Tracked: ${meetings.length}`, 14, 28);

  const head = [["Member Name", "Role", ...meetings.map((m) => `${m.title} (${formatDate(m.date)})`), "Attendance Rate"]];

  const body = members.map((member) => {
    let presentCount = 0;
    const meetingStatuses = meetings.map((m) => {
      const record = attendance.find((a) => a.meeting_id === m.id && a.user_id === member.id);
      const status = record?.status || "absent";
      if (status === "present" || status === "late") presentCount++;
      return status.toUpperCase();
    });

    const rate = meetings.length > 0 ? `${Math.round((presentCount / meetings.length) * 100)}%` : "N/A";

    return [member.full_name, member.role.toUpperCase(), ...meetingStatuses, rate];
  });

  autoTable(doc, {
    startY: 34,
    head,
    body,
    theme: "striped",
    headStyles: { fillColor: [88, 101, 242] },
    styles: { fontSize: 8 },
  });

  doc.save(`ClubHub_Attendance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 2. Export Attendance to Excel (.xlsx)
export function exportAttendanceToExcel(
  meetings: Meeting[],
  members: Profile[],
  attendance: Attendance[]
) {
  const rows = members.map((member) => {
    const rowObj: Record<string, any> = {
      "Full Name": member.full_name,
      Email: member.email,
      Role: member.role,
    };

    let attended = 0;
    meetings.forEach((m) => {
      const record = attendance.find((a) => a.meeting_id === m.id && a.user_id === member.id);
      const status = record?.status || "absent";
      if (status === "present" || status === "late") attended++;
      rowObj[`${m.title} (${formatDate(m.date)})`] = status;
    });

    rowObj["Attendance Rate"] = meetings.length > 0 ? `${Math.round((attended / meetings.length) * 100)}%` : "0%";
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  XLSX.writeFile(workbook, `ClubHub_Attendance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 3. Export Activity & Tasks to PDF
export function exportActivityReportToPDF(
  tasks: Task[],
  members: Profile[],
  meetings: Meeting[]
) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(30, 31, 34);
  doc.text("ClubHub Semester Activity & Project Report", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Projects: ${tasks.length}`, 14, 28);

  const head = [["Task / Deliverable", "Priority", "Assignee", "Deadline"]];
  const body = tasks.map((t) => [
    t.title,
    t.priority.toUpperCase(),
    t.assignee?.full_name || "Unassigned",
    t.deadline ? formatDate(t.deadline) : "None",
  ]);

  autoTable(doc, {
    startY: 34,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: [35, 165, 90] },
    styles: { fontSize: 9 },
  });

  doc.save(`ClubHub_Activity_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// 4. Export Activity & Tasks to Excel (.xlsx)
export function exportActivityReportToExcel(tasks: Task[]) {
  const rows = tasks.map((t) => ({
    "Task Title": t.title,
    Priority: t.priority,
    Assignee: t.assignee?.full_name || "Unassigned",
    Deadline: t.deadline ? formatDate(t.deadline) : "N/A",
    "Subtasks Completed": t.subtasks ? `${t.subtasks.filter((s) => s.done).length}/${t.subtasks.length}` : "0/0",
    "Created Date": formatDate(t.created_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks_Activity");

  XLSX.writeFile(workbook, `ClubHub_Activity_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
