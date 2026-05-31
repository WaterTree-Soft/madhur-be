import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().min(5),
  image: z.string().min(1),
});

export const updateCategorySchema = createCategorySchema.partial();
