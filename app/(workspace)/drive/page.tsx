import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FileDrive } from "@/components/drive/FileDrive";
import { ResourceItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function DrivePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: resources } = await supabase
    .from("resources")
    .select(`
      *,
      uploader:profiles (*)
    `)
    .order("created_at", { ascending: false });

  return <FileDrive initialResources={(resources || []) as ResourceItem[]} />;
}
