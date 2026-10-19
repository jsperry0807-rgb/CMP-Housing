/**
 * Creates an admin account, printing a freshly generated password.
 *
 *   pnpm --filter api create-admin owner@ects.org
 *   pnpm --filter api create-admin owner@ects.org "chosen-password"
 *
 * If the email already exists it is simply promoted to admin, so the script is
 * safe to run again after a database wipe.
 */
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { User } from "../models/user.js";

const email = process.argv[2]?.trim().toLowerCase();
const chosenPassword = process.argv[3]?.trim();

if (!email) {
  console.error("Usage: pnpm --filter api create-admin <email> [password]");
  process.exit(1);
}

/** A URL-safe password with plenty of entropy. */
function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

/** A readable fallback display name, e.g. "jane.doe" -> "Jane Doe". */
function nameFromEmail(value: string): string {
  const local = value.split("@")[0] ?? "Admin";
  const words = local
    .split(/[._-]+/)
    .map((word) => word.replace(/\d+$/, ""))
    .filter(Boolean);
  const name = words
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
  return name || "Admin";
}

await connectDatabase();

const existing = await User.findOne({ email });

if (existing) {
  existing.role = "admin";
  if (chosenPassword) {
    existing.password = chosenPassword;
  }
  await existing.save();
  console.log(`${existing.email} already existed — it is now an admin.`);
  if (chosenPassword) {
    console.log("Password updated.");
  }
} else {
  const password = chosenPassword || generatePassword();
  const user = await User.create({
    name: nameFromEmail(email),
    email,
    password,
    role: "admin",
  });
  console.log(`Created admin ${user.email}.`);
  if (!chosenPassword) {
    console.log(`Temporary password: ${password}`);
    console.log("Change it from your profile after signing in.");
  }
}

await mongoose.disconnect();
