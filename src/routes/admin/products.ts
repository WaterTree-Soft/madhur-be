import { Router, Request, Response } from "express";
import slugify from "slugify";
import { Product } from "../../models/Product";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { validate } from "../../middleware/validate";
import { createProductSchema, updateProductSchema } from "../../schemas/product.schema";
import { deleteUrls } from "../../utils/r2";

const router = Router();

// GET /api/admin/products
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const { search, category, inStock } = req.query;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === "true";
    if (search) filter.$text = { $search: search as string };

    const [products, total] = await Promise.all([
      Product.find(filter).populate("category", "name slug").skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(res, products, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch products", 500);
  }
});

// POST /api/admin/products
router.post("/", validate(createProductSchema), async (req: Request, res: Response) => {
  try {
    const slug = req.body.slug ?? slugify(req.body.name, { lower: true, strict: true });
    const product = await Product.create({ ...req.body, slug });
    const populated = await product.populate("category", "name slug");
    return sendSuccess(res, populated, undefined, 201);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "11000") return sendError(res, "Slug already exists", 409);
    return sendError(res, "Failed to create product", 500);
  }
});

// GET /api/admin/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name slug");
    if (!product) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product);
  } catch {
    return sendError(res, "Failed to fetch product", 500);
  }
});

// PUT /api/admin/products/:id  — delete orphaned images from R2 before updating
router.put("/:id", validate(updateProductSchema), async (req: Request, res: Response) => {
  try {
    if (req.body.name && !req.body.slug) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    const old = await Product.findById(req.params.id);
    if (!old) return sendError(res, "Product not found", 404);

    // Delete images that are in the old list but not in the new list
    if (Array.isArray(req.body.images)) {
      const newSet = new Set<string>(req.body.images);
      const removed = (old.images ?? []).filter((url) => !newSet.has(url));
      if (removed.length) {
        deleteUrls(removed).catch((e) => console.warn("[R2 cleanup]", e));
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate("category", "name slug");
    if (!product) return sendError(res, "Product not found", 404);
    return sendSuccess(res, product);
  } catch {
    return sendError(res, "Failed to update product", 500);
  }
});

// DELETE /api/admin/products/:id  — remove images from R2 then delete product
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return sendError(res, "Product not found", 404);

    if (product.images?.length) {
      deleteUrls(product.images).catch((e) => console.warn("[R2 cleanup]", e));
    }

    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete product", 500);
  }
});

export default router;
