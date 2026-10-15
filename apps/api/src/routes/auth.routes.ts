import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { clearAuthCookie, setAuthCookie } from "../lib/session.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1),
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

  const user = await User.create({ name, email, password });
  setAuthCookie(res, { id: user.id, email: user.email });

  res.status(201).json({ user });
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

  res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
