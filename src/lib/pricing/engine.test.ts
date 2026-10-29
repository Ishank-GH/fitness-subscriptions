import { describe, it, expect } from "vitest";
import {
  calculatePricing,
  validatePayment,
  validateCoupon,
  PricingOptions,
  CouponDocument,
} from "./engine";
import { addMonths } from "./dates";
import { AppError } from "@/lib/errors";

// Helper: builds a default plan input
function makePlan(overrides: Partial<PricingOptions["plan"]> = {}): PricingOptions["plan"] {
  return {
    baseMonthlyPricePaise: 450000, // ₹4,500/mo
    durationMonths: 1,
    discountPercentage: 0,
    allowPartialPayment: false,
    ...overrides,
  };
}

// 1. Basic single-month plan with no discounts
describe("single-month plan, no discounts, no coupon", () => {
  const result = calculatePricing({ plan: makePlan() });

  it("gross equals base × 1 month", () => {
    expect(result.grossPaise).toBe(450000);
  });

  it("no commitment discount", () => {
    expect(result.commitmentDiscountPaise).toBe(0);
  });

  it("no coupon discount", () => {
    expect(result.couponDiscountPaise).toBe(0);
  });

  it("total equals gross", () => {
    expect(result.totalPaise).toBe(450000);
  });

  it("effective monthly equals total", () => {
    expect(result.effectiveMonthlyPaise).toBe(450000);
  });

  it("full payment required (no partial)", () => {
    expect(result.minimumUpfrontPaise).toBe(450000);
    expect(result.remainderPaise).toBe(0);
  });
});

// 2. Multi-month plan with commitment discount
describe("3-month plan with 10% commitment discount", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 400000, // ₹4,000/mo
      durationMonths: 3,
      discountPercentage: 10,
      allowPartialPayment: true,
    }),
  });

  it("gross = 400000 × 3 = 1200000", () => {
    expect(result.grossPaise).toBe(1200000);
  });

  it("commitment discount = round(1200000 × 10 / 100) = 120000", () => {
    expect(result.commitmentDiscountPaise).toBe(120000);
  });

  it("total = 1200000 − 120000 = 1080000", () => {
    expect(result.totalPaise).toBe(1080000);
  });

  it("effective monthly = round(1080000 / 3) = 360000", () => {
    expect(result.effectiveMonthlyPaise).toBe(360000);
  });

  it("minimum upfront = round(1080000 × 0.5) = 540000", () => {
    expect(result.minimumUpfrontPaise).toBe(540000);
  });

  it("remainder = 1080000 − 540000 = 540000", () => {
    expect(result.remainderPaise).toBe(540000);
  });
});

// 3. 12-month plan with 20% commitment discount
describe("12-month plan with 20% commitment discount", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 350000, // ₹3,500/mo
      durationMonths: 12,
      discountPercentage: 20,
      allowPartialPayment: true,
    }),
  });

  it("gross = 350000 × 12 = 4200000", () => {
    expect(result.grossPaise).toBe(4200000);
  });

  it("commitment discount = round(4200000 × 20 / 100) = 840000", () => {
    expect(result.commitmentDiscountPaise).toBe(840000);
  });

  it("total = 4200000 − 840000 = 3360000", () => {
    expect(result.totalPaise).toBe(3360000);
  });

  it("effective monthly = round(3360000 / 12) = 280000", () => {
    expect(result.effectiveMonthlyPaise).toBe(280000);
  });
});

// 4. Flat coupon
describe("flat coupon applied after commitment discount", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 400000,
      durationMonths: 3,
      discountPercentage: 10,
      allowPartialPayment: false,
    }),
    coupon: { type: "FLAT", flatAmountPaise: 50000, percentage: 0 },
  });

  it("coupon discount = 50000 (flat, subtotal is 1080000)", () => {
    expect(result.couponDiscountPaise).toBe(50000);
  });

  it("total = 1080000 − 50000 = 1030000", () => {
    expect(result.totalPaise).toBe(1030000);
  });
});

// 5. Flat coupon exceeding subtotal is capped
describe("flat coupon larger than subtotal is capped", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 10000, // ₹100/mo
      durationMonths: 1,
      discountPercentage: 0,
    }),
    coupon: { type: "FLAT", flatAmountPaise: 99999, percentage: 0 },
  });

  it("coupon discount capped to subtotal", () => {
    expect(result.couponDiscountPaise).toBe(10000);
  });

  it("total is 0, not negative", () => {
    expect(result.totalPaise).toBe(0);
  });

  it("gross - commitment - coupon === total", () => {
    expect(
      result.grossPaise - result.commitmentDiscountPaise - result.couponDiscountPaise
    ).toBe(result.totalPaise);
  });
});

// 6. Percentage coupon & capping at subtotal
describe("percentage coupon applied after commitment discount", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 400000,
      durationMonths: 3,
      discountPercentage: 10,
      allowPartialPayment: true,
    }),
    coupon: { type: "PERCENTAGE", flatAmountPaise: 0, percentage: 5 },
  });

  it("coupon discount = round(1080000 × 5 / 100) = 54000", () => {
    expect(result.couponDiscountPaise).toBe(54000);
  });

  it("total = 1080000 − 54000 = 1026000", () => {
    expect(result.totalPaise).toBe(1026000);
  });

  it("minimum upfront = round(1026000 × 0.5) = 513000", () => {
    expect(result.minimumUpfrontPaise).toBe(513000);
  });

  it("remainder = 1026000 − 513000 = 513000", () => {
    expect(result.remainderPaise).toBe(513000);
  });

  it("100% coupon caps at subtotal and brings total to 0", () => {
    const freeRes = calculatePricing({
      plan: makePlan({
        baseMonthlyPricePaise: 400000,
        durationMonths: 1,
        discountPercentage: 0,
      }),
      coupon: { type: "PERCENTAGE", flatAmountPaise: 0, percentage: 100 },
    });
    expect(freeRes.couponDiscountPaise).toBe(400000);
    expect(freeRes.totalPaise).toBe(0);
    expect(
      freeRes.grossPaise - freeRes.commitmentDiscountPaise - freeRes.couponDiscountPaise
    ).toBe(freeRes.totalPaise);
  });
});

// 7. Partial payment disabled — minimum upfront equals total
describe("partial payment disabled", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 400000,
      durationMonths: 3,
      discountPercentage: 10,
      allowPartialPayment: false,
    }),
  });

  it("minimum upfront equals total (no split)", () => {
    expect(result.minimumUpfrontPaise).toBe(result.totalPaise);
  });

  it("remainder is 0", () => {
    expect(result.remainderPaise).toBe(0);
  });
});

// 8. Custom minimum upfront percent (60%)
describe("custom minimum upfront percent (60%)", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 500000,
      durationMonths: 6,
      discountPercentage: 0,
      allowPartialPayment: true,
    }),
    minimumUpfrontPercent: 60,
  });

  it("total = 500000 × 6 = 3000000", () => {
    expect(result.totalPaise).toBe(3000000);
  });

  it("minimum upfront = round(3000000 × 60 / 100) = 1800000", () => {
    expect(result.minimumUpfrontPaise).toBe(1800000);
  });

  it("remainder = 3000000 − 1800000 = 1200000", () => {
    expect(result.remainderPaise).toBe(1200000);
  });
});

// 9. Null coupon treated the same as no coupon
describe("null coupon", () => {
  const withNull = calculatePricing({ plan: makePlan(), coupon: null });
  const withoutCoupon = calculatePricing({ plan: makePlan() });

  it("produces same result as omitting coupon", () => {
    expect(withNull).toEqual(withoutCoupon);
  });
});

// 10. Odd-paise half case (50% of 10801)
describe("odd-paise half case (50% of 10801)", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 10801,
      durationMonths: 1,
      discountPercentage: 0,
      allowPartialPayment: true,
    }),
    minimumUpfrontPercent: 50,
  });

  it("total is 10801", () => {
    expect(result.totalPaise).toBe(10801);
  });

  it("minimum upfront rounds half up: round(10801 * 50 / 100) = 5401", () => {
    expect(result.minimumUpfrontPaise).toBe(5401);
  });

  it("remainder = 10801 - 5401 = 5400", () => {
    expect(result.remainderPaise).toBe(5400);
  });

  it("minimum upfront + remainder exactly equals total", () => {
    expect(result.minimumUpfrontPaise + result.remainderPaise).toBe(10801);
  });
});

// 11. Zero-total plan with partial allowed
describe("zero-total plan with partial allowed", () => {
  const result = calculatePricing({
    plan: makePlan({
      baseMonthlyPricePaise: 0,
      durationMonths: 1,
      allowPartialPayment: true,
    }),
  });

  it("everything is 0 without error", () => {
    expect(result.grossPaise).toBe(0);
    expect(result.totalPaise).toBe(0);
    expect(result.minimumUpfrontPaise).toBe(0);
    expect(result.remainderPaise).toBe(0);
  });
});

// 12. Input validation (throws RangeError)
describe("input validation RangeErrors", () => {
  it("rejects negative baseMonthlyPricePaise", () => {
    expect(() =>
      calculatePricing({ plan: makePlan({ baseMonthlyPricePaise: -100 }) })
    ).toThrow(RangeError);
  });

  it("rejects non-integer baseMonthlyPricePaise", () => {
    expect(() =>
      calculatePricing({ plan: makePlan({ baseMonthlyPricePaise: 4500.5 }) })
    ).toThrow(RangeError);
  });

  it("rejects durationMonths < 1", () => {
    expect(() =>
      calculatePricing({ plan: makePlan({ durationMonths: 0 }) })
    ).toThrow(RangeError);
  });

  it("rejects non-integer durationMonths", () => {
    expect(() =>
      calculatePricing({ plan: makePlan({ durationMonths: 1.5 }) })
    ).toThrow(RangeError);
  });

  it("rejects discountPercentage < 0", () => {
    expect(() =>
      calculatePricing({ plan: makePlan({ discountPercentage: -5 }) })
    ).toThrow(RangeError);
  });

  it("rejects discountPercentage > 100", () => {
    expect(() =>
      calculatePricing({ plan: makePlan({ discountPercentage: 105 }) })
    ).toThrow(RangeError);
  });

  it("rejects negative minimumUpfrontPercent", () => {
    expect(() =>
      calculatePricing({ plan: makePlan(), minimumUpfrontPercent: -10 })
    ).toThrow(RangeError);
  });

  it("rejects minimumUpfrontPercent > 100", () => {
    expect(() =>
      calculatePricing({ plan: makePlan(), minimumUpfrontPercent: 110 })
    ).toThrow(RangeError);
  });

  it("rejects non-integer minimumUpfrontPercent", () => {
    expect(() =>
      calculatePricing({ plan: makePlan(), minimumUpfrontPercent: 50.5 })
    ).toThrow(RangeError);
  });

  it("rejects negative flatAmountPaise in coupon", () => {
    expect(() =>
      calculatePricing({
        plan: makePlan(),
        coupon: { type: "FLAT", flatAmountPaise: -50, percentage: 0 },
      })
    ).toThrow(RangeError);
  });

  it("rejects non-integer flatAmountPaise in coupon", () => {
    expect(() =>
      calculatePricing({
        plan: makePlan(),
        coupon: { type: "FLAT", flatAmountPaise: 50.25, percentage: 0 },
      })
    ).toThrow(RangeError);
  });

  it("rejects coupon percentage > 100", () => {
    expect(() =>
      calculatePricing({
        plan: makePlan(),
        coupon: { type: "PERCENTAGE", flatAmountPaise: 0, percentage: 120 },
      })
    ).toThrow(RangeError);
  });
});

// 13. Payment validation (validatePayment)
describe("validatePayment", () => {
  const partialConfig = {
    totalPaise: 100000,
    amountPaidPaise: 0,
    allowPartialPayment: true,
    minimumUpfrontPercent: 50, // minimum upfront = 50000
  };

  it("accepts minimum upfront at the exact boundary (50000)", () => {
    expect(() =>
      validatePayment({ ...partialConfig, paymentPaise: 50000 })
    ).not.toThrow();
  });

  it("accepts full payment on partial plan (100000)", () => {
    expect(() =>
      validatePayment({ ...partialConfig, paymentPaise: 100000 })
    ).not.toThrow();
  });

  it("rejects one paise below minimum upfront (49999)", () => {
    expect(() =>
      validatePayment({ ...partialConfig, paymentPaise: 49999 })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "BELOW_MINIMUM_UPFRONT",
      })
    );
  });

  it("rejects payment of zero", () => {
    expect(() =>
      validatePayment({ ...partialConfig, paymentPaise: 0 })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "INVALID_PAYMENT_AMOUNT",
      })
    );
  });

  it("rejects negative payment", () => {
    expect(() =>
      validatePayment({ ...partialConfig, paymentPaise: -500 })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "INVALID_PAYMENT_AMOUNT",
      })
    );
  });

  it("rejects overpayment above remaining balance", () => {
    expect(() =>
      validatePayment({ ...partialConfig, paymentPaise: 100001 })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "PAYMENT_EXCEEDS_BALANCE",
      })
    );
  });

  it("rejects payment when already fully paid", () => {
    expect(() =>
      validatePayment({
        totalPaise: 100000,
        amountPaidPaise: 100000,
        paymentPaise: 5000,
        allowPartialPayment: true,
      })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "ALREADY_PAID",
      })
    );
  });

  it("enforces full payment on full-only plan", () => {
    expect(() =>
      validatePayment({
        totalPaise: 100000,
        amountPaidPaise: 0,
        paymentPaise: 50000,
        allowPartialPayment: false,
      })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "FULL_PAYMENT_REQUIRED",
      })
    );
  });

  it("allows valid subsequent payment on partial balance", () => {
    expect(() =>
      validatePayment({
        totalPaise: 100000,
        amountPaidPaise: 50000,
        paymentPaise: 25000,
        allowPartialPayment: true,
      })
    ).not.toThrow();
  });

  it("rejects subsequent payment exceeding remaining balance", () => {
    expect(() =>
      validatePayment({
        totalPaise: 100000,
        amountPaidPaise: 50000,
        paymentPaise: 50001,
        allowPartialPayment: true,
      })
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "PAYMENT_EXCEEDS_BALANCE",
      })
    );
  });
});

// 14. Coupon validation (validateCoupon)
describe("validateCoupon", () => {
  const baseCoupon: CouponDocument = {
    isActive: true,
    validFrom: new Date("2026-01-01T00:00:00Z"),
    validUntil: new Date("2026-12-31T23:59:59Z"),
    maxRedemptions: 10,
  };
  const testNow = new Date("2026-06-01T12:00:00Z");

  it("passes for valid active coupon within date and redemption limits", () => {
    expect(() =>
      validateCoupon(baseCoupon, testNow, 5)
    ).not.toThrow();
  });

  it("rejects inactive coupon", () => {
    expect(() =>
      validateCoupon({ ...baseCoupon, isActive: false }, testNow, 0)
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "COUPON_INACTIVE",
      })
    );
  });

  it("rejects not-yet-valid coupon", () => {
    const futureDate = new Date("2025-12-01T00:00:00Z");
    expect(() =>
      validateCoupon(baseCoupon, futureDate, 0)
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "COUPON_NOT_YET_VALID",
      })
    );
  });

  it("rejects expired coupon", () => {
    const expiredDate = new Date("2027-01-01T00:00:00Z");
    expect(() =>
      validateCoupon(baseCoupon, expiredDate, 0)
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "COUPON_EXPIRED",
      })
    );
  });

  it("rejects when redemptions reach maxRedemptions", () => {
    expect(() =>
      validateCoupon(baseCoupon, testNow, 10)
    ).toThrowError(
      expect.objectContaining({
        name: "AppError",
        code: "COUPON_MAX_REDEEMED",
      })
    );
  });

  it("allows unlimited redemptions when maxRedemptions is null", () => {
    expect(() =>
      validateCoupon({ ...baseCoupon, maxRedemptions: null }, testNow, 9999)
    ).not.toThrow();
  });
});

// 15. Date addition clamped to end-of-month (addMonths)
describe("addMonths with month-end clamping", () => {
  it("Jan 31 + 1 month in non-leap year (2025) → Feb 28", () => {
    const start = new Date("2025-01-31T00:00:00Z");
    const result = addMonths(start, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2025-02-28");
  });

  it("Jan 31 + 1 month in leap year (2024) → Feb 29", () => {
    const start = new Date("2024-01-31T00:00:00Z");
    const result = addMonths(start, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2024-02-29");
  });

  it("Dec 31 + 2 months in non-leap year (2024-12-31 + 2m) → 2025-02-28", () => {
    const start = new Date("2024-12-31T00:00:00Z");
    const result = addMonths(start, 2);
    expect(result.toISOString().slice(0, 10)).toBe("2025-02-28");
  });

  it("March 31 + 1 month → April 30", () => {
    const start = new Date("2025-03-31T00:00:00Z");
    const result = addMonths(start, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2025-04-30");
  });

  it("preserves regular days when target month has enough days", () => {
    const start = new Date("2025-01-15T10:30:00Z");
    const result = addMonths(start, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2025-02-15");
    expect(result.getUTCHours()).toBe(10);
    expect(result.getUTCMinutes()).toBe(30);
  });
});
