import multer from "multer";
import path from "path";
import { Request } from "express";

const ALLOWED = /^(image\/(jpeg|png|webp))$/;
const ALLOWED_EXT = /\.(jpg|jpeg|png|webp)$/i;

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED.test(file.mimetype) && ALLOWED_EXT.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
  }
}

const maxSizeMb = parseFloat(process.env.MAX_FILE_SIZE_MB ?? "0.1");

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});
