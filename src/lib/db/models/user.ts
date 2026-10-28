import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type UserRole = "ADMIN" | "USER";
export type SubscriptionStatus = "ACTIVE" | "PARTIAL" | "EXPIRED" | "NONE";

export interface IUserSubscription {
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

/**
 * Derives subscription status dynamically at read time.
 * Eliminates stale state bugs caused by stored statuses.
 */
UserSchema.virtual("derivedStatus").get(function (this: IUser): SubscriptionStatus {
  if (!this.subscription || !this.subscription.endDate) {
    return "NONE";
  }

  const now = new Date();
  if (now > new Date(this.subscription.endDate)) {
    return "EXPIRED";
  }

  if (this.subscription.balanceDuePaise > 0) {
    return "PARTIAL";
  }

  return "ACTIVE";
});

/**
 * 3-day expiry warning indicator derived from endDate.
 */
UserSchema.virtual("isExpiringSoon").get(function (this: IUser): boolean {
  if (!this.subscription || !this.subscription.endDate) {
    return false;
  }

  const now = Date.now();
  const end = new Date(this.subscription.endDate).getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  // Active or Partial and ending within 3 days
  return end > now && end - now <= threeDaysMs;
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

