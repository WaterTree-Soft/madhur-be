import mongoose, { Document, Schema } from "mongoose";
import { toJsonPlugin } from "../utils/toJsonPlugin";

interface BusinessAddress {
  name?: string;
  phone?: string;
  phone2?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  email2?: string;
  hoursWeekdays?: string;
  hoursSunday?: string;
}

export interface ISiteSetting extends Document {
  whatsappNumber?: string;
  bannerMessage?: string;
  bannerLink?: string;
  bannerActive: boolean;
  freeShippingThreshold: number;
  shippingFee: number;
  taxRate: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  cookiesPolicy?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  aboutUs?: string;
  careers?: string;
  faqs?: string;
  shippingPolicy?: string;
  returnsPolicy?: string;
  businessAddress?: BusinessAddress;
  heroImages?: string[];
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    whatsappNumber: { type: String },
    bannerMessage: { type: String },
    bannerLink: { type: String },
    bannerActive: { type: Boolean, default: true },
    freeShippingThreshold: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    accentColor: { type: String },
    cookiesPolicy: { type: String },
    privacyPolicy: { type: String },
    termsOfService: { type: String },
    aboutUs: { type: String },
    careers: { type: String },
    faqs: { type: String },
    shippingPolicy: { type: String },
    returnsPolicy: { type: String },
    businessAddress: {
      name: { type: String },
      phone: { type: String },
      phone2: { type: String },
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      email: { type: String },
      email2: { type: String },
      hoursWeekdays: { type: String },
      hoursSunday: { type: String },
    },
    heroImages: { type: [String], default: [] },
  },
  { timestamps: true }
);

toJsonPlugin(siteSettingSchema);

export const SiteSetting = mongoose.model<ISiteSetting>("SiteSetting", siteSettingSchema);
