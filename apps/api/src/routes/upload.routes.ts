import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { Router } from "express";
import multer from "multer";
import { HttpError } from "../lib/http-error.js";
import {
  imageUpload,
  isSafeFilename,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  UPLOAD_DIR,
  uploadUrl,
} from "../lib/uploads.js";
import { requireAuth } from "../middleware/auth.js";

export const uploadRouter = Router();

// Uploading requires an account; deleting an uploaded file does too.
uploadRouter.use(requireAuth);

function messageFor(error: unknown): string {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return `Each image must be ${MAX_IMAGE_BYTES / (1024 * 1024)} MB or smaller`;
    }
    return `You can upload up to ${MAX_IMAGES} images at a time`;
  }
  if (error instanceof Error) return error.message;
  return "Could not upload the images";
}

/** Accepts multipart/form-data with up to 15 images in the "images" field. */
uploadRouter.post("/", (req, res, next) => {
  imageUpload.array("images", MAX_IMAGES)(req, res, (error: unknown) => {
    if (error) {
      next(new HttpError(400, messageFor(error)));
      return;
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      next(new HttpError(400, "No images were uploaded"));
      return;
    }

    res.status(201).json({
      files: files.map((file) => ({
        url: uploadUrl(file.filename),
        name: file.filename,
        size: file.size,
      })),
    });
  });
});

/** Removes a previously uploaded file. */
uploadRouter.delete("/:name", (req, res) => {
  const name = String(req.params.name);
  if (!isSafeFilename(name)) {
    throw new HttpError(400, "Invalid file name");
  }

  const target = join(UPLOAD_DIR, name);
  if (!target.startsWith(UPLOAD_DIR)) {
    throw new HttpError(400, "Invalid file name");
  }
  if (existsSync(target)) unlinkSync(target);

  res.status(204).end();
});
