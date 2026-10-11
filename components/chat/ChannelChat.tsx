"use client";

import { useEffect, useRef, useState } from "react";
import { Channel, Message } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MessageItem } from "./MessageItem";
import { ChatHeader } from "./ChatHeader";
import { ThreadPanel } from "./ThreadPanel";
import { PinnedMessagesModal } from "./PinnedMessagesModal";
import { CreatePollModal } from "./CreatePollModal";
import { usePresence } from "@/hooks/usePresence";
import { togglePinMessageAction, verifyExecutivePasscodeAction } from "@/app/actions/chatEnhancements";
import { Send, AtSign, ShieldAlert, Loader2, KeyRound, Lock } from "lucide-react";

interface ChannelChatProps {
  channel: Channel;
  initialMessages: Message[];
}

export function ChannelChat({ channel, initialMessages }: ChannelChatProps) {
  const { user, profile, isExecutive } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeThreadMessage, setActiveThreadMessage] = useState<Message | null>(null);
  const [pinnedModalOpen, setPinnedModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);

  // Private room password unlock state
  const isPrivateRoom = channel.type === "executive";
  const [isUnlocked, setIsUnlocked] = useState(!isPrivateRoom);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { onlineCount } = usePresence(`channel-${channel.id}`);

  const isAnnouncement = channel.type === "announcement";
  const canSend = !isAnnouncement || isExecutive;

  const pinnedMessages = messages.filter((m) => m.is_pinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if user already unlocked this room in session storage
    if (isPrivateRoom && typeof window !== "undefined") {
      const unlocked = sessionStorage.getItem(`unlocked-${channel.id}`);
      if (unlocked === "true") {
        setIsUnlocked(true);
      }
    }
  }, [channel.id, isPrivateRoom]);

  useEffect(() => {
    if (!isUnlocked) return;

    const realtimeChannel = supabase
      .channel(`chat-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Don't append replies to the main feed if they have a parent_id
          if (newMsg.parent_id) return;

          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .single();

          const completeMessage: Message = {
            ...newMsg,
            sender: senderProfile || undefined,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, completeMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [channel.id, isUnlocked]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user || !profile || !canSend || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          channel_id: channel.id,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) {
        alert(error.message);
      } else if (data) {
        const optimisticMsg: Message = {
          ...data,
          sender: profile,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, optimisticMsg];
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleTogglePin = async (messageId: string) => {
    await togglePinMessageAction(messageId, channel.id);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, is_pinned: !m.is_pinned } : m))
    );
  };

  const handleUnlockPrivateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setVerifying(true);

    const result = await verifyExecutivePasscodeAction(channel.name, passcode);
    if (result.error) {
      setPasscodeError(result.error);
    } else {
      setIsUnlocked(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`unlocked-${channel.id}`, "true");
      }
    }
    setVerifying(false);
  };

  const insertMention = (tag: string) => {
    setInput((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  };

  // Passcode gate for Executive Private Room
  if (isPrivateRoom && !isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#313338]">
        <div className="bg-[#2b2d31] border border-[#3f4147] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-14 h-14 bg-[#f0b232]/20 border border-[#f0b232]/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#f0b232]">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Restricted Executive Room</h2>
          <p className="text-xs text-[#949ba4] mb-6">
            This private boardroom is protected. Enter the executive security passcode to access #{channel.name}.
          </p>

          {passcodeError && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
              {passcodeError}
            </div>
          )}

          <form onSubmit={handleUnlockPrivateRoom} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter room passcode (Default: CLUB2026)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e1f22] border border-[#3f4147] rounded-xl text-white text-sm focus:outline-none focus:border-[#5865f2] font-mono tracking-wider"
              />
              <KeyRound className="w-4 h-4 text-[#949ba4] absolute left-3.5 top-3" />
            </div>

            <button
              type="submit"
              disabled={verifying || !passcode.trim()}
              className="w-full py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-xl text-sm transition-colors shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Room"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter messages in main feed to those without parent_id (threads are inside side panel)
  const mainMessages = messages.filter((m) => !m.parent_id);

  return (
    <div className="flex-1 flex h-full bg-[#313338] overflow-hidden">
      {/* Main Channel Chat Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <ChatHeader
          title={channel.name}
          type={channel.type}
          description={channel.description}
          onlineCount={onlineCount}
          pinnedCount={pinnedMessages.length}
          onOpenPinned={() => setPinnedModalOpen(true)}
          onOpenCreatePoll={() => setPollModalOpen(true)}
        />

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="my-6 px-4">
            <div className="w-14 h-14 rounded-full bg-[#35373c] flex items-center justify-center text-white mb-2">
              <span className="text-2xl font-bold">#</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome to #{channel.name}!</h2>
            <p className="text-sm text-[#949ba4] mt-1">
              {channel.description || `This is the start of the #${channel.name} channel.`}
            </p>
          </div>

          <div className="w-full h-px bg-[#3f4147] my-4" />

          {mainMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onOpenThread={(msg) => setActiveThreadMessage(msg)}
              onTogglePin={handleTogglePin}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-[#313338]">
          {canSend ? (
            <form
              onSubmit={handleSendMessage}
              className="bg-[#383a40] rounded-lg px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#5865f2] transition-all"
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#43444b] text-xs text-[#949ba4]">
                <span className="flex items-center gap-1 font-semibold text-[#b5bac1]">
                  <AtSign className="w-3.5 h-3.5" /> Mention:
                </span>
                <button
                  type="button"
                  onClick={() => insertMention("@Executive")}
                  className="px-2 py-0.5 rounded bg-[#5865f2]/20 hover:bg-[#5865f2]/30 text-[#c9cdfb] font-medium transition-colors"
                >
                  @Executive
                </button>
                <button
                  type="button"
                  onClick={() => insertMention("@MediaTeam")}
                  className="px-2 py-0.5 rounded bg-[#23a55a]/20 hover:bg-[#23a55a]/30 text-[#8ce3b3] font-medium transition-colors"
                >
                  @MediaTeam
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message #${channel.name}`}
                  className="flex-1 bg-transparent text-[#dbdee1] placeholder-[#80848e] text-sm focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-1.5 rounded-md bg-[#5865f2] hover:bg-[#4752c4] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#2b2d31] border border-[#3f4147] rounded-lg p-3 text-center flex items-center justify-center gap-2 text-sm text-[#949ba4]">
              <ShieldAlert className="w-4 h-4 text-[#f0b232]" />
              <span>
                This is an announcement channel. Only club executives can post here.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel: Thread contextual replies */}
      {activeThreadMessage && (
        <ThreadPanel
          parentMessage={activeThreadMessage}
          channelId={channel.id}
          onClose={() => setActiveThreadMessage(null)}
        />
      )}

      {/* Modal: Pinned Messages */}
      {pinnedModalOpen && (
        <PinnedMessagesModal
          channelId={channel.id}
          pinnedMessages={pinnedMessages}
          onClose={() => setPinnedModalOpen(false)}
          onUnpinned={(id) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, is_pinned: false } : m))
            );
          }}
        />
      )}

      {/* Modal: Create Poll */}
      {pollModalOpen && (
        <CreatePollModal
          channelId={channel.id}
          onClose={() => setPollModalOpen(false)}
          onSuccess={() => {
            // Poll created; message was posted
          }}
        />
      )}
    </div>
  );
}
