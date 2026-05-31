import { Router, Request, Response } from "express";
import { z } from "zod";
import { Job } from "../../models/Job";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { validate } from "../../middleware/validate";

const router = Router();

const jobSchema = z.object({
  title: z.string().min(2),
  department: z.string().min(1),
  location: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(10),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const [jobs, total] = await Promise.all([
      Job.find().skip(skip).limit(pageSize).sort({ order: 1, createdAt: -1 }),
      Job.countDocuments(),
    ]);
    return sendSuccess(res, jobs, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch jobs", 500);
  }
});

router.post("/", validate(jobSchema), async (req: Request, res: Response) => {
  try {
    const job = await Job.create(req.body);
    return sendSuccess(res, job, undefined, 201);
  } catch {
    return sendError(res, "Failed to create job", 500);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return sendError(res, "Job not found", 404);
    return sendSuccess(res, job);
  } catch {
    return sendError(res, "Failed to fetch job", 500);
  }
});

router.put("/:id", validate(jobSchema.partial()), async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return sendError(res, "Job not found", 404);
    return sendSuccess(res, job);
  } catch {
    return sendError(res, "Failed to update job", 500);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return sendError(res, "Job not found", 404);
    return sendSuccess(res, { deleted: true });
  } catch {
    return sendError(res, "Failed to delete job", 500);
  }
});

export default router;
