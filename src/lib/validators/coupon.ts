import { z } from "zod";
import { objectIdSchema } from "./common";

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(20, "Coupon code cannot exceed 20 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Coupon code may only contain letters, numbers, hyphens, and underscores"
      )
      .transform((val) => val.toUpperCase().trim()),
    type: z.enum(["FLAT", "PERCENTAGE"]),
    flatAmountPaise: z
      .number()
      .int("Flat amount must be an integer (paise)")
      .min(0, "Flat amount cannot be negative")
      .default(0),
    percentage: z
      .number()
      .min(0, "Percentage discount cannot be negative")
      .max(100, "Percentage discount cannot exceed 100%")
      .default(0),
    maxRedemptions: z
      .number()
      .int("Max redemptions must be an integer")
      .min(1, "Max redemptions must be at least 1")
      .nullable()
      .optional()
      .default(null),
    validFrom: z.coerce.date().default(() => new Date()),
    validUntil: z.coerce.date(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: "Expiration date must be after validFrom date",
    path: ["validUntil"],
  })
  .refine(
    (data) => {
      if (data.type === "FLAT") {
        return data.flatAmountPaise > 0;
      }
      return data.percentage > 0;
    },
    {
      message:
        "Please provide a discount amount greater than zero for the chosen coupon type",
      path: ["type"],
    }
  );

export const updateCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((val) => val.toUpperCase().trim())
    .optional(),
  type: z.enum(["FLAT", "PERCENTAGE"]).optional(),
  flatAmountPaise: z.number().int().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").transform((v) => v.toUpperCase().trim()),
  planId: objectIdSchema,
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
