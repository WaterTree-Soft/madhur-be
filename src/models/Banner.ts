import mongoose, { Document, Schema } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface IBanner extends Document {
  message: string;
  link?: string;
  active: boolean;
}

const bannerSchema = new Schema<IBanner>(
  {
    message: { type: String, required: true, trim: true },
    link: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

toJsonPlugin(bannerSchema);

export const Banner = mongoose.model<IBanner>("Banner", bannerSchema);
