import mongoose, { Document, Schema, Types } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface IOrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IDeliveryAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId | null;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  address: IDeliveryAddress;
  paid: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
}

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    address: { type: deliveryAddressSchema, required: true },
    paid: { type: Boolean, default: false },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

toJsonPlugin(orderSchema);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
