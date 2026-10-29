export type UserRole = "ADMIN" | "USER";

export type SubscriptionStatus = "ACTIVE" | "PARTIAL" | "EXPIRED" | "NONE";

export type PaymentStatus = "COMPLETED" | "PARTIAL" | "PENDING";

export type CouponType = "FLAT" | "PERCENTAGE";

export type PaymentChoice = "FULL" | "PARTIAL";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
}
