import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Meeting, Profile, Attendance, Task, TaskColumn } from "@/types";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch meetings
  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .order("date", { ascending: true });

  // Fetch all members
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  // Fetch attendance records
  const { data: attendance } = await supabase
    .from("attendance")
    .select("*");

  // Fetch tasks with assignee and subtasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles (*),
      subtasks (*)
    `);

  // Fetch columns
  const { data: columns } = await supabase
    .from("task_columns")
    .select("*")
    .order("order", { ascending: true });

  return (
    <AnalyticsDashboard
      meetings={(meetings || []) as Meeting[]}
      members={(members || []) as Profile[]}
      attendance={(attendance || []) as Attendance[]}
      tasks={(tasks || []) as Task[]}
      columns={(columns || []) as TaskColumn[]}
    />
  );
}
