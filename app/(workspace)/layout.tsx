import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Profile } from "@/types";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: Profile | null = null;
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileData) {
    profile = profileData as Profile;
  }

  return (
    <AuthProvider initialUser={user} initialProfile={profile}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
