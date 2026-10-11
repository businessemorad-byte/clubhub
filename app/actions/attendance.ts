"use server";

import { createClient } from "@/lib/supabase/server";
import { isExecutive, AttendanceStatus } from "@/types";
import { createMeetingSchema } from "@/lib/validations/meeting";
import { revalidatePath } from "next/cache";

export async function createMeetingAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can schedule club meetings" };
  }

  const title = formData.get("title") as string;
  const date = formData.get("date") as string;

  const parsed = createMeetingSchema.safeParse({ title, date });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  // Create meeting
  const { data: meeting, error: meetingErr } = await supabase
    .from("meetings")
    .insert({
      title: parsed.data.title,
      date: new Date(parsed.data.date).toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (meetingErr || !meeting) {
    return { error: meetingErr?.message || "Failed to create meeting" };
  }

  // Populate default attendance records as absent for all members
  const { data: members } = await supabase.from("profiles").select("id");
  if (members && members.length > 0) {
    const rows = members.map((m) => ({
      meeting_id: meeting.id,
      user_id: m.id,
      status: "absent",
      marked_by: user.id,
    }));
    await supabase.from("attendance").insert(rows);
  }

  revalidatePath("/attendance");
  return { success: true, meeting };
}

export async function updateAttendanceAction(
  meetingId: string,
  userId: string,
  status: AttendanceStatus
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can mark attendance" };
  }

  const { error } = await supabase
    .from("attendance")
    .upsert({
      meeting_id: meetingId,
      user_id: userId,
      status,
      marked_by: user.id,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}

export async function deleteMeetingAction(meetingId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can remove meetings" };
  }

  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}
