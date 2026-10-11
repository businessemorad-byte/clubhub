import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplatesHub } from "@/components/templates/TemplatesHub";
import { TemplateItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: templates } = await supabase
    .from("templates")
    .select(`
      *,
      author:profiles (*)
    `)
    .order("created_at", { ascending: false });

  return <TemplatesHub initialTemplates={(templates || []) as TemplateItem[]} />;
}
