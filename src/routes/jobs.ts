import { Router, Request, Response } from "express";
import { Job } from "../models/Job";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// GET /api/jobs — public, active only, sorted by order
router.get("/", async (_req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ active: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(100);
    return sendSuccess(res, jobs);
  } catch {
    return sendError(res, "Failed to fetch jobs", 500);
  }
});

export default router;
