import mongoose, { Document, Schema, Types } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: Types.ObjectId;
  inStock: boolean;
  weight: string;
  ingredients?: string;
  shelfLife?: string;
  rating: number;
  reviewCount: number;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    images: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    inStock: { type: Boolean, default: true },
    weight: { type: String, required: true },
    ingredients: { type: String },
    shelfLife: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });

toJsonPlugin(productSchema);

export const Product = mongoose.model<IProduct>("Product", productSchema);
