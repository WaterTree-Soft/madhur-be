import mongoose, { Document, Schema } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

toJsonPlugin(categorySchema, { virtuals: true });

export const Category = mongoose.model<ICategory>("Category", categorySchema);
