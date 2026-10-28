import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  durationMonths: number;
  baseMonthlyPricePaise: number;
  discountPercentage: number;
  allowPartialPayment: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    durationMonths: {
      type: Number,
      required: [true, "Duration in months is required"],
      min: [1, "Duration must be at least 1 month"],
    },
    baseMonthlyPricePaise: {
      type: Number,
      required: [true, "Base monthly price in paise is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Base monthly price must be an integer (paise)",
      },
    },
    discountPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Discount cannot be less than 0%"],
      max: [100, "Discount cannot exceed 100%"],
    },
    allowPartialPayment: {
      type: Boolean,
      required: true,
      default: false,
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

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);

