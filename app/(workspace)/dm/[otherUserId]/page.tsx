import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DMChat } from "@/components/chat/DMChat";
import { DM, DMMessage, Profile } from "@/types";

export const dynamic = "force-dynamic";

interface DMPageProps {
  params: {
    otherUserId: string;
  };
}

export default async function DMPage({ params }: DMPageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const otherUserId = params.otherUserId;

  // Cannot DM oneself
  if (user.id === otherUserId) {
    redirect("/channels/general-chat");
  }

  // Fetch target user profile
  const { data: otherProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherUserId)
    .maybeSingle();

  if (profileErr || !otherProfile) {
    notFound();
  }

  // Check if DM thread already exists between user and otherUser
  const { data: existingDM } = await supabase
    .from("dms")
    .select("*")
    .or(`and(user_a.eq.${user.id},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${user.id})`)
    .maybeSingle();

  let dm = existingDM;

  // If not found, create new DM row
  if (!dm) {
    const { data: newDM, error: createErr } = await supabase
      .from("dms")
      .insert({
        user_a: user.id,
        user_b: otherUserId,
      })
      .select()
      .single();

    if (createErr) {
      // Might have encountered a race condition where other user just created it
      const { data: retryDM } = await supabase
        .from("dms")
        .select("*")
        .or(`and(user_a.eq.${user.id},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${user.id})`)
        .maybeSingle();
      dm = retryDM;
    } else {
      dm = newDM;
    }
  }

  if (!dm) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#949ba4]">
        Failed to initialize DM conversation.
      </div>
    );
  }

  // Fetch DM messages
  const { data: messages } = await supabase
    .from("dm_messages")
    .select(`
      *,
      sender:profiles (*)
    `)
    .eq("dm_id", dm.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <DMChat
      dm={dm as DM}
      otherUser={otherProfile as Profile}
      initialMessages={(messages || []) as DMMessage[]}
    />
  );
}
