import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { sendSuccess, sendError, paginationMeta } from "../utils/response";
import { getPagination } from "../utils/pagination";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createOrderSchema, cancelOrderSchema } from "../schemas/order.schema";
import { sendOrderReceiptEmail } from "../utils/email";

const router = Router();

// POST /api/orders  — guest or authenticated
router.post("/", optionalAuth, validate(createOrderSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user ? new mongoose.Types.ObjectId(req.user.userId) : null;
    const order = await Order.create({ ...req.body, userId });

    // Fire-and-forget receipt email for paid orders by authenticated users
    if (order.paid && userId) {
      User.findById(userId)
        .then((user) => {
          if (!user) return;
          return sendOrderReceiptEmail({
            to: user.email,
            firstName: user.firstName,
            orderId: String(order._id),
            items: order.items,
            total: order.total,
            address: order.address,
            razorpayPaymentId: order.razorpayPaymentId,
            createdAt: order.get("createdAt"),
          });
        })
        .catch((err) => console.error("ORDER RECEIPT EMAIL FAILED:", err));
    }

    return sendSuccess(res, order, undefined, 201);
  } catch {
    return sendError(res, "Failed to create order", 500);
  }
});

// GET /api/orders/my  — authenticated users only
router.get("/my", authenticate, async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    const [orders, total] = await Promise.all([
      Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Order.countDocuments({ userId }),
    ]);

    return sendSuccess(res, orders, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch orders", 500);
  }
});

// POST /api/orders/:id/cancel
router.post("/:id/cancel", authenticate, validate(cancelOrderSchema), async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user!.userId),
    });

    if (!order) return sendError(res, "Order not found", 404);
    if (!["pending", "confirmed"].includes(order.status)) {
      return sendError(res, "Only pending or confirmed orders can be cancelled", 400);
    }

    order.status = "cancelled";
    order.cancellationReason = req.body.reason;
    order.cancelledAt = new Date();
    await order.save();

    return sendSuccess(res, order);
  } catch {
    return sendError(res, "Failed to cancel order", 500);
  }
});

export default router;
