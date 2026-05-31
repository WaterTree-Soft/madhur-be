import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product: z.string().min(1),
      name: z.string().min(1),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
      image: z.string().optional(),
    })
  ).min(1),
  total: z.number().positive(),
  address: addressSchema,
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  paid: z.boolean().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(5).max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
  cancellationReason: z.string().optional(),
});
