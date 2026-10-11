"use client";

import { useEffect, useState } from "react";
import { Poll, PollOption, PollVote } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { votePollAction, closePollAction } from "@/app/actions/chatEnhancements";
import { BarChart3, CheckCircle2, Lock, Loader2 } from "lucide-react";

interface PollWidgetProps {
  pollId: string;
}

export function PollWidget({ pollId }: PollWidgetProps) {
  const { user, isExecutive } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const supabase = createClient();

  const fetchPollData = async () => {
    try {
      const { data: pollData } = await supabase
        .from("polls")
        .select(`
          *,
          creator:profiles (*)
        `)
        .eq("id", pollId)
        .single();

      if (pollData) setPoll(pollData as Poll);

      const { data: optionsData } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", pollId)
        .order("order", { ascending: true });

      if (optionsData) setOptions(optionsData as PollOption[]);

      const { data: votesData } = await supabase
        .from("poll_votes")
        .select("*")
        .eq("poll_id", pollId);

      if (votesData) setVotes(votesData as PollVote[]);
    } catch (e) {
      console.error("Error fetching poll data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPollData();

    // Realtime subscription for votes and poll status
    const channel = supabase
      .channel(`poll-${pollId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes", filter: `poll_id=eq.${pollId}` },
        () => {
          fetchPollData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "polls", filter: `id=eq.${pollId}` },
        (payload) => {
          setPoll((prev) => (prev ? { ...prev, is_closed: (payload.new as any).is_closed } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  if (loading) {
    return (
      <div className="bg-[#2b2d31] border border-[#3f4147] rounded-xl p-4 my-2 flex items-center justify-center gap-2 text-xs text-[#949ba4]">
        <Loader2 className="w-4 h-4 animate-spin text-[#5865f2]" />
        <span>Loading poll...</span>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = votes.length;
  const userVote = votes.find((v) => v.user_id === user?.id);
  const isCreator = poll.creator_id === user?.id;
  const canClose = (isCreator || isExecutive) && !poll.is_closed;

  const handleVote = async (optionId: string) => {
    if (poll.is_closed || voting || !user) return;
    setVoting(true);
    await votePollAction(poll.id, optionId);
    await fetchPollData();
    setVoting(false);
  };

  const handleClose = async () => {
    if (!confirm("Are you sure you want to end this poll?")) return;
    await closePollAction(poll.id);
  };

  return (
    <div className="bg-[#2b2d31] border border-[#3f4147] hover:border-[#5865f2]/40 rounded-xl p-4 my-2 max-w-lg shadow-md transition-all">
      {/* Poll Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm leading-snug">{poll.question}</h4>
            <span className="text-[11px] text-[#949ba4]">
              by {poll.creator?.full_name || "Member"} • {totalVotes} vote{totalVotes === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {poll.is_closed ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Closed
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-950/60 border border-green-500/40 text-green-300">
              Live
            </span>
          )}

          {canClose && (
            <button
              onClick={handleClose}
              className="text-[11px] text-[#949ba4] hover:text-red-400 hover:underline"
            >
              End Poll
            </button>
          )}
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2 mt-2">
        {options.map((option) => {
          const optionVotes = votes.filter((v) => v.option_id === option.id).length;
          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const isSelected = userVote?.option_id === option.id;

          return (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={`relative overflow-hidden rounded-lg p-2.5 border transition-all ${
                poll.is_closed
                  ? "cursor-default"
                  : "cursor-pointer hover:border-[#5865f2]/70 active:scale-[0.99]"
              } ${
                isSelected
                  ? "border-[#5865f2] bg-[#35373c]"
                  : "border-[#3f4147] bg-[#1e1f22]"
              }`}
            >
              {/* Progress bar background */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  isSelected ? "bg-[#5865f2]/30" : "bg-[#383a40]/60"
                }`}
                style={{ width: `${percentage}%` }}
              />

              {/* Option label & metrics */}
              <div className="relative flex items-center justify-between z-10 text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5865f2] flex-shrink-0" />
                  )}
                  <span className={`truncate font-medium ${isSelected ? "text-white font-bold" : "text-[#dbdee1]"}`}>
                    {option.text}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-[#949ba4]">
                  <span className="font-semibold text-white">{percentage}%</span>
                  <span className="text-[10px]">({optionVotes})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
