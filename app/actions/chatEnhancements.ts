"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExecutive, isPresidency } from "@/types";
import { revalidatePath } from "next/cache";

export async function togglePinMessageAction(messageId: string, channelId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can pin messages" };
  }

  // Get current pinned state
  const { data: msg } = await supabase
    .from("messages")
    .select("is_pinned")
    .eq("id", messageId)
    .single();

  const nextPinned = !msg?.is_pinned;

  const { error } = await supabase
    .from("messages")
    .update({
      is_pinned: nextPinned,
      pinned_by: nextPinned ? user.id : null,
      pinned_at: nextPinned ? new Date().toISOString() : null,
    })
    .eq("id", messageId);

  if (error) return { error: error.message };

  revalidatePath(`/channels`);
  return { success: true, is_pinned: nextPinned };
}

export async function sendThreadReplyAction(
  channelId: string,
  parentId: string,
  content: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (!content.trim()) return { error: "Message cannot be empty" };

  const { data: reply, error } = await supabase
    .from("messages")
    .insert({
      channel_id: channelId,
      parent_id: parentId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      sender:profiles (*)
    `)
    .single();

  if (error) return { error: error.message };

  return { success: true, message: reply };
}

export async function createPollAction(
  channelId: string,
  question: string,
  options: string[]
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (!question.trim()) return { error: "Poll question is required" };

  const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
  if (validOptions.length < 2) {
    return { error: "At least 2 poll options are required" };
  }

  // Insert poll
  const { data: poll, error: pollErr } = await supabase
    .from("polls")
    .insert({
      channel_id: channelId,
      creator_id: user.id,
      question: question.trim(),
    })
    .select()
    .single();

  if (pollErr || !poll) {
    return { error: pollErr?.message || "Failed to create poll" };
  }

  // Insert poll options
  const optionRows = validOptions.map((text, index) => ({
    poll_id: poll.id,
    text,
    order: index,
  }));

  const { error: optionsErr } = await supabase.from("poll_options").insert(optionRows);
  if (optionsErr) {
    return { error: optionsErr.message };
  }

  // Post a message linking this poll so it appears directly in the chat feed
  await supabase.from("messages").insert({
    channel_id: channelId,
    sender_id: user.id,
    content: `📊 **LIVE POLL**: ${question.trim()}`,
  });

  return { success: true, pollId: poll.id };
}

export async function votePollAction(pollId: string, optionId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Check if user already voted on this poll
  const { data: existingVote } = await supabase
    .from("poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVote) {
    if (existingVote.option_id === optionId) {
      // Toggle off vote
      await supabase.from("poll_votes").delete().eq("id", existingVote.id);
      return { success: true, votedOptionId: null };
    } else {
      // Update vote to new option
      await supabase
        .from("poll_votes")
        .update({ option_id: optionId })
        .eq("id", existingVote.id);
      return { success: true, votedOptionId: optionId };
    }
  }

  // Insert new vote
  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  });

  if (error) return { error: error.message };
  return { success: true, votedOptionId: optionId };
}

export async function closePollAction(pollId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: poll } = await supabase
    .from("polls")
    .select("creator_id")
    .eq("id", pollId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isCreator = poll?.creator_id === user.id;
  const isExec = profile && isExecutive(profile.role);

  if (!isCreator && !isExec) {
    return { error: "Only the poll creator or executives can close this poll" };
  }

  const { error } = await supabase
    .from("polls")
    .update({ is_closed: true })
    .eq("id", pollId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function verifyExecutivePasscodeAction(
  channelName: string,
  passcode: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isPresidency(profile.role)) {
    return { error: "Access Denied: Only the President and Vice-President can enter this private room" };
  }

  // Verify against channel passcode or default club executive key
  const { data: channel } = await supabase
    .from("channels")
    .select("passcode")
    .eq("name", channelName)
    .single();

  const correctPasscode = channel?.passcode || "CLUB2026";
  if (passcode.trim() !== correctPasscode) {
    return { error: "Incorrect private room passcode" };
  }

  return { success: true };
}
