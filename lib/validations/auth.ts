import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  inviteCode: z.string().min(3, "Invitation code is required"),
});

export const inviteGenerateSchema = z.object({
  role: z.enum(["president", "vice_president", "executive", "media_team", "member"]),
  expiresInDays: z.number().int().min(1).max(90).default(7),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type InviteGenerateInput = z.infer<typeof inviteGenerateSchema>;
