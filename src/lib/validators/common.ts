import { z } from "zod";

/**
 * Validates 24-character hexadecimal MongoDB ObjectIds.
 */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hexadecimal ObjectId");

