import { Router, Request, Response } from "express";
import { upload } from "../../middleware/upload";
import { uploadToR2 } from "../../utils/r2";
import { sendSuccess, sendError } from "../../utils/response";

const router = Router();

// POST /api/admin/upload  — single file
// Optional body field `folder` sets the R2 key prefix (e.g. "categories/sweets")
router.post("/", (req: Request, res: Response, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, "Please upload an image of less than 100kb", 400);
      }
      if (err.message) {
        return sendError(res, err.message, 400);
      }
      return sendError(res, "File upload failed", 400);
    }
    next();
  });
}, async (req: Request, res: Response) => {
  if (!req.file) return sendError(res, "No file uploaded", 400);
  const folder = (req.body?.folder as string | undefined)?.trim() || "uploads";
  try {
    const url = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
    return sendSuccess(res, { url, size: req.file.size }, undefined, 201);
  } catch (err) {
    console.error("[R2 upload error]", err);
    return sendError(res, "Failed to upload image to storage", 500);
  }
});

// POST /api/admin/upload/multiple  — up to 10 files
// Optional body field `folder` sets the R2 key prefix (e.g. "products/sweets/kaju-katli")
router.post("/multiple", (req: Request, res: Response, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, "Please upload an image of less than 100kb", 400);
      }
      if (err.message) {
        return sendError(res, err.message, 400);
      }
      return sendError(res, "File upload failed", 400);
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return sendError(res, "No files uploaded", 400);
  const folder = (req.body?.folder as string | undefined)?.trim() || "uploads";
  try {
    const results = await Promise.all(
      files.map(async (f) => ({
        url: await uploadToR2(f.buffer, f.originalname, f.mimetype, folder),
        size: f.size,
      }))
    );
    return sendSuccess(res, results, undefined, 201);
  } catch (err) {
    console.error("[R2 upload error]", err);
    return sendError(res, "Failed to upload images to storage", 500);
  }
});

export default router;
