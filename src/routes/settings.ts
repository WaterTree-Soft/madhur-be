import { Router, Request, Response } from "express";
import { SiteSetting } from "../models/SiteSetting";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/settings  — public
router.get("/", async (_req: Request, res: Response) => {
  try {
    const settings = await SiteSetting.findOne();
    return sendSuccess(res, settings ?? {});
  } catch {
    return sendError(res, "Failed to fetch settings", 500);
  }
});

export default router;
