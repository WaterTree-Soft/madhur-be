import { Router, Request, Response } from "express";
import { z } from "zod";
import { Banner } from "../../models/Banner";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { validate } from "../../middleware/validate";

const router = Router();

const bannerSchema = z.object({
  message: z.string().min(1),
  link: z.string().url().optional().or(z.literal("")),
  active: z.boolean().default(true),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const [banners, total] = await Promise.all([
      Banner.find().skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Banner.countDocuments(),
    ]);
    return sendSuccess(res, banners, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch banners", 500);
  }
});

router.post("/", validate(bannerSchema), async (req: Request, res: Response) => {
  try {
    const banner = await Banner.create(req.body);
    return sendSuccess(res, banner, undefined, 201);
  } catch {
    return sendError(res, "Failed to create banner", 500);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return sendError(res, "Banner not found", 404);
    return sendSuccess(res, banner);
  } catch {
    return sendError(res, "Failed to fetch banner", 500);
  }
});

router.put("/:id", validate(bannerSchema.partial()), async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return sendError(res, "Banner not found", 404);
    return sendSuccess(res, banner);
  } catch {
    return sendError(res, "Failed to update banner", 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return sendError(res, "Banner not found", 404);
    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete banner", 500);
  }
});

export default router;
