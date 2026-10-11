"use client";

import { Hash, Megaphone, Lock, Users, Pin, BarChart2 } from "lucide-react";
import { ChannelType } from "@/types";

interface ChatHeaderProps {
  title: string;
  type?: ChannelType;
  description?: string | null;
  onlineCount?: number;
  pinnedCount?: number;
  onOpenPinned?: () => void;
  onOpenCreatePoll?: () => void;
}

export function ChatHeader({
  title,
  type = "public",
  description,
  onlineCount,
  pinnedCount = 0,
  onOpenPinned,
  onOpenCreatePoll,
}: ChatHeaderProps) {
  const renderIcon = () => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-5 h-5 text-[#5865f2]" />;
      case "executive":
        return <Lock className="w-5 h-5 text-[#f0b232]" />;
      case "dm":
        return <div className="w-2.5 h-2.5 rounded-full bg-[#23a55a] mr-1" />;
      default:
        return <Hash className="w-5 h-5 text-[#949ba4]" />;
    }
  };

  return (
    <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between shadow-sm bg-[#313338] z-10 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {renderIcon()}
        <span className="font-bold text-white text-base truncate">{title}</span>

        {description && (
          <>
            <span className="text-[#4e5058] hidden sm:inline">|</span>
            <span className="text-xs text-[#949ba4] truncate hidden sm:inline">
              {description}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onOpenCreatePoll && (
          <button
            onClick={onOpenCreatePoll}
            className="p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors flex items-center gap-1 text-xs"
            title="Create Poll"
          >
            <BarChart2 className="w-4 h-4 text-[#5865f2]" />
            <span className="hidden md:inline">Poll</span>
          </button>
        )}

        {onOpenPinned && (
          <button
            onClick={onOpenPinned}
            className="p-1.5 text-[#949ba4] hover:text-[#f0b232] hover:bg-[#35373c] rounded transition-colors flex items-center gap-1 text-xs relative"
            title="View Pinned Messages"
          >
            <Pin className="w-4 h-4" />
            {pinnedCount > 0 && (
              <span className="bg-[#f0b232] text-black font-bold text-[9px] px-1 rounded-full">
                {pinnedCount}
              </span>
            )}
          </button>
        )}

        {onlineCount !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-[#949ba4] bg-[#2b2d31] px-2.5 py-1 rounded-full border border-[#3f4147]">
            <div className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
            <Users className="w-3.5 h-3.5" />
            <span>{onlineCount} online</span>
          </div>
        )}
      </div>
    </div>
  );
}
