import { Router, Request, Response } from "express";
import { Order } from "../../models/Order";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { validate } from "../../middleware/validate";
import { updateOrderStatusSchema } from "../../schemas/order.schema";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const { status, userId } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate("userId", "name email").skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      Order.countDocuments(filter),
    ]);

    return sendSuccess(res, orders, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch orders", 500);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId", "name email");
    if (!order) return sendError(res, "Order not found", 404);
    return sendSuccess(res, order);
  } catch {
    return sendError(res, "Failed to fetch order", 500);
  }
});

router.put("/:id", validate(updateOrderStatusSchema), async (req: Request, res: Response) => {
  try {
    const update: Record<string, unknown> = { status: req.body.status };
    if (req.body.status === "cancelled") {
      update.cancellationReason = req.body.cancellationReason;
      update.cancelledAt = new Date();
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return sendError(res, "Order not found", 404);
    return sendSuccess(res, order);
  } catch {
    return sendError(res, "Failed to update order", 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return sendError(res, "Order not found", 404);
    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete order", 500);
  }
});

export default router;
