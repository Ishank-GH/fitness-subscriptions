import mongoose, { Schema, Model } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

export interface ICounterModel extends Model<ICounter> {
  getNextSequence(sequenceName: string): Promise<number>;
  getNextInvoiceNumber(): Promise<string>;
}

const CounterSchema = new Schema<ICounter, ICounterModel>(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    _id: false,
  }
);

CounterSchema.statics.getNextSequence = async function (
  sequenceName: string
): Promise<number> {
  const result = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result?.seq ?? 1;
};

CounterSchema.statics.getNextInvoiceNumber = async function (): Promise<string> {
  const nextSeq = await (this as unknown as ICounterModel).getNextSequence("invoice");
  return `INV-${String(nextSeq).padStart(4, "0")}`;
};

export const Counter: ICounterModel =
  (mongoose.models.Counter as unknown as ICounterModel) ||
  mongoose.model<ICounter, ICounterModel>("Counter", CounterSchema);
