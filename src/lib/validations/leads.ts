import { z } from "zod";

export const LeadStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST"
]);

export type LeadStatus = z.infer<typeof LeadStatusEnum>;

export const leadSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters")
    .trim(),
  lastName: z
    .string()
    .max(100, "Last name must be less than 100 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  email: z
    .string()
    .max(255, "Email must be less than 255 characters")
    .trim()
    .email("Invalid email format")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z
    .string()
    .max(50, "Phone must be less than 50 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  company: z
    .string()
    .max(255, "Company must be less than 255 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  source: z
    .string()
    .max(100, "Source must be less than 100 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  status: LeadStatusEnum.default("NEW"),
  notes: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),
  value: z
    .coerce
    .number()
    .nonnegative("Value must be a positive number or zero")
    .default(0)
});

export type LeadInput = z.infer<typeof leadSchema>;
