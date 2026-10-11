import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isExecutive, Invitation } from "@/types";
import { InviteManager } from "@/components/admin/InviteManager";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    redirect("/channels");
  }

  const { data: invites } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });

  return <InviteManager initialInvites={(invites || []) as Invitation[]} />;
}
