import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(2, "Meeting title is required").max(150),
  date: z.string().min(1, "Date and time are required"),
});

export const updateAttendanceSchema = z.object({
  meetingId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(["present", "absent", "late"]),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
