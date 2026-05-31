import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).optional(),
  description: z.string().min(10),
  shortDescription: z.string().min(5).max(500),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  images: z.array(z.string().url()).min(1),
  category: z.string().min(1),
  inStock: z.boolean().default(true),
  weight: z.string().min(1),
  ingredients: z.string().optional(),
  shelfLife: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();
