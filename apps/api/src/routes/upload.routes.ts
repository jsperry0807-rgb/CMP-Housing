import { Router } from "express";
import multer from "multer";
import { HttpError } from "../lib/http-error.js";
import {
  deleteUpload,
  imageUpload,
  isSafeFilename,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  MAX_MODEL_BYTES,
  modelUpload,
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

function modelMessageFor(error: unknown): string {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return `The 3D model must be ${MAX_MODEL_BYTES / (1024 * 1024)} MB or smaller`;
  }
  if (error instanceof Error) return error.message;
  return "Could not upload the 3D model";
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

/** Accepts multipart/form-data with a single 3D model in the "model" field. */
uploadRouter.post("/model", (req, res, next) => {
  modelUpload.single("model")(req, res, (error: unknown) => {
    if (error) {
      next(new HttpError(400, modelMessageFor(error)));
      return;
    }

    const file = req.file;
    if (!file) {
      next(new HttpError(400, "No 3D model was uploaded"));
      return;
    }

    res.status(201).json({
      file: {
        url: uploadUrl(file.filename),
        name: file.filename,
        size: file.size,
      },
    });
  });
});

/** Removes a previously uploaded file from GridFS. */
uploadRouter.delete("/:name", async (req, res) => {
  const name = String(req.params.name);
  if (!isSafeFilename(name)) {
    throw new HttpError(400, "Invalid file name");
  }

  await deleteUpload(name);

  res.status(204).end();
});
