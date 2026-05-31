import { Router, Request, Response } from "express";
import { Cart } from "../models/Cart";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /api/cart
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user!.userId }).populate("items.product");
    return sendSuccess(res, cart ?? { items: [] });
  } catch {
    return sendError(res, "Failed to fetch cart", 500);
  }
});

// PUT /api/cart  — replaces entire cart
router.put("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return sendError(res, "items must be an array", 422);

    const cart = await Cart.findOneAndUpdate(
      { user: req.user!.userId },
      { items },
      { new: true, upsert: true, runValidators: true }
    ).populate("items.product");

    return sendSuccess(res, cart);
  } catch {
    return sendError(res, "Failed to update cart", 500);
  }
});

// DELETE /api/cart  — clear cart
router.delete("/", authenticate, async (req: Request, res: Response) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user!.userId }, { items: [] });
    return sendSuccess(res, { cleared: true });
  } catch {
    return sendError(res, "Failed to clear cart", 500);
  }
});

export default router;
