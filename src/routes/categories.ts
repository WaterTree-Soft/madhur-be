import { Router, Request, Response } from "express";
import { Category } from "../models/Category";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/categories
router.get("/", async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().populate("productCount").sort({ name: 1 });
    return sendSuccess(res, categories);
  } catch {
    return sendError(res, "Failed to fetch categories", 500);
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate("productCount");
    if (!category) return sendError(res, "Category not found", 404);
    return sendSuccess(res, category);
  } catch {
    return sendError(res, "Failed to fetch category", 500);
  }
});

export default router;
