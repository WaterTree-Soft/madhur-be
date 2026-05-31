import { Router, Request, Response } from "express";
import { z } from "zod";
import { Testimonial } from "../../models/Testimonial";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { validate } from "../../middleware/validate";

const router = Router();

const testimonialSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  quote: z.string().min(10),
  rating: z.number().int().min(1).max(5).default(5),
  initial: z.string().max(2).optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const [testimonials, total] = await Promise.all([
      Testimonial.find().skip(skip).limit(pageSize).sort({ order: 1, createdAt: -1 }),
      Testimonial.countDocuments(),
    ]);
    return sendSuccess(res, testimonials, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch testimonials", 500);
  }
});

router.post("/", validate(testimonialSchema), async (req: Request, res: Response) => {
  try {
    const t = await Testimonial.create(req.body);
    return sendSuccess(res, t, undefined, 201);
  } catch {
    return sendError(res, "Failed to create testimonial", 500);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const t = await Testimonial.findById(req.params.id);
    if (!t) return sendError(res, "Testimonial not found", 404);
    return sendSuccess(res, t);
  } catch {
    return sendError(res, "Failed to fetch testimonial", 500);
  }
});

router.put("/:id", validate(testimonialSchema.partial()), async (req: Request, res: Response) => {
  try {
    const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) return sendError(res, "Testimonial not found", 404);
    return sendSuccess(res, t);
  } catch {
    return sendError(res, "Failed to update testimonial", 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const t = await Testimonial.findByIdAndDelete(req.params.id);
    if (!t) return sendError(res, "Testimonial not found", 404);
    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete testimonial", 500);
  }
});

export default router;
