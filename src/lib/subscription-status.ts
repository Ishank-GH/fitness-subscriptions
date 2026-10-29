import { SubscriptionStatus } from "@/types";

/**
 * Derives subscription status at read time from subscription end date and balance due.
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
 * Determines whether an active or partial subscription expires within 3 days.
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

/**
 * Calculates remaining days until subscription expires (floored at 0).
 */
export function calculateDaysRemaining(endDate?: Date | string | null): number {
  if (!endDate) return 0;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}
