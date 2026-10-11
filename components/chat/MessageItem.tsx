"use client";

import { Message, Profile } from "@/types";
import { formatDateTime, getInitials, getRoleBadgeClass, getRoleDisplayName } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Pin } from "lucide-react";
import { PollWidget } from "./PollWidget";

interface MessageItemProps {
  message: Message & { sender?: Profile };
  onOpenThread?: (message: Message) => void;
  onTogglePin?: (messageId: string) => void;
}

export function MessageItem({
  message,
  onOpenThread,
  onTogglePin,
}: MessageItemProps) {
  const { isExecutive } = useAuth();
  const sender = message.sender;
  const senderName = sender?.full_name || "Unknown Member";
  const role = sender?.role || "member";

  // Check if message is a poll reference
  const isPoll = message.content.startsWith("📊 **LIVE POLL**:");
  // Extract potential poll ID or check if message.poll exists
  const pollId = (message as any).poll_id;

  // Parse and highlight mentions
  const renderContentWithMentions = (text: string) => {
    const parts = text.split(/(@Executive|@MediaTeam|@President|@VicePresident)/gi);
    return parts.map((part, index) => {
      if (part.toLowerCase() === "@executive") {
        return (
          <span key={index} className="mention-executive">
            @Executive
          </span>
        );
      }
      if (part.toLowerCase() === "@mediateam") {
        return (
          <span key={index} className="mention-media">
            @MediaTeam
          </span>
        );
      }
      if (part.toLowerCase() === "@president" || part.toLowerCase() === "@vicepresident") {
        return (
          <span key={index} className="mention-executive">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`relative flex items-start gap-3 px-3 py-2 hover:bg-[#2e3035] rounded-md transition-colors group ${
        message.is_pinned ? "bg-[#35373c]/30 border-l-2 border-[#f0b232]" : ""
      }`}
    >
      {/* Sender Avatar */}
      <div className="w-9 h-9 rounded-full bg-[#1e1f22] text-white flex-shrink-0 flex items-center justify-center font-bold text-xs shadow">
        {sender?.avatar_url ? (
          <img
            src={sender.avatar_url}
            alt={senderName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(senderName)
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
            {senderName}
          </span>
          <span
            className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${getRoleBadgeClass(
              role
            )}`}
          >
            {getRoleDisplayName(role)}
          </span>
          <span className="text-xs text-[#949ba4]">
            {formatDateTime(message.created_at)}
          </span>

          {message.is_pinned && (
            <span className="flex items-center gap-1 text-[10px] text-[#f0b232] font-semibold bg-[#f0b232]/10 px-1.5 py-0.2 rounded border border-[#f0b232]/30">
              <Pin className="w-2.5 h-2.5" /> Pinned
            </span>
          )}
        </div>

        <div className="text-sm text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap">
          {renderContentWithMentions(message.content)}
        </div>

        {/* If poll attached */}
        {pollId && <PollWidget pollId={pollId} />}

        {/* Thread reply count badge */}
        {message.replies_count && message.replies_count > 0 && onOpenThread && (
          <button
            onClick={() => onOpenThread(message)}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5865f2] hover:text-[#7983f5] hover:underline font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{message.replies_count} {message.replies_count === 1 ? "reply" : "replies"}</span>
          </button>
        )}
      </div>

      {/* Hover action toolbar */}
      <div className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2b2d31] border border-[#3f4147] rounded-md shadow-md flex items-center p-0.5 gap-0.5 z-10">
        {onOpenThread && (
          <button
            onClick={() => onOpenThread(message)}
            className="p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors"
            title="Reply in thread"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}

        {isExecutive && onTogglePin && (
          <button
            onClick={() => onTogglePin(message.id)}
            className={`p-1.5 rounded transition-colors ${
              message.is_pinned
                ? "text-[#f0b232] hover:bg-[#35373c]"
                : "text-[#949ba4] hover:text-white hover:bg-[#35373c]"
            }`}
            title={message.is_pinned ? "Unpin message" : "Pin message"}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
