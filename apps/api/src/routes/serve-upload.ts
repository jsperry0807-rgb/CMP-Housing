import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";
import {
  findUpload,
  isSafeFilename,
  openUploadDownload,
} from "../lib/uploads.js";

/**
 * Streams an uploaded file (photo, logo or 3D model) out of GridFS. Upload
 * names are generated and never reused, so the response is safe to cache hard.
 */
export async function serveUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const name = String(req.params.name);
    if (!isSafeFilename(name)) throw new HttpError(400, "Invalid file name");

    const file = await findUpload(name);
    if (!file) {
      // Nothing stored under this name; fall through to the 404 handler.
      next();
      return;
    }

    res.setHeader(
      "Content-Type",
      file.contentType ?? "application/octet-stream",
    );
    res.setHeader("Content-Length", String(file.length));
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const stream = openUploadDownload(file.id);
    stream.on("error", (error: unknown) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      next(error);
    });
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}
