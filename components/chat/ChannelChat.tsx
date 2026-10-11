"use client";

import { useEffect, useRef, useState } from "react";
import { Channel, Message } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MessageItem } from "./MessageItem";
import { ChatHeader } from "./ChatHeader";
import { usePresence } from "@/hooks/usePresence";
import { Send, AtSign, ShieldAlert, Loader2 } from "lucide-react";

interface ChannelChatProps {
  channel: Channel;
  initialMessages: Message[];
}

export function ChannelChat({ channel, initialMessages }: ChannelChatProps) {
  const { user, profile, isExecutive } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { onlineCount } = usePresence(`channel-${channel.id}`);

  const isAnnouncement = channel.type === "announcement";
  const canSend = !isAnnouncement || isExecutive;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Supabase Realtime subscription for channel messages
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

          // Fetch sender profile for the new message
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
            // Check if message is already added (optimistic or duplicate)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, completeMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [channel.id]);

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
        console.error("Error sending message:", error);
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

  const insertMention = (tag: string) => {
    setInput((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#313338] overflow-hidden">
      {/* Header */}
      <ChatHeader
        title={channel.name}
        type={channel.type}
        description={channel.description}
        onlineCount={onlineCount}
      />

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Welcome Banner at the top of channel */}
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

        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-[#313338]">
        {canSend ? (
          <form
            onSubmit={handleSendMessage}
            className="bg-[#383a40] rounded-lg px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#5865f2] transition-all"
          >
            {/* Mention shortcut chips */}
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
  );
}
