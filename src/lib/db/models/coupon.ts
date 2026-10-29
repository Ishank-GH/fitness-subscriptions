import mongoose, { Schema, Document, Model } from "mongoose";
import { CouponType } from "@/types";

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  flatAmountPaise: number;
  percentage: number;
  maxRedemptions: number | null;
  currentRedemptions: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["FLAT", "PERCENTAGE"],
        message: "Coupon type must be either FLAT or PERCENTAGE",
      },
      required: [true, "Coupon type is required"],
    },
    flatAmountPaise: {
      type: Number,
      default: 0,
      min: [0, "Flat amount cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Flat amount must be an integer (paise)",
      },
    },
    percentage: {
      type: Number,
      default: 0,
      min: [0, "Percentage discount cannot be negative"],
      max: [100, "Percentage discount cannot exceed 100%"],
    },
    maxRedemptions: {
      type: Number,
      default: null,
    },
    currentRedemptions: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
