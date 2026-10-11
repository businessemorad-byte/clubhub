"use client";

import { Message, Profile } from "@/types";
import { formatDateTime, getInitials, getRoleBadgeClass, getRoleDisplayName } from "@/lib/utils";

interface MessageItemProps {
  message: Message & { sender?: Profile };
}

export function MessageItem({ message }: MessageItemProps) {
  const sender = message.sender;
  const senderName = sender?.full_name || "Unknown Member";
  const role = sender?.role || "member";

  // Parse and highlight mentions: @Executive, @MediaTeam, @President, etc.
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
    <div className="flex items-start gap-4 px-4 py-2 hover:bg-[#2e3035] rounded-md transition-colors group">
      {/* Sender Avatar */}
      <div className="w-10 h-10 rounded-full bg-[#1e1f22] text-white flex-shrink-0 flex items-center justify-center font-bold text-sm shadow">
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
        <div className="flex items-baseline gap-2 mb-1">
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
        </div>

        <div className="text-sm text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap">
          {renderContentWithMentions(message.content)}
        </div>
      </div>
    </div>
  );
}
