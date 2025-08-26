import { z } from "zod";

export const TaskCreateSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(120, "Title must be less than 120 characters"),
    description: z
      .string()
      .max(2000, "Description must be less than 2000 characters")
      .optional(),
    status: z.enum(["todo", "in_progress", "done", "archived"]),
    due_date: z
      .union([z.string(), z.date()])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        return typeof val === "string" ? new Date(val) : val;
      }),
  })
  .strict();

export const TaskUpdateSchema = TaskCreateSchema.partial().strict();

export const UserLoginSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();

export const UserSignupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    full_name: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Full name must be less than 100 characters"),
  })
  .strict();

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "archived";
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
};

export type TaskCreate = z.infer<typeof TaskCreateSchema>;
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserSignup = z.infer<typeof UserSignupSchema>;
