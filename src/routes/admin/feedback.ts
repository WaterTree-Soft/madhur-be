import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Feedback } from "../../models/Feedback";
import { Product } from "../../models/Product";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const { product } = req.query;

    const filter: Record<string, unknown> = {};
    if (product) filter.product = product;

    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .populate("user", "name email")
        .populate("product", "name slug")
        .skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Feedback.countDocuments(filter),
    ]);

    return sendSuccess(res, feedback, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch feedback", 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return sendError(res, "Feedback not found", 404);

    // Recalculate product rating after deletion
    const stats = await Feedback.aggregate([
      { $match: { product: feedback.product } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(feedback.product, {
      rating: stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0,
      reviewCount: stats.length > 0 ? stats[0].count : 0,
    });

    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete feedback", 500);
  }
});

export default router;
