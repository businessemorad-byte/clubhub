"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResourceCategory, isExecutive } from "@/types";
import { revalidatePath } from "next/cache";

export async function uploadResourceAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const category = (formData.get("category") as ResourceCategory) || "assets";
  const file = formData.get("file") as File | null;

  if (!title?.trim()) {
    return { error: "Resource title is required" };
  }

  if (!file || file.size === 0) {
    return { error: "Please select a file to upload" };
  }

  const adminSupabase = createAdminClient();
  const fileExt = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${category}/${Date.now()}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadErr } = await adminSupabase.storage
    .from("resources")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadErr) {
    console.error("Storage error:", uploadErr);
    return { error: uploadErr.message };
  }

  const { data: resource, error: dbErr } = await supabase
    .from("resources")
    .insert({
      title: title.trim(),
      category,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || "application/octet-stream",
      storage_path: storagePath,
      uploaded_by: user.id,
    })
    .select(`
      *,
      uploader:profiles (*)
    `)
    .single();

  if (dbErr) {
    return { error: dbErr.message };
  }

  revalidatePath("/drive");
  return { success: true, resource };
}

export async function deleteResourceAction(resourceId: string, storagePath: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const adminSupabase = createAdminClient();
  await adminSupabase.storage.from("resources").remove([storagePath]);

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);

  if (error) return { error: error.message };

  revalidatePath("/drive");
  return { success: true };
}

export async function createTemplateAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can manage official templates" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = (formData.get("category") as string) || "General";
  const fileName = (formData.get("fileName") as string) || "template.txt";
  const content = formData.get("content") as string;

  if (!title?.trim() || !content?.trim()) {
    return { error: "Title and content are required" };
  }

  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category: category.trim(),
      file_name: fileName.trim(),
      content: content.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { success: true, template };
}

export async function deleteTemplateAction(templateId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("templates").delete().eq("id", templateId);
  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { success: true };
}
