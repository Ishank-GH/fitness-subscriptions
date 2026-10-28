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

/**
 * Derives subscription status at read time from subscription end date and balance due.
 * Guarantees zero stale status bugs.
 */
export function deriveSubscriptionStatus(
  endDate?: Date | string | null,
  balanceDuePaise: number = 0
): SubscriptionStatus {
  if (!endDate) {
    return "NONE";
  }

  const end = new Date(endDate);
  const now = new Date();

  if (now.getTime() > end.getTime()) {
    return "EXPIRED";
  }

  if (balanceDuePaise > 0) {
    return "PARTIAL";
  }

  return "ACTIVE";
}

/**
 * Checks whether an active or partial subscription is within 3 days of expiring.
 */
export function isExpiringSoon(
  endDate?: Date | string | null,
  balanceDuePaise: number = 0
): boolean {
  if (!endDate) return false;

  const status = deriveSubscriptionStatus(endDate, balanceDuePaise);
  if (status !== "ACTIVE" && status !== "PARTIAL") {
    return false;
  }

  const end = new Date(endDate).getTime();
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  return end > now && end - now <= threeDaysMs;
}

