import { z } from "zod";

export const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]);
export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(255, "Task title must be less than 255 characters")
    .trim(),
  description: z.string().optional().nullable().or(z.literal("")),
  status: TaskStatusEnum.default("TODO"),
  priority: TaskPriorityEnum.default("MEDIUM"),
  dueDate: z.string().trim().optional().nullable().or(z.literal("")),
  assignedToMembershipId: z
    .string()
    .uuid("Invalid membership ID")
    .optional()
    .nullable()
    .or(z.literal("")),
  leadId: z
    .string()
    .uuid("Invalid lead ID format")
    .optional()
    .nullable()
    .or(z.literal("")),
  dealId: z
    .string()
    .uuid("Invalid deal ID format")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type TaskInput = z.infer<typeof taskSchema>;
