import { z } from "zod";

export const createPlanSchema = z.object({
  name: z
    .string()
    .min(2, "Plan name must be at least 2 characters")
    .max(100, "Plan name cannot exceed 100 characters")
    .trim(),
  durationMonths: z
    .number()
    .int("Duration must be a whole number of months")
    .min(1, "Duration must be at least 1 month")
    .max(36, "Duration cannot exceed 36 months"),
  baseMonthlyPricePaise: z
    .number()
    .int("Base price must be an integer (in paise)")
    .min(0, "Base price cannot be negative"),
  discountPercentage: z
    .number()
    .min(0, "Discount cannot be less than 0%")
    .max(100, "Discount cannot exceed 100%"),
  allowPartialPayment: z.boolean(),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
