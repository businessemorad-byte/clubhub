import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MeetingPVsArchive } from "@/components/pvs/MeetingPVsArchive";
import { MeetingPV, Meeting } from "@/types";

export const dynamic = "force-dynamic";

export default async function PVsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: pvs } = await supabase
    .from("meeting_pvs")
    .select(`
      *,
      author:profiles (*)
    `)
    .order("date", { ascending: false });

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .order("date", { ascending: false });

  return (
    <MeetingPVsArchive
      initialPVs={(pvs || []) as MeetingPV[]}
      meetings={(meetings || []) as Meeting[]}
    />
  );
}
