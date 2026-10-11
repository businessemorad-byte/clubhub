"use client";

import { useEffect, useRef, useState } from "react";
import { DM, DMMessage, Profile } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MessageItem } from "./MessageItem";
import { ChatHeader } from "./ChatHeader";
import { usePresence } from "@/hooks/usePresence";
import { Send, AtSign, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface DMChatProps {
  dm: DM;
  otherUser: Profile;
  initialMessages: DMMessage[];
}

export function DMChat({ dm, otherUser, initialMessages }: DMChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { isUserOnline } = usePresence("clubhub-global");

  const isOnline = isUserOnline(otherUser.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Supabase Realtime subscription for DM messages
    const realtimeChannel = supabase
      .channel(`dm-${dm.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `dm_id=eq.${dm.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as DMMessage;

          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .single();

          const completeMessage: DMMessage = {
            ...newMsg,
            sender: senderProfile || undefined,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, completeMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [dm.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user || !profile || sending) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase
        .from("dm_messages")
        .insert({
          dm_id: dm.id,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending DM:", error);
        alert(error.message);
      } else if (data) {
        const optimisticMsg: DMMessage = {
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
        title={otherUser.full_name}
        type="dm"
        description={isOnline ? "Active now" : "Offline"}
      />

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* DM greeting banner */}
        <div className="my-6 px-4">
          <div className="w-16 h-16 rounded-full bg-[#5865f2] text-white flex items-center justify-center font-bold text-xl mb-3 shadow">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(otherUser.full_name)
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">{otherUser.full_name}</h2>
          <p className="text-sm text-[#949ba4] mt-1">
            This is the start of your direct message history with {otherUser.full_name}.
          </p>
        </div>

        <div className="w-full h-px bg-[#3f4147] my-4" />

        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={{
              ...message,
              channel_id: dm.id,
            }}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#313338]">
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
              placeholder={`Message @${otherUser.full_name}`}
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
      </div>
    </div>
  );
}
