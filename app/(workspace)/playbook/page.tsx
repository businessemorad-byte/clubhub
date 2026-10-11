import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlaybookViewer } from "@/components/playbook/PlaybookViewer";
import { DocumentItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: documents } = await supabase
    .from("documents")
    .select(`
      *,
      uploader:profiles (*)
    `)
    .eq("type", "playbook")
    .order("created_at", { ascending: false });

  return <PlaybookViewer initialDocuments={(documents || []) as DocumentItem[]} />;
}
