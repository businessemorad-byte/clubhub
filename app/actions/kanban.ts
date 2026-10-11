"use server";

import { createClient } from "@/lib/supabase/server";
import { isExecutive } from "@/types";
import { createTaskSchema } from "@/lib/validations/task";
import { revalidatePath } from "next/cache";

export async function createTaskAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can create tasks" };
  }

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const columnId = formData.get("columnId") as string;
  const assigneeId = (formData.get("assigneeId") as string) || null;
  const deadline = (formData.get("deadline") as string) || null;
  const priority = (formData.get("priority") as any) || "medium";
  const subtasksJson = formData.get("subtasks") as string;

  const parsed = createTaskSchema.safeParse({
    title,
    description: description || undefined,
    columnId,
    assigneeId: assigneeId || null,
    deadline: deadline || null,
    priority,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      column_id: parsed.data.columnId,
      assignee_id: parsed.data.assigneeId,
      deadline: parsed.data.deadline,
      priority: parsed.data.priority,
      created_by: user.id,
    })
    .select()
    .single();

  if (taskErr || !task) {
    return { error: taskErr?.message || "Failed to create task" };
  }

  // Insert subtasks if any
  if (subtasksJson) {
    try {
      const subtaskTitles: string[] = JSON.parse(subtasksJson);
      if (Array.isArray(subtaskTitles) && subtaskTitles.length > 0) {
        const rows = subtaskTitles
          .filter((t) => t.trim().length > 0)
          .map((t) => ({
            task_id: task.id,
            title: t.trim(),
            done: false,
          }));

        if (rows.length > 0) {
          await supabase.from("subtasks").insert(rows);
        }
      }
    } catch (e) {
      console.error("Subtask parsing error:", e);
    }
  }

  revalidatePath("/kanban");
  return { success: true, task };
}

export async function moveTaskAction(taskId: string, targetColumnId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Allow executives, or members assigned to this task
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isExec = profile && isExecutive(profile.role);

  if (!isExec) {
    const { data: existingTask } = await supabase
      .from("tasks")
      .select("assignee_id")
      .eq("id", taskId)
      .single();

    if (!existingTask || existingTask.assignee_id !== user.id) {
      return { error: "You can only update tasks assigned to you" };
    }
  }

  const { error } = await supabase
    .from("tasks")
    .update({ column_id: targetColumnId })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/kanban");
  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isExecutive(profile.role)) {
    return { error: "Only executives can delete tasks" };
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/kanban");
  return { success: true };
}

export async function toggleSubtaskAction(subtaskId: string, done: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("subtasks")
    .update({ done })
    .eq("id", subtaskId);

  if (error) return { error: error.message };

  revalidatePath("/kanban");
  return { success: true };
}

export async function addSubtaskAction(taskId: string, title: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("subtasks")
    .insert({
      task_id: taskId,
      title: title.trim(),
      done: false,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/kanban");
  return { success: true, subtask: data };
}
