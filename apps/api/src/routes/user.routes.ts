import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { deleteUpload, isSafeFilename } from "../lib/uploads.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { Listing } from "../models/listing.js";
import { USER_ROLES, User } from "../models/user.js";

export const userRouter = Router();

// Only admins manage accounts and roles; teachers use /teams and /moderation.
userRouter.use(requireAuth, requireAdmin);

const TEAM_FIELDS = "name logo";

interface SerializedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  team: { id: string; name: string; logo?: string } | null;
  createdAt: Date;
}

function serializeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  team?: unknown;
}): SerializedUser {
  const team = user.team as
    { _id?: unknown; name?: string; logo?: string } | null | undefined;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    team:
      team && typeof team === "object" && team._id
        ? { id: String(team._id), name: team.name ?? "", logo: team.logo }
        : null,
    createdAt: user.createdAt,
  };
}

function requireUserId(id: string): string {
  if (!isValidObjectId(id)) throw new HttpError(404, "Account not found");
  return id;
}

/** Refuses to leave the site without an admin to run it. */
async function ensureNotLastAdmin(): Promise<void> {
  const admins = await User.countDocuments({ role: "admin" });
  if (admins <= 1) {
    throw new HttpError(400, "There must always be at least one admin");
  }
}

/** Best-effort removal of the photos uploaded for a set of designs. */
async function removeUploadedImages(images: string[]): Promise<void> {
  for (const url of images) {
    if (!url.startsWith("/uploads/")) continue;
    const filename = url.slice("/uploads/".length);
    if (!isSafeFilename(filename)) continue;
    try {
      await deleteUpload(filename);
    } catch {
      // Leave the file behind rather than failing the whole deletion.
    }
  }
}

/** Every account, for the admin's user management screen. */
userRouter.get("/", async (_req, res) => {
  const users = await User.find()
    .sort({ role: 1, name: 1 })
    .populate("team", TEAM_FIELDS);

  res.json({ users: users.map(serializeUser) });
});

const updateSchema = z.object({ role: z.enum(USER_ROLES) });

/** Change an account's role. */
userRouter.patch("/:id", async (req, res) => {
  const id = requireUserId(String(req.params.id));
  const admin = req.user!;

  if (id === String(admin._id)) {
    throw new HttpError(400, "You cannot change your own role");
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const user = await User.findById(id);
  if (!user) throw new HttpError(404, "Account not found");

  const nextRole = parsed.data.role;
  if (user.role === "admin" && nextRole !== "admin") {
    await ensureNotLastAdmin();
  }

  user.role = nextRole;
  // Only students belong to a team.
  if (nextRole !== "student") user.team = undefined;
  await user.save();

  const populated = await User.findById(id).populate("team", TEAM_FIELDS);
  res.json({ user: serializeUser(populated ?? user) });
});

/** Delete an account, along with the designs it owns. */
userRouter.delete("/:id", async (req, res) => {
  const id = requireUserId(String(req.params.id));
  const admin = req.user!;

  if (id === String(admin._id)) {
    throw new HttpError(400, "You cannot delete your own account");
  }

  const user = await User.findById(id);
  if (!user) throw new HttpError(404, "Account not found");
  if (user.role === "admin") await ensureNotLastAdmin();

  const owned = await Listing.find({ owner: user._id }).select("images model");
  await Listing.deleteMany({ owner: user._id });
  await removeUploadedImages(owned.flatMap((listing) => listing.images ?? []));
  // The 3D model, when present, has its own file to clean up.
  await removeUploadedImages(
    owned.flatMap((listing) => (listing.model ? [listing.model] : [])),
  );

  await user.deleteOne();
  res.status(204).end();
});
