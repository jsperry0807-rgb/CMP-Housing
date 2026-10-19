import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { requireAuth, requireTeacher } from "../middleware/auth.js";
import { LISTING_STATUSES, Listing } from "../models/listing.js";

export const moderationRouter = Router();

// Teachers and admins moderate student designs.
moderationRouter.use(requireAuth, requireTeacher);

const queueQuerySchema = z.object({
  status: z.enum(LISTING_STATUSES).default("pending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

function requireObjectId(id: string): string {
  if (!isValidObjectId(id)) throw new HttpError(404, "Listing not found");
  return id;
}

/** Moderation queue, newest first. */
moderationRouter.get("/listings", async (req, res) => {
  const parsed = queueQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid query", parsed.error.issues);
  }

  const { status, page, limit } = parsed.data;

  const [total, items] = await Promise.all([
    Listing.countDocuments({ status }),
    Listing.find({ status })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("owner", "name email")
      .populate("team", "name logo"),
  ]);

  res.json({
    items,
    total,
    page,
    pageSize: limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

moderationRouter.post("/listings/:id/approve", async (req, res) => {
  const id = requireObjectId(String(req.params.id));

  const listing = await Listing.findByIdAndUpdate(
    id,
    { status: "active", rejectionReason: undefined },
    { new: true },
  ).populate([
    { path: "owner", select: "name email" },
    { path: "team", select: "name logo" },
  ]);
  if (!listing) throw new HttpError(404, "Listing not found");

  res.json({ listing });
});

moderationRouter.post("/listings/:id/reject", async (req, res) => {
  const id = requireObjectId(String(req.params.id));

  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const listing = await Listing.findByIdAndUpdate(
    id,
    { status: "rejected", rejectionReason: parsed.data.reason },
    { new: true },
  ).populate([
    { path: "owner", select: "name email" },
    { path: "team", select: "name logo" },
  ]);
  if (!listing) throw new HttpError(404, "Listing not found");

  res.json({ listing });
});
