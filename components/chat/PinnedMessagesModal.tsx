"use client";

import { Message } from "@/types";
import { MessageItem } from "./MessageItem";
import { useAuth } from "@/context/AuthContext";
import { togglePinMessageAction } from "@/app/actions/chatEnhancements";
import { Pin, X, Trash2 } from "lucide-react";

interface PinnedMessagesModalProps {
  channelId: string;
  pinnedMessages: Message[];
  onClose: () => void;
  onUnpinned: (messageId: string) => void;
}

export function PinnedMessagesModal({
  channelId,
  pinnedMessages,
  onClose,
  onUnpinned,
}: PinnedMessagesModalProps) {
  const { isExecutive } = useAuth();

  const handleUnpin = async (messageId: string) => {
    if (!isExecutive) return;
    await togglePinMessageAction(messageId, channelId);
    onUnpinned(messageId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#313338] border border-[#3f4147] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#3f4147] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-[#f0b232]" />
            <h3 className="text-base font-bold text-white">Pinned Messages</h3>
            <span className="text-xs bg-[#1e1f22] text-[#949ba4] px-2 py-0.5 rounded-full font-semibold">
              {pinnedMessages.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-[#949ba4] hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {pinnedMessages.length === 0 ? (
            <div className="text-center py-12 text-[#949ba4] text-xs italic">
              No pinned messages in this channel yet.
            </div>
          ) : (
            pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="bg-[#2b2d31] border border-[#3f4147] rounded-lg p-2.5 relative group hover:border-[#5865f2]/40 transition-colors"
              >
                <MessageItem message={msg} />

                {isExecutive && (
                  <button
                    onClick={() => handleUnpin(msg.id)}
                    className="absolute top-2 right-2 p-1.5 bg-[#1e1f22] hover:bg-red-950/60 rounded text-[#949ba4] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs flex items-center gap-1 shadow"
                    title="Unpin Message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unpin</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
