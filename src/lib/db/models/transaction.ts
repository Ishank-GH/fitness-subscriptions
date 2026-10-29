import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { PaymentStatus } from "@/types";

export interface IPlanSnapshot {
  name: string;
  durationMonths: number;
  baseMonthlyPricePaise: number;
  discountPercentage: number;
}

export interface ICouponSnapshot {
  code: string;
  type: "FLAT" | "PERCENTAGE";
  flatAmountPaise: number;
  percentage: number;
}

export interface IPaymentRecord {
  amountPaise: number;
  paidAt: Date;
  reference: string;
}

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  invoiceNumber: string;
  planSnapshot: IPlanSnapshot;
  couponSnapshot?: ICouponSnapshot | null;
  totalAmountPaise: number;
  amountPaidPaise: number;
  remainingBalancePaise: number;
  paymentStatus: PaymentStatus;
  paymentDate?: Date;
  payments: IPaymentRecord[];
  overriddenBy?: Types.ObjectId | null;
  overriddenAt?: Date | null;
  overrideNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSnapshotSchema = new Schema<IPlanSnapshot>(
  {
    name: { type: String, required: true },
    durationMonths: { type: Number, required: true },
    baseMonthlyPricePaise: { type: Number, required: true },
    discountPercentage: { type: Number, required: true },
  },
  { _id: false }
);

const CouponSnapshotSchema = new Schema<ICouponSnapshot>(
  {
    code: { type: String, required: true },
    type: { type: String, enum: ["FLAT", "PERCENTAGE"], required: true },
    flatAmountPaise: { type: Number, required: true },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    amountPaise: {
      type: Number,
      required: true,
      min: [1, "Payment amount must be greater than zero"],
      validate: {
        validator: Number.isInteger,
        message: "Payment amount must be an integer (paise)",
      },
    },
    paidAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: [true, "Plan ID is required"],
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      index: true,
    },
    planSnapshot: {
      type: PlanSnapshotSchema,
      required: [true, "Plan snapshot is required for historical billing integrity"],
    },
    couponSnapshot: {
      type: CouponSnapshotSchema,
      default: null,
    },
    totalAmountPaise: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total amount must be an integer (paise)",
      },
    },
    amountPaidPaise: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Amount paid must be an integer (paise)",
      },
    },
    remainingBalancePaise: {
      type: Number,
      required: true,
      min: [0, "Remaining balance cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Remaining balance must be an integer (paise)",
      },
    },
    paymentStatus: {
      type: String,
      enum: ["COMPLETED", "PARTIAL", "PENDING"],
      default: "PENDING",
      required: true,
      index: true,
    },
    paymentDate: {
      type: Date,
    },
    payments: {
      type: [PaymentRecordSchema],
      default: [],
    },
    overriddenBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    overriddenAt: {
      type: Date,
      default: null,
    },
    overrideNote: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
