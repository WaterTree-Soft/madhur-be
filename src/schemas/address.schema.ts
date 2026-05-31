import { z } from "zod";

const addressDetailSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
  address: addressDetailSchema,
});

export const updateAddressSchema = createAddressSchema.partial();
