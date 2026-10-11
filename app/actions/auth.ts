"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/channels");
}

export async function signupAction(formData: FormData) {
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode"),
  };

  const parsed = signupSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { fullName, email, password, inviteCode } = parsed.data;

  // Use admin client to verify and claim invite code reliably
  const adminSupabase = createAdminClient();

  // 1. Verify invitation code
  const { data: invite, error: inviteErr } = await adminSupabase
    .from("invitations")
    .select("*")
    .eq("code", inviteCode.trim().toUpperCase())
    .maybeSingle();

  if (inviteErr || !invite) {
    return { error: "Invalid invitation code. Please request one from an executive." };
  }

  if (invite.used_by) {
    return { error: "This invitation code has already been redeemed." };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: "This invitation code has expired." };
  }

  // 2. Sign up the user in Supabase Auth
  const supabase = createClient();
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authErr) {
    return { error: authErr.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user account." };
  }

  const userId = authData.user.id;

  // 3. Create the profile with the invite's role
  const { error: profileErr } = await adminSupabase
    .from("profiles")
    .upsert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      role: invite.role,
    });

  if (profileErr) {
    console.error("Profile creation error:", profileErr);
  }

  // 4. Mark invite as redeemed
  await adminSupabase
    .from("invitations")
    .update({
      used_by: userId,
      used_at: new Date().toISOString(),
    })
    .eq("code", invite.code);

  // 5. Add audit log
  await adminSupabase
    .from("audit_logs")
    .insert({
      actor_id: userId,
      action: "USER_SIGNUP",
      target: userId,
      meta: { email, role: invite.role, inviteCode: invite.code },
    });

  revalidatePath("/", "layout");
  redirect("/channels");
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
