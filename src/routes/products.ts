import { Router, Request, Response } from "express";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { sendSuccess, sendError, paginationMeta } from "../utils/response";
import { getPagination } from "../utils/pagination";

const router = Router();

// GET /api/products
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const { category, categorySlug, search, inStock } = req.query;

    const filter: Record<string, unknown> = {};

    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug as string }, "_id");
      if (cat) filter.category = cat._id;
    } else if (category) {
      filter.category = category;
    }

    if (inStock === "true") filter.inStock = true;
    if (search) filter.$text = { $search: search as string };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(res, products, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch products", 500);
  }
});

// GET /api/products/:slug
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate(
      "category",
      "name slug"
    );
    if (!product) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product);
  } catch {
    return sendError(res, "Failed to fetch product", 500);
  }
});

export default router;
