import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

