"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteGenerateSchema } from "@/lib/validations/auth";
import { isExecutive } from "@/types";
import { revalidatePath } from "next/cache";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "CLUB-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateInviteAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check if executive
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can generate invitation codes" };
  }

  const role = formData.get("role") as string;
  const days = parseInt((formData.get("expiresInDays") as string) || "7", 10);

  const parsed = inviteGenerateSchema.safeParse({ role, expiresInDays: days });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parsed.data.expiresInDays);

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("invitations")
    .insert({
      code,
      role: parsed.data.role,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Audit log
  await adminSupabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "GENERATE_INVITATION",
    target: code,
    meta: { role: parsed.data.role, expires_at: expiresAt.toISOString() },
  });

  revalidatePath("/admin/invites");
  return { success: true, invite: data };
}

export async function revokeInviteAction(code: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Forbidden: Executive privilege required" };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("invitations")
    .delete()
    .eq("code", code);

  if (error) return { error: error.message };

  await adminSupabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "REVOKE_INVITATION",
    target: code,
  });

  revalidatePath("/admin/invites");
  return { success: true };
}
