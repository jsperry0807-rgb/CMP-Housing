import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { extname } from "node:path";
import mongoose from "mongoose";
import multer from "multer";

export const MAX_IMAGES = 15;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** A single 3D model, which is a lot heavier than a photo. */
export const MAX_MODEL_BYTES = 100 * 1024 * 1024;

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/**
 * Web-friendly 3D model formats. `.glb` is a self-contained binary glTF and is
 * what most tools (Blender, etc.) export for the web; `.gltf` is accepted too
 * but only works when it has its textures and buffers embedded.
 */
export const MODEL_EXTENSIONS = new Set([".glb", ".gltf"]);

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

/** Best-effort MIME type for an extension; uploads always store the real one. */
export function contentTypeForExtension(extension: string): string {
  return (
    EXTENSION_MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream"
  );
}

/**
 * Uploads live in MongoDB (GridFS, bucket `uploads`) rather than on local
 * disk: the API has no persistent filesystem in production, so the database is
 * the only place a file survives a redeploy.
 */
const BUCKET_NAME = "uploads";

function bucket(): mongoose.mongo.GridFSBucket {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error(
      "MongoDB is not connected — uploaded files are stored in GridFS",
    );
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

/** Unique, URL-safe name an upload is stored and addressed by. */
export function generateUploadName(originalName: string): string {
  const extension = extname(originalName).toLowerCase().slice(0, 10);
  const unique = randomBytes(6).toString("hex");
  return `${Date.now()}-${unique}${extension || ".jpg"}`;
}

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

/** A stored file's header information, as kept in `uploads.files`. */
export interface StoredUpload {
  id: mongoose.Types.ObjectId;
  filename: string;
  length: number;
  contentType?: string;
}

/** Looks up a stored upload by its generated filename, newest first. */
export async function findUpload(
  filename: string,
): Promise<StoredUpload | null> {
  const file = await bucket()
    .find({ filename })
    .sort({ uploadDate: -1 })
    .next();
  if (!file) return null;

  const metadata = file.metadata as { contentType?: string } | undefined;
  return {
    id: file._id,
    filename: file.filename,
    length: file.length,
    contentType: metadata?.contentType,
  };
}

/** Opens a readable stream over a stored upload's contents. */
export function openUploadDownload(id: mongoose.Types.ObjectId) {
  return bucket().openDownloadStream(id);
}

/**
 * Deletes every stored file with this filename. Best-effort: a file that is
 * already gone is not an error, and the caller keeps going either way.
 */
export async function deleteUpload(filename: string): Promise<void> {
  const files = await bucket().find({ filename }).toArray();
  for (const file of files) {
    try {
      await bucket().delete(file._id);
    } catch {
      // Already deleted — nothing to do.
    }
  }
}

/**
 * Stores a file from local disk under a fixed name, replacing any previous
 * file with the same name. Used by the seed scripts so reseeding photos does
 * not pile up duplicates.
 */
export async function storeLocalUpload(
  sourcePath: string,
  filename: string,
  contentType: string,
): Promise<void> {
  await deleteUpload(filename);

  await new Promise<void>((resolve, reject) => {
    const upload = bucket().openUploadStream(filename, {
      metadata: { contentType },
    });
    createReadStream(sourcePath)
      .on("error", reject)
      .pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve());
  });
}

/**
 * A multer storage engine that streams uploads straight into GridFS. Nothing
 * is buffered on disk or in memory, so a 100 MB model on a small instance
 * costs no more RAM than a photo.
 */
const gridFsStorage: multer.StorageEngine = {
  _handleFile(_req, file, callback) {
    const filename = generateUploadName(file.originalname);

    let upload: mongoose.mongo.GridFSBucketWriteStream;
    try {
      upload = bucket().openUploadStream(filename, {
        metadata: {
          contentType: file.mimetype,
          originalName: file.originalname,
        },
      });
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    let failed = false;
    const fail = (error: Error) => {
      if (failed) return;
      failed = true;
      // Drop the partial file, then surface the original error.
      void upload
        .abort()
        .catch(() => {})
        .finally(() => callback(error));
    };

    upload.on("error", fail);
    file.stream.on("error", fail);
    upload.on("finish", () => {
      if (failed) return;
      // GridFS knows the final size only after every chunk is written.
      bucket()
        .find({ _id: upload.id })
        .next()
        .then((stored) => {
          callback(null, {
            filename,
            size: stored?.length ?? 0,
          });
        })
        .catch((error: unknown) => {
          fail(error instanceof Error ? error : new Error(String(error)));
        });
    });

    file.stream.pipe(upload);
  },

  _removeFile(_req, file, callback) {
    // Multer calls this when a later file in the same request fails, so the
    // already-stored files do not linger.
    deleteUpload(file.filename)
      .then(() => callback(null))
      .catch((error: unknown) => {
        callback(error instanceof Error ? error : null);
      });
  },
};

export const imageUpload = multer({
  storage: gridFsStorage,
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

/**
 * Accepts a single 3D model file. Browsers are inconsistent about the MIME type
 * they send for glTF, so the file extension is the reliable check here.
 */
export const modelUpload = multer({
  storage: gridFsStorage,
  limits: { files: 1, fileSize: MAX_MODEL_BYTES },
  fileFilter: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    if (!MODEL_EXTENSIONS.has(extension)) {
      callback(new Error("Only .glb or .gltf 3D models are allowed"));
      return;
    }
    callback(null, true);
  },
});
