"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  KanbanSquare,
  CalendarCheck2,
  HardDrive,
  FileCheck2,
  FileSpreadsheet,
  BookOpen,
  TrendingUp,
  KeyRound,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function IconRail() {
  const pathname = usePathname();
  const { isExecutive } = useAuth();

  const navItems = [
    {
      name: "Channels & DMs",
      href: "/channels",
      icon: MessageSquare,
      active: pathname.startsWith("/channels") || pathname.startsWith("/dm"),
    },
    {
      name: "Kanban Tasks",
      href: "/kanban",
      icon: KanbanSquare,
      active: pathname.startsWith("/kanban"),
    },
    {
      name: "Attendance Tracker",
      href: "/attendance",
      icon: CalendarCheck2,
      active: pathname.startsWith("/attendance"),
    },
    {
      name: "Resource & File Drive",
      href: "/drive",
      icon: HardDrive,
      active: pathname.startsWith("/drive"),
    },
    {
      name: "Meeting Minutes (PVs)",
      href: "/pvs",
      icon: FileCheck2,
      active: pathname.startsWith("/pvs"),
    },
    {
      name: "Official Templates",
      href: "/templates",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/templates"),
    },
    {
      name: "Club Playbook",
      href: "/playbook",
      icon: BookOpen,
      active: pathname.startsWith("/playbook"),
    },
    {
      name: "Analytics & Reports",
      href: "/analytics",
      icon: TrendingUp,
      active: pathname.startsWith("/analytics"),
    },
  ];

  if (isExecutive) {
    navItems.push({
      name: "Invites & Admin",
      href: "/admin/invites",
      icon: KeyRound,
      active: pathname.startsWith("/admin"),
    });
  }

  return (
    <aside className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 flex-shrink-0 border-r border-[#111214] select-none z-20">
      {/* ClubHub Logo */}
      <div className="mb-2">
        <Link
          href="/channels"
          className="group relative flex items-center justify-center w-12 h-12 rounded-3xl hover:rounded-2xl bg-[#5865f2] text-white transition-all duration-200 shadow-md"
          title="ClubHub Workspace"
        >
          <Compass className="w-7 h-7 transition-transform group-hover:rotate-45" />
          <span className="sr-only">ClubHub Workspace</span>
        </Link>
      </div>

      {/* Divider */}
      <div className="w-8 h-[2px] bg-[#35373c] rounded mb-2" />

      {/* Navigation Icons */}
      <div className="flex-1 space-y-1.5 w-full flex flex-col items-center overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="relative group w-full flex justify-center py-0.5">
              {/* Active pill indicator on left edge */}
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r transition-all duration-200 ${
                  item.active
                    ? "h-9"
                    : "h-2 scale-0 group-hover:scale-100 group-hover:h-5"
                }`}
              />

              <Link
                href={item.href}
                className={`flex items-center justify-center w-11 h-11 rounded-3xl transition-all duration-200 ${
                  item.active
                    ? "rounded-2xl bg-[#5865f2] text-white shadow-lg shadow-[#5865f2]/30"
                    : "hover:rounded-2xl bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white"
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
              </Link>

              {/* Tooltip */}
              <div className="absolute left-[76px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1.5 bg-[#111214] text-white text-xs font-semibold rounded shadow-xl whitespace-nowrap z-50">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
