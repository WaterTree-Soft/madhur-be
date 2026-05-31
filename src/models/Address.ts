import mongoose, { Document, Schema, Types } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export interface IAddressDetail {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IAddress extends Document {
  user: Types.ObjectId;
  label?: string;
  isDefault: boolean;
  address: IAddressDetail;
}

const addressDetailSchema = new Schema<IAddressDetail>(
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

const addressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    address: { type: addressDetailSchema, required: true },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1 });

toJsonPlugin(addressSchema);

export const Address = mongoose.model<IAddress>("Address", addressSchema);
