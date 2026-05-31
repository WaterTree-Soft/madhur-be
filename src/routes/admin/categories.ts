import { Router, Request, Response } from "express";
import slugify from "slugify";
import { Category } from "../../models/Category";
import { Product } from "../../models/Product";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { validate } from "../../middleware/validate";
import { createCategorySchema, updateCategorySchema } from "../../schemas/category.schema";
import { deleteUrls, deleteObject, keyFromUrl, deleteFolder } from "../../utils/r2";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const [categories, total] = await Promise.all([
      Category.find().populate("productCount").skip(skip).limit(pageSize).sort({ name: 1 }),
      Category.countDocuments(),
    ]);
    return sendSuccess(res, categories, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch categories", 500);
  }
});

router.post("/", validate(createCategorySchema), async (req: Request, res: Response) => {
  try {
    const slug = req.body.slug ?? slugify(req.body.name, { lower: true, strict: true });
    const category = await Category.create({ ...req.body, slug });
    return sendSuccess(res, category, undefined, 201);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "11000") return sendError(res, "Slug already exists", 409);
    return sendError(res, "Failed to create category", 500);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id).populate("productCount");
    if (!category) return sendError(res, "Category not found", 404);
    return sendSuccess(res, category);
  } catch {
    return sendError(res, "Failed to fetch category", 500);
  }
});

router.put("/:id", validate(updateCategorySchema), async (req: Request, res: Response) => {
  try {
    if (req.body.name && !req.body.slug) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    // If the image is being replaced, delete the old one from R2
    if (req.body.image) {
      const old = await Category.findById(req.params.id);
      if (old?.image && old.image !== req.body.image) {
        deleteObject(keyFromUrl(old.image)).catch((e) => console.warn("[R2 cleanup]", e));
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate("productCount");
    if (!category) return sendError(res, "Category not found", 404);
    return sendSuccess(res, category);
  } catch {
    return sendError(res, "Failed to update category", 500);
  }
});

// DELETE /api/admin/categories/:id
// Deletes the category image, all product images under this category, and the category + its products.
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return sendError(res, "Category not found", 404);

    // Fire-and-forget R2 cleanup — runs after the 200 response
    (async () => {
      try {
        // 1. Delete the category's own image folder in R2
        if (category.image) {
          await deleteObject(keyFromUrl(category.image));
        }
        await deleteFolder(`categories/${category.slug}`);

        // 2. Delete all product images under this category's slug prefix
        await deleteFolder(`products/${category.slug}`);

        // 3. Also delete by stored URLs for any images outside the standard prefix
        const products = await Product.find({ category: category._id });
        const allImageUrls = products.flatMap((p) => p.images ?? []);
        if (allImageUrls.length) await deleteUrls(allImageUrls);

        // 4. Delete the products themselves
        await Product.deleteMany({ category: category._id });
      } catch (e) {
        console.error("[R2/DB cleanup after category delete]", e);
      }
    })();

    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete category", 500);
  }
});

export default router;
