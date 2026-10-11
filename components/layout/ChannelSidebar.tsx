"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hash,
  Megaphone,
  Lock,
  ChevronDown,
  User as UserIcon,
  MessageSquarePlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Channel, Profile, isPresidency } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { UserStatusFooter } from "./UserStatusFooter";
import { getInitials, getRoleBadgeClass } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";

export function ChannelSidebar() {
  const pathname = usePathname();
  const { user, profile, isExecutive } = useAuth();
  const isPresidentOrVP = isPresidency(profile?.role);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const { isUserOnline } = usePresence("clubhub-global");
  const supabase = createClient();

  useEffect(() => {
    // Fetch channels
    const fetchChannels = async () => {
      const { data } = await supabase
        .from("channels")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setChannels(data as Channel[]);
    };

    // Fetch members for DMs
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user?.id || "")
        .order("full_name", { ascending: true });
      if (data) setMembers(data as Profile[]);
    };

    fetchChannels();
    fetchMembers();
  }, [user?.id]);

  const announcementChannels = channels.filter((c) => c.type === "announcement");
  const publicChannels = channels.filter((c) => c.type === "public");
  const executiveChannels = channels.filter((c) => c.type === "executive");

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col h-screen select-none border-r border-[#1e1f22]">
      {/* Workspace Header */}
      <div className="h-12 border-b border-[#1e1f22] px-4 flex items-center justify-between font-bold text-white shadow-sm hover:bg-[#35373c] transition-colors cursor-pointer">
        <span className="truncate">ClubHub Workspace</span>
        <ChevronDown className="w-4 h-4 text-[#949ba4]" />
      </div>

      {/* Channel list / DM list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Announcements */}
        {announcementChannels.length > 0 && (
          <div>
            <div className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Announcements</span>
            </div>
            <div className="space-y-0.5">
              {announcementChannels.map((channel) => {
                const isActive = pathname === `/channels/${channel.name}` || pathname === `/channels/${channel.id}`;
                return (
                  <Link
                    key={channel.id}
                    href={`/channels/${channel.name}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition duration-150 ${
                      isActive
                        ? "bg-[#35373c] text-white font-medium"
                        : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-[#5865f2] flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Text Channels */}
        <div>
          <div className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1">
            Text Channels
          </div>
          <div className="space-y-0.5">
            {publicChannels.map((channel) => {
              const isActive = pathname === `/channels/${channel.name}` || pathname === `/channels/${channel.id}`;
              return (
                <Link
                  key={channel.id}
                  href={`/channels/${channel.name}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition duration-150 ${
                    isActive
                      ? "bg-[#35373c] text-white font-medium"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  <Hash className="w-4 h-4 text-[#949ba4] flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Executive Channels (President & Vice-President) */}
        {isPresidentOrVP && executiveChannels.length > 0 && (
          <div>
            <div className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Executive Only</span>
              <Lock className="w-3 h-3 text-[#f0b232]" />
            </div>
            <div className="space-y-0.5">
              {executiveChannels.map((channel) => {
                const isActive = pathname === `/channels/${channel.name}` || pathname === `/channels/${channel.id}`;
                return (
                  <Link
                    key={channel.id}
                    href={`/channels/${channel.name}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition duration-150 ${
                      isActive
                        ? "bg-[#35373c] text-white font-medium"
                        : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                    }`}
                  >
                    <Lock className="w-4 h-4 text-[#f0b232] flex-shrink-0" />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Direct Messages */}
        <div>
          <div className="px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Direct Messages</span>
            <MessageSquarePlus className="w-3.5 h-3.5 text-[#949ba4]" />
          </div>
          <div className="space-y-0.5">
            {members.map((member) => {
              const isActive = pathname === `/dm/${member.id}`;
              const isOnline = isUserOnline(member.id);

              return (
                <Link
                  key={member.id}
                  href={`/dm/${member.id}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition duration-150 group ${
                    isActive
                      ? "bg-[#35373c] text-white font-medium"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-[#1e1f22] text-[#dbdee1] flex items-center justify-center text-[10px] font-bold">
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
                    {/* Realtime online status dot */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#2b2d31] ${
                        isOnline ? "bg-[#23a55a]" : "bg-[#80848e]"
                      }`}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <span className="truncate flex-1">{member.full_name}</span>
                </Link>
              );
            })}
            {members.length === 0 && (
              <div className="px-2 text-xs text-[#80848e] italic">
                No other members yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Status Bar at the bottom */}
      <UserStatusFooter />
    </div>
  );
}
