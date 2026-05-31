import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Feedback } from "../models/Feedback";
import { Product } from "../models/Product";
import { sendSuccess, sendError, paginationMeta } from "../utils/response";
import { getPagination } from "../utils/pagination";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createFeedbackSchema } from "../schemas/feedback.schema";

const router = Router();

// GET /api/feedback?product=<id>
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (req.query.product) filter.product = req.query.product;

    const [feedback, total] = await Promise.all([
      Feedback.find(filter).populate("user", "name avatar").skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Feedback.countDocuments(filter),
    ]);

    return sendSuccess(res, feedback, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch feedback", 500);
  }
});

// POST /api/feedback
router.post("/", authenticate, validate(createFeedbackSchema), async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const existing = await Feedback.findOne({ user: userId, product: req.body.product });
    if (existing) return sendError(res, "You have already reviewed this product", 409);

    const feedback = await Feedback.create({ ...req.body, user: userId });

    // Recalculate product rating
    const stats = await Feedback.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.body.product) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(req.body.product, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    const populated = await feedback.populate("user", "name avatar");
    return sendSuccess(res, populated, undefined, 201);
  } catch {
    return sendError(res, "Failed to submit feedback", 500);
  }
});

export default router;
