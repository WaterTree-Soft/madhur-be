import { Router, Request, Response } from "express";
import { Order } from "../../models/Order";
import { Product } from "../../models/Product";
import { User } from "../../models/User";
import { Feedback } from "../../models/Feedback";
import { sendSuccess, sendError } from "../../utils/response";

const router = Router();

// GET /api/admin/stats
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      totalFeedback,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paid: true } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Product.countDocuments(),
      User.countDocuments(),
      Feedback.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("userId", "name email"),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    return sendSuccess(res, {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      totalProducts,
      totalUsers,
      totalFeedback,
      recentOrders,
      ordersByStatus: ordersByStatus.reduce(
        (acc: Record<string, number>, s: { _id: string; count: number }) => {
          acc[s._id] = s.count;
          return acc;
        },
        {}
      ),
    });
  } catch {
    return sendError(res, "Failed to fetch stats", 500);
  }
});

export default router;
