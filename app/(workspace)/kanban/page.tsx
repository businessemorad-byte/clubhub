import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskColumn, Task, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch columns
  const { data: columns } = await supabase
    .from("task_columns")
    .select("*")
    .order("order", { ascending: true });

  // Fetch tasks with assignee and subtasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles (*),
      subtasks (*)
    `)
    .order("order", { ascending: true });

  // Fetch members for assignment
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <KanbanBoard
      initialColumns={(columns || []) as TaskColumn[]}
      initialTasks={(tasks || []) as Task[]}
      members={(members || []) as Profile[]}
    />
  );
}
