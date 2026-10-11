import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getRoleBadgeClass(role: UserRole): string {
  switch (role) {
    case "president":
      return "bg-purple-900/60 text-purple-300 border border-purple-700/50";
    case "vice_president":
      return "bg-indigo-900/60 text-indigo-300 border border-indigo-700/50";
    case "executive":
      return "bg-blue-900/60 text-blue-300 border border-blue-700/50";
    case "media_team":
      return "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50";
    case "member":
    default:
      return "bg-gray-800 text-gray-300 border border-gray-700/50";
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "president":
      return "President";
    case "vice_president":
      return "Vice President";
    case "executive":
      return "Executive";
    case "media_team":
      return "Media Team";
    case "member":
      return "Member";
    default:
      return role;
  }
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
