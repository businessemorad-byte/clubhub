"use server";

import { createClient } from "@/lib/supabase/server";
import { isExecutive } from "@/types";
import { revalidatePath } from "next/cache";

export async function createMeetingPVAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can record meeting minutes (PVs)" };
  }

  const title = formData.get("title") as string;
  const meetingId = (formData.get("meetingId") as string) || null;
  const date = (formData.get("date") as string) || new Date().toISOString();
  const content = formData.get("content") as string;
  const attendees = formData.get("attendees") as string;
  const decisions = formData.get("decisions") as string;

  if (!title?.trim() || !content?.trim()) {
    return { error: "Title and minutes content are required" };
  }

  const { data: pv, error } = await supabase
    .from("meeting_pvs")
    .insert({
      title: title.trim(),
      meeting_id: meetingId || null,
      date: new Date(date).toISOString(),
      content: content.trim(),
      attendees: attendees?.trim() || null,
      decisions: decisions?.trim() || null,
      created_by: user.id,
    })
    .select(`
      *,
      author:profiles (*)
    `)
    .single();

  if (error) return { error: error.message };

  revalidatePath("/pvs");
  return { success: true, pv };
}

export async function deleteMeetingPVAction(pvId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can delete meeting minutes" };
  }

  const { error } = await supabase.from("meeting_pvs").delete().eq("id", pvId);
  if (error) return { error: error.message };

  revalidatePath("/pvs");
  return { success: true };
}
