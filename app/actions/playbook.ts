"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isExecutive } from "@/types";
import { revalidatePath } from "next/cache";

export async function uploadPlaybookAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can upload club playbooks" };
  }

  const title = formData.get("title") as string;
  const file = formData.get("file") as File | null;
  const markdownText = formData.get("markdownText") as string | null;

  if (!title?.trim()) {
    return { error: "Playbook title is required" };
  }

  const adminSupabase = createAdminClient();
  const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
  const fileName = `playbooks/${cleanTitle}-${Date.now()}.md`;

  let contentBuffer: Buffer;

  if (file && file.size > 0) {
    const arrayBuffer = await file.arrayBuffer();
    contentBuffer = Buffer.from(arrayBuffer);
  } else if (markdownText && markdownText.trim().length > 0) {
    contentBuffer = Buffer.from(markdownText, "utf-8");
  } else {
    return { error: "Please provide either a markdown file or markdown content" };
  }

  // Upload to Supabase Storage
  const { error: uploadErr } = await adminSupabase.storage
    .from("documents")
    .upload(fileName, contentBuffer, {
      contentType: "text/markdown; charset=utf-8",
      upsert: true,
    });

  if (uploadErr) {
    console.error("Storage upload error:", uploadErr);
    return { error: uploadErr.message };
  }

  // Insert into documents table
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      title: title.trim(),
      type: "playbook",
      storage_path: fileName,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (docErr) {
    return { error: docErr.message };
  }

  // Record audit log
  await adminSupabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "UPLOAD_PLAYBOOK",
    target: doc.id,
    meta: { title, storage_path: fileName },
  });

  revalidatePath("/playbook");
  return { success: true, document: doc };
}

export async function deletePlaybookAction(documentId: string, storagePath: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can delete playbooks" };
  }

  const adminSupabase = createAdminClient();

  // Delete file from storage
  await adminSupabase.storage.from("documents").remove([storagePath]);

  // Delete row from documents table
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) return { error: error.message };

  revalidatePath("/playbook");
  return { success: true };
}
