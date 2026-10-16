import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { clearAuthCookie, setAuthCookie } from "../lib/session.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";

export const authRouter = Router();

/** Students sign up with their Erie County Technical School email address. */
const SCHOOL_EMAIL_DOMAIN = "ects.org";

const schoolEmailSchema = z
  .email()
  .max(254)
  .refine((value) => value.toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`), {
    message: `Use your @${SCHOOL_EMAIL_DOMAIN} school email address`,
  });

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: schoolEmailSchema,
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await User.exists({ email });
  if (existing) {
    throw new HttpError(409, "An account with that email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
  });
  setAuthCookie(res, { id: user.id, email: user.email });

  const populated = await User.findById(user._id).populate("team", "name logo");
  res.status(201).json({ user: populated ?? user });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email }).select("+password");

  // Same message either way so we don't leak which emails are registered.
  if (!user || !(await user.verifyPassword(parsed.data.password))) {
    throw new HttpError(401, "Invalid email or password");
  }

  setAuthCookie(res, { id: user.id, email: user.email });

  const populated = await User.findById(user._id).populate("team", "name logo");
  res.json({ user: populated ?? user });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const populated = await User.findById(req.user!._id).populate(
    "team",
    "name logo",
  );
  res.json({ user: populated ?? req.user });
});

/** Updates the signed-in account's profile name. */
authRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const changes = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  );

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: changes },
    { new: true },
  ).populate("team", "name logo");
  if (!user) throw new HttpError(404, "Account not found");

  res.json({ user });
});
