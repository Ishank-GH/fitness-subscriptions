import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document {
  _id: string;
  seq: number;
}

interface ICounterModel extends Model<ICounter> {
  getNextSequence(sequenceName: string): Promise<number>;
  getNextInvoiceNumber(): Promise<string>;
}

const CounterSchema = new Schema<ICounter>({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
    required: true,
  },
});

/**
 * Atomically increments and returns the next integer sequence for a given identifier.
 */
CounterSchema.statics.getNextSequence = async function (
  sequenceName: string
): Promise<number> {
  const result = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
};

/**
 * Generates an atomic invoice number in format INV-0001, INV-0002...
 */
CounterSchema.statics.getNextInvoiceNumber = async function (): Promise<string> {
  const nextSeq = await (this as ICounterModel).getNextSequence("invoice");
  return `INV-${String(nextSeq).padStart(4, "0")}`;
};

export const Counter: ICounterModel =
  (mongoose.models.Counter as ICounterModel) ||
  mongoose.model<ICounter, ICounterModel>("Counter", CounterSchema);

