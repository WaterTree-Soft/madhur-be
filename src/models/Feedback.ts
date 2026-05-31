import mongoose, { Document, Schema, Types } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface IFeedback extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  comment: string;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

feedbackSchema.index({ product: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, product: 1 }, { unique: true });

toJsonPlugin(feedbackSchema);

export const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);
