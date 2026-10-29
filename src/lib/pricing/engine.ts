import type { CouponType } from "@/types";
import { badRequest } from "@/lib/errors";

/**
 * Pricing engine for subscription calculations and validations.
 *
 * All money values are integer paise. Intermediate products that may
 * not divide evenly are rounded with Math.round to prevent
 * fractional-paise drift.
 *
 * Error handling convention:
 * - calculatePricing throws RangeError when given corrupted or invalid
 *   stored database values (a 500 server fault).
 * - validatePayment and validateCoupon throw AppError (4xx) for invalid
 *   user input submitted at checkout or payment time.
 */

// Input types

export interface PlanInput {
  baseMonthlyPricePaise: number;
  durationMonths: number;
  discountPercentage: number;
  allowPartialPayment: boolean;
}

export interface CouponInput {
  type: CouponType;
  flatAmountPaise: number;
  percentage: number;
}

export interface PricingOptions {
  plan: PlanInput;
  coupon?: CouponInput | null;
  /** Minimum upfront percentage as an integer 0–100 (default 50). */
  minimumUpfrontPercent?: number;
}

// Output types

export interface PricingBreakdown {
  /** baseMonthlyPricePaise × durationMonths (before any discounts). */
  grossPaise: number;
  /** Paise saved by the plan's commitment discount. */
  commitmentDiscountPaise: number;
  /** Paise saved by the applied coupon (0 when no coupon). */
  couponDiscountPaise: number;
  /** grossPaise − commitmentDiscountPaise − couponDiscountPaise. */
  totalPaise: number;
  /** Effective monthly rate (totalPaise / durationMonths, rounded). */
  effectiveMonthlyPaise: number;
  /** Whether partial payment is available for this plan. */
  allowPartialPayment: boolean;
  /** Minimum amount due upfront when paying partially. */
  minimumUpfrontPaise: number;
  /** Maximum remaining balance after paying the minimum upfront. */
  remainderPaise: number;
}

// Input validation helpers

function assertIntegerPaise(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${name} must be a non-negative integer (paise), got ${value}`
    );
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(
      `${name} must be a positive integer, got ${value}`
    );
  }
}

function assertPercentage(value: number, name: string): void {
  if (value < 0 || value > 100) {
    throw new RangeError(
      `${name} must be between 0 and 100, got ${value}`
    );
  }
}

function validatePlanInput(plan: PlanInput): void {
  assertIntegerPaise(plan.baseMonthlyPricePaise, "baseMonthlyPricePaise");
  assertPositiveInteger(plan.durationMonths, "durationMonths");
  assertPercentage(plan.discountPercentage, "discountPercentage");
}

function validateCouponInput(coupon: CouponInput): void {
  if (coupon.type === "FLAT") {
    assertIntegerPaise(coupon.flatAmountPaise, "coupon.flatAmountPaise");
  } else if (coupon.type === "PERCENTAGE") {
    assertPercentage(coupon.percentage, "coupon.percentage");
  }
}

// Minimum upfront helper

function computeMinimumUpfront(
  totalPaise: number,
  minimumUpfrontPercent: number
): number {
  return Math.round((totalPaise * minimumUpfrontPercent) / 100);
}

// Core pricing

/**
 * Computes a full pricing breakdown from plan data and an optional coupon.
 *
 * Arithmetic:
 * 1. Gross = baseMonthlyPricePaise × durationMonths
 * 2. Commitment discount = round(gross × discountPercentage / 100)
 * 3. Subtotal = gross − commitment discount
 * 4. Coupon discount (capped at subtotal for both types):
 *    - FLAT:       min(flatAmountPaise, subtotal)
 *    - PERCENTAGE: min(round(subtotal × percentage / 100), subtotal)
 * 5. Total = subtotal − coupon discount
 * 6. Minimum upfront = round(total × minimumUpfrontPercent / 100)
 * 7. Remainder = total − minimum upfront
 */
export function calculatePricing(options: PricingOptions): PricingBreakdown {
  const { plan, coupon, minimumUpfrontPercent = 50 } = options;

  validatePlanInput(plan);
  if (!Number.isInteger(minimumUpfrontPercent)) {
    throw new RangeError(
      `minimumUpfrontPercent must be an integer, got ${minimumUpfrontPercent}`
    );
  }
  assertPercentage(minimumUpfrontPercent, "minimumUpfrontPercent");
  if (coupon) validateCouponInput(coupon);

  // 1. Gross total
  const grossPaise = plan.baseMonthlyPricePaise * plan.durationMonths;

  // 2. Commitment discount
  const commitmentDiscountPaise =
    plan.discountPercentage > 0
      ? Math.round((grossPaise * plan.discountPercentage) / 100)
      : 0;

  // 3. Subtotal after commitment discount
  const subtotalPaise = grossPaise - commitmentDiscountPaise;

  // 4. Coupon discount (capped at subtotal for both types)
  let couponDiscountPaise = 0;
  if (coupon) {
    if (coupon.type === "FLAT") {
      couponDiscountPaise = Math.min(coupon.flatAmountPaise, subtotalPaise);
    } else if (coupon.type === "PERCENTAGE") {
      couponDiscountPaise = Math.min(
        Math.round((subtotalPaise * coupon.percentage) / 100),
        subtotalPaise
      );
    }
  }

  // 5. Final total (subtotal − capped coupon is always >= 0)
  const totalPaise = subtotalPaise - couponDiscountPaise;

  // 6. Effective monthly rate
  const effectiveMonthlyPaise =
    plan.durationMonths > 0
      ? Math.round(totalPaise / plan.durationMonths)
      : totalPaise;

  // 7. Partial payment split
  const minimumUpfrontPaise = plan.allowPartialPayment
    ? computeMinimumUpfront(totalPaise, minimumUpfrontPercent)
    : totalPaise;
  const remainderPaise = totalPaise - minimumUpfrontPaise;

  return {
    grossPaise,
    commitmentDiscountPaise,
    couponDiscountPaise,
    totalPaise,
    effectiveMonthlyPaise,
    allowPartialPayment: plan.allowPartialPayment,
    minimumUpfrontPaise,
    remainderPaise,
  };
}

// Payment validation

export interface ValidatePaymentInput {
  totalPaise: number;
  amountPaidPaise: number;
  paymentPaise: number;
  allowPartialPayment: boolean;
  minimumUpfrontPercent?: number;
}

/**
 * Validates a payment attempt against the transaction state.
 *
 * First payment: must be at least the minimum upfront when partial is
 * allowed, and exactly the total when it is not.
 * Later payments: must be above zero and must not exceed the remaining
 * balance.
 */
export function validatePayment(input: ValidatePaymentInput): void {
  const {
    totalPaise,
    amountPaidPaise,
    paymentPaise,
    allowPartialPayment,
    minimumUpfrontPercent = 50,
  } = input;

  const remainingBalance = totalPaise - amountPaidPaise;

  if (remainingBalance <= 0) {
    badRequest("This transaction is already fully paid", "ALREADY_PAID");
  }

  if (!Number.isInteger(paymentPaise) || paymentPaise <= 0) {
    badRequest(
      "Payment amount must be a positive integer (paise)",
      "INVALID_PAYMENT_AMOUNT"
    );
  }

  if (paymentPaise > remainingBalance) {
    badRequest(
      `Payment of ${paymentPaise} paise exceeds remaining balance of ${remainingBalance} paise`,
      "PAYMENT_EXCEEDS_BALANCE"
    );
  }

  const isFirstPayment = amountPaidPaise === 0;

  if (isFirstPayment) {
    if (!allowPartialPayment) {
      if (paymentPaise !== totalPaise) {
        badRequest(
          "Full payment is required for this plan",
          "FULL_PAYMENT_REQUIRED"
        );
      }
    } else {
      const minimumUpfrontPaise = computeMinimumUpfront(
        totalPaise,
        minimumUpfrontPercent
      );
      if (paymentPaise < minimumUpfrontPaise) {
        badRequest(
          `Minimum upfront payment is ${minimumUpfrontPaise} paise`,
          "BELOW_MINIMUM_UPFRONT"
        );
      }
    }
  }
}

// Coupon eligibility validation

export interface CouponDocument {
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  maxRedemptions: number | null;
}

/**
 * Validates whether a coupon is currently redeemable.
 * Throws an AppError with a specific code for each rejection reason.
 */
export function validateCoupon(
  coupon: CouponDocument,
  now: Date = new Date(),
  redemptionsSoFar: number = 0
): void {
  if (!coupon.isActive) {
    badRequest("This coupon is no longer active", "COUPON_INACTIVE");
  }

  if (now < coupon.validFrom) {
    badRequest("This coupon is not yet valid", "COUPON_NOT_YET_VALID");
  }

  if (now >= coupon.validUntil) {
    badRequest("This coupon has expired", "COUPON_EXPIRED");
  }

  if (
    coupon.maxRedemptions !== null &&
    redemptionsSoFar >= coupon.maxRedemptions
  ) {
    badRequest(
      "This coupon has reached its maximum number of redemptions",
      "COUPON_MAX_REDEEMED"
    );
  }
}
