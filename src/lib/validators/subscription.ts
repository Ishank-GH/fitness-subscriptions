import { z } from "zod";
import { objectIdSchema } from "./common";

export const createSubscriptionSchema = z.object({
  planId: objectIdSchema,
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
