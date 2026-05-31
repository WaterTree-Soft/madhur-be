import mongoose, { Document, Schema } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface IJob extends Document {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
  order: number;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ active: 1, order: 1 });

toJsonPlugin(jobSchema);

export const Job = mongoose.model<IJob>("Job", jobSchema);
