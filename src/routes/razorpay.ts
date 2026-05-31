import { Router, Request, Response } from "express";
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

function getRazorpayInstance() {
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// POST /api/razorpay/create-order
router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    if (!amount || isNaN(Number(amount))) return sendError(res, "Invalid amount", 422);

    const instance = getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(Number(amount) * 100), // paise
      currency,
      receipt: receipt ?? `rcpt_${Date.now()}`,
    });

    return sendSuccess(res, { orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    return sendError(res, "Failed to create payment order", 500);
  }
});

// POST /api/razorpay/verify-payment
router.post("/verify-payment", (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, "Missing payment verification fields", 422);
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return sendError(res, "Payment verification failed", 400);
    }

    return sendSuccess(res, { verified: true });
  } catch {
    return sendError(res, "Verification error", 500);
  }
});

export default router;
