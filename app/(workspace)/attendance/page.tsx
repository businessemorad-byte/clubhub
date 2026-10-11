import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttendanceTracker } from "@/components/attendance/AttendanceTracker";
import { Meeting, Attendance, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .order("date", { ascending: false });

  // Fetch all attendance records
  const { data: attendance } = await supabase
    .from("attendance")
    .select("*");

  // Fetch all members
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <AttendanceTracker
      initialMeetings={(meetings || []) as Meeting[]}
      initialAttendance={(attendance || []) as Attendance[]}
      members={(members || []) as Profile[]}
    />
  );
}
