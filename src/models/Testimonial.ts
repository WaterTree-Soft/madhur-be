import mongoose, { Document, Schema } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface ITestimonial extends Document {
  name: string;
  location?: string;
  quote: string;
  rating: number;
  initial?: string;
  active: boolean;
  order: number;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String },
    quote: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    initial: { type: String, maxlength: 2 },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ active: 1, order: 1 });

toJsonPlugin(testimonialSchema);

export const Testimonial = mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
