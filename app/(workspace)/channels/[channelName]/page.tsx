import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChannelChat } from "@/components/chat/ChannelChat";
import { Channel, Message, isExecutive, isPresidency } from "@/types";

export const dynamic = "force-dynamic";

interface ChannelPageProps {
  params: {
    channelName: string;
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const channelName = decodeURIComponent(params.channelName);

  // Fetch channel by name (or id fallback)
  const { data: channel, error: channelErr } = await supabase
    .from("channels")
    .select("*")
    .or(`name.eq.${channelName},id.eq.${channelName}`)
    .maybeSingle();

  if (channelErr || !channel) {
    notFound();
  }

  // Check if executive room
  if (channel.type === "executive") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !isPresidency(profile.role)) {
      redirect("/channels/general-chat");
    }
  }

  // Fetch channel messages with sender profiles
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles (*)
    `)
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <ChannelChat
      channel={channel as Channel}
      initialMessages={(messages || []) as Message[]}
    />
  );
}
