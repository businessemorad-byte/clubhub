import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().optional(),
  columnId: z.string().uuid("Invalid column ID"),
  assigneeId: z.string().uuid("Invalid assignee ID").nullable().optional(),
  deadline: z.string().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().optional().nullable(),
  columnId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  deadline: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  order: z.number().int().optional(),
});

export const createSubtaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1, "Subtask title is required").max(150),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
