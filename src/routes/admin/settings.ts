import { Router, Request, Response } from "express";
import { SiteSetting } from "../../models/SiteSetting";
import { sendSuccess, sendError } from "../../utils/response";
import { validate } from "../../middleware/validate";
import { updateSettingsSchema } from "../../schemas/settings.schema";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const settings = await SiteSetting.findOne();
    return sendSuccess(res, settings ?? {});
  } catch {
    return sendError(res, "Failed to fetch settings", 500);
  }
});

router.put("/", validate(updateSettingsSchema), async (req: Request, res: Response) => {
  try {
    const settings = await SiteSetting.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    return sendSuccess(res, settings);
  } catch {
    return sendError(res, "Failed to update settings", 500);
  }
});

export default router;
