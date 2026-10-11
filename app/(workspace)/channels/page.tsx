import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChannelsDefaultPage() {
  const supabase = createClient();
  const { data: channel } = await supabase
    .from("channels")
    .select("name")
    .eq("name", "general-chat")
    .maybeSingle();

  if (channel) {
    redirect(`/channels/${channel.name}`);
  }

  // Fallback to first available channel
  const { data: firstChannel } = await supabase
    .from("channels")
    .select("name")
    .limit(1)
    .maybeSingle();

  if (firstChannel) {
    redirect(`/channels/${firstChannel.name}`);
  }

  return (
    <div className="flex-1 flex items-center justify-center text-[#949ba4]">
      No channels available.
    </div>
  );
}
