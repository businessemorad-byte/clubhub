"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { sendThreadReplyAction } from "@/app/actions/chatEnhancements";
import { MessageItem } from "./MessageItem";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";

interface ThreadPanelProps {
  parentMessage: Message;
  channelId: string;
  onClose: () => void;
}

export function ThreadPanel({ parentMessage, channelId, onClose }: ThreadPanelProps) {
  const { user, profile } = useAuth();
  const [replies, setReplies] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const fetchReplies = async () => {
    try {
      const { data } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles (*)
        `)
        .eq("parent_id", parentMessage.id)
        .order("created_at", { ascending: true });

      if (data) setReplies(data as Message[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();

    const channel = supabase
      .channel(`thread-${parentMessage.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `parent_id=eq.${parentMessage.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.sender_id)
            .single();

          const completeMsg = { ...newMsg, sender: senderProfile || undefined };
          setReplies((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, completeMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentMessage.id]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !user || !profile) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    const result = await sendThreadReplyAction(channelId, parentMessage.id, content);
    if (result.error) {
      alert(result.error);
    } else if (result.message) {
      setReplies((prev) => {
        if (prev.some((m) => m.id === result.message.id)) return prev;
        return [...prev, result.message];
      });
    }
    setSending(false);
  };

  return (
    <div className="w-80 md:w-96 border-l border-[#1f2023] bg-[#2b2d31] flex flex-col h-full z-20 shadow-xl flex-shrink-0">
      {/* Header */}
      <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between bg-[#313338]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#5865f2]" />
          <h3 className="font-bold text-white text-sm">Thread</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#949ba4] hover:text-white rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Parent Message Card */}
        <div className="p-2 bg-[#1e1f22]/60 rounded-lg border border-[#3f4147]/50">
          <MessageItem message={parentMessage} />
        </div>

        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-px bg-[#3f4147] flex-1" />
          <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </span>
          <div className="h-px bg-[#3f4147] flex-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-[#949ba4] gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#5865f2]" />
            <span>Loading replies...</span>
          </div>
        ) : (
          replies.map((reply) => <MessageItem key={reply.id} message={reply} />)
        )}

        <div ref={repliesEndRef} />
      </div>

      {/* Reply input */}
      <div className="p-3 bg-[#313338] border-t border-[#1f2023]">
        <form onSubmit={handleSendReply} className="flex items-center gap-2 bg-[#383a40] rounded-lg px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1 bg-transparent text-xs text-[#dbdee1] focus:outline-none placeholder-[#80848e]"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-1 rounded bg-[#5865f2] text-white disabled:opacity-40 hover:bg-[#4752c4]"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
