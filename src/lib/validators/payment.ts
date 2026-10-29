import { z } from "zod";
import { objectIdSchema } from "./common";

export const createPaymentSchema = z
  .object({
    transactionId: objectIdSchema,
    paymentChoice: z.enum(["FULL", "PARTIAL"]),
    amountPaise: z
      .number()
      .int("Payment amount must be an integer (in paise)")
      .min(1, "Payment amount must be greater than zero")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.paymentChoice === "PARTIAL") {
        return typeof data.amountPaise === "number" && data.amountPaise > 0;
      }
      return true;
    },
    {
      message: "Payment amount is required when selecting partial payment",
      path: ["amountPaise"],
    }
  );

export const adminOverrideSchema = z.object({
  overrideNote: z
    .string()
    .min(3, "Override reason must be at least 3 characters")
    .max(500, "Override reason cannot exceed 500 characters")
    .trim(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type AdminOverrideInput = z.infer<typeof adminOverrideSchema>;
