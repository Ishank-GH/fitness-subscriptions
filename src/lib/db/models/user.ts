import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { UserRole, SubscriptionStatus } from "@/types";
import { deriveSubscriptionStatus, isExpiringSoon } from "@/lib/subscription-status";
// Ensure referenced schema is registered for populate queries
import "./subscription-plan";
import "./transaction";

export interface IUserSubscription {
  transactionId: Types.ObjectId;
  planId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  balanceDuePaise: number;
}

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  subscription?: IUserSubscription | null;
  createdAt: Date;
  updatedAt: Date;
  derivedStatus: SubscriptionStatus;
  isExpiringSoon: boolean;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    balanceDuePaise: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Balance due cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Balance due must be an integer (paise)",
      },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: [true, "Clerk ID is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      default: "USER",
      required: true,
      index: true,
    },
    subscription: {
      type: UserSubscriptionSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual("derivedStatus").get(function (this: IUser): SubscriptionStatus {
  return deriveSubscriptionStatus(
    this.subscription?.endDate,
    this.subscription?.balanceDuePaise
  );
});

UserSchema.virtual("isExpiringSoon").get(function (this: IUser): boolean {
  return isExpiringSoon(
    this.subscription?.endDate,
    this.subscription?.balanceDuePaise
  );
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);