import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { Address } from "../models/Address";
import { sendSuccess, sendError } from "../utils/response";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createAddressSchema, updateAddressSchema } from "../schemas/address.schema";

const router = Router();

// GET /api/addresses
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const addresses = await Address.find({ user: req.user!.userId }).sort({ isDefault: -1, createdAt: -1 });
    return sendSuccess(res, addresses);
  } catch {
    return sendError(res, "Failed to fetch addresses", 500);
  }
});

// POST /api/addresses
router.post("/", authenticate, validate(createAddressSchema), async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    if (req.body.isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const address = await Address.create({ ...req.body, user: userId });
    return sendSuccess(res, address, undefined, 201);
  } catch {
    return sendError(res, "Failed to create address", 500);
  }
});

// PUT /api/addresses/:id
router.put("/:id", authenticate, validate(updateAddressSchema), async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    if (req.body.isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!address) return sendError(res, "Address not found", 404);
    return sendSuccess(res, address);
  } catch {
    return sendError(res, "Failed to update address", 500);
  }
});

// DELETE /api/addresses/:id
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user!.userId,
    });
    if (!address) return sendError(res, "Address not found", 404);
    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete address", 500);
  }
});

export default router;
