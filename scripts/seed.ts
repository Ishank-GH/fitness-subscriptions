import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import { SubscriptionPlan } from "../src/lib/db/models/subscription-plan";
import { Coupon } from "../src/lib/db/models/coupon";
import { Counter } from "../src/lib/db/models/counter";
import { formatPaiseToRupees } from "../src/lib/format";

const SEED_PLANS = [
  {
    name: "1-Month Foundation",
    durationMonths: 1,
    baseMonthlyPricePaise: 450000, // ₹4,500
    discountPercentage: 0,
    allowPartialPayment: false,
    isActive: true,
  },
  {
    name: "3-Month Progression",
    durationMonths: 3,
    baseMonthlyPricePaise: 400000, // ₹4,000/mo = ₹12,000 gross
    discountPercentage: 10, // 10% commitment discount = ₹10,800 net
    allowPartialPayment: true,
    isActive: true,
  },
  {
    name: "12-Month Athlete",
    durationMonths: 12,
    baseMonthlyPricePaise: 350000, // ₹3,500/mo = ₹42,000 gross
    discountPercentage: 20, // 20% annual discount = ₹33,600 net
    allowPartialPayment: true,
    isActive: true,
  },
];

const SEED_COUPONS = [
  {
    code: "WELCOME10",
    type: "PERCENTAGE" as const,
    flatAmountPaise: 0,
    percentage: 10,
    maxRedemptions: 100,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    isActive: true,
  },
  {
    code: "FOUNDER500",
    type: "FLAT" as const,
    flatAmountPaise: 50000, // ₹500 flat off
    percentage: 0,
    maxRedemptions: 50,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    isActive: true,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("ERROR: MONGODB_URI is not set in environment or .env.local");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully.\n");

  // 1. Seed Plans
  console.log("Seeding Subscription Plans...");
  for (const planData of SEED_PLANS) {
    const plan = await SubscriptionPlan.findOneAndUpdate(
      { name: planData.name },
      { $set: planData },
      { upsert: true, returnDocument: "after" }
    );
    const grossPaise = plan.baseMonthlyPricePaise * plan.durationMonths;
    const netPaise = Math.round(grossPaise * (1 - plan.discountPercentage / 100));
    console.log(
      `  ✓ Plan: ${plan.name} (${plan.durationMonths}m) | Net: ${formatPaiseToRupees(
        netPaise
      )} | Partial: ${plan.allowPartialPayment ? "50% Upfront" : "Full only"} | ID: ${plan._id}`
    );
  }

  // 2. Seed Coupons
  console.log("\nSeeding Discount Coupons...");
  for (const couponData of SEED_COUPONS) {
    const coupon = await Coupon.findOneAndUpdate(
      { code: couponData.code },
      {
        $set: {
          code: couponData.code,
          type: couponData.type,
          flatAmountPaise: couponData.flatAmountPaise,
          percentage: couponData.percentage,
          maxRedemptions: couponData.maxRedemptions,
          validFrom: couponData.validFrom,
          validUntil: couponData.validUntil,
          isActive: couponData.isActive,
        },
        $setOnInsert: {
          currentRedemptions: 0,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    const discountLabel =
      coupon.type === "PERCENTAGE"
        ? `${coupon.percentage}% off`
        : `${formatPaiseToRupees(coupon.flatAmountPaise)} flat off`;
    console.log(
      `  ✓ Coupon: ${coupon.code} (${discountLabel}) | Max Uses: ${
        coupon.maxRedemptions
      } | Active: ${coupon.isActive}`
    );
  }

  // 3. Initialize Invoice Counter
  console.log("\nInitializing Invoice Sequence Counter...");
  const counter = await Counter.findOneAndUpdate(
    { _id: "invoice" },
    { $setOnInsert: { seq: 0 } },
    { upsert: true, returnDocument: "after" }
  );
  console.log(`  ✓ Counter 'invoice' sequence ready (current seq: ${counter.seq})`);

  console.log("\nDatabase seeding completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seeding failed with error:", err);
  await mongoose.disconnect();
  process.exit(1);
});

