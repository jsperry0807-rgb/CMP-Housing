import { mkdirSync } from "node:fs";
import { extname } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";

/**
 * Where uploaded images live on disk. Resolved relative to this file so it
 * works the same under `tsx` (src/) and a compiled build (dist/).
 */
export const UPLOAD_DIR = fileURLToPath(
  new URL("../../uploads/", import.meta.url),
);

export const MAX_IMAGES = 15;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, UPLOAD_DIR),
  filename: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase().slice(0, 10);
    const unique = randomBytes(6).toString("hex");
    callback(null, `${Date.now()}-${unique}${extension || ".jpg"}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { files: MAX_IMAGES, fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(
        new Error("Only JPG, PNG, WebP, GIF or AVIF images are allowed"),
      );
      return;
    }
    callback(null, true);
  },
});

/** The public path an uploaded file is served from. */
export function uploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}

/**
 * Guards against path traversal — an uploaded name is always a flat filename
 * made of safe characters.
 */
export function isSafeFilename(name: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(name) && !name.includes("..");
}
