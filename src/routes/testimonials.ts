import { Router, Request, Response } from "express";
import { Testimonial } from "../models/Testimonial";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/testimonials  — public, active only, sorted by order
router.get("/", async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(50);
    return sendSuccess(res, testimonials);
  } catch {
    return sendError(res, "Failed to fetch testimonials", 500);
  }
});

export default router;
