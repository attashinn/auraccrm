import { z } from "zod";

export const DealStageEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST"
]);

export type DealStage = z.infer<typeof DealStageEnum>;

export const dealSchema = z.object({
  title: z
    .string()
    .min(1, "Deal title is required")
    .max(255, "Deal title must be less than 255 characters")
    .trim(),
  value: z
    .coerce
    .number()
    .nonnegative("Valuation must be a positive number or zero")
    .default(0),
  stage: DealStageEnum.default("NEW"),
  leadId: z
    .string()
    .uuid("Invalid lead ID format")
    .optional()
    .nullable()
    .or(z.literal("")),
  expectedCloseDate: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
});

export type DealInput = z.infer<typeof dealSchema>;
