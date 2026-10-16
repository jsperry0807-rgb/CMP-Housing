/**
 * Grants the admin role to an existing account.
 *
 *   pnpm --filter api promote admin@example.com
 */
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { User } from "../models/user.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: pnpm --filter api promote <email>");
  process.exit(1);
}

await connectDatabase();

const user = await User.findOneAndUpdate(
  { email },
  { role: "admin" },
  { new: true },
);

if (!user) {
  console.error(`No account found for ${email}`);
  process.exitCode = 1;
} else {
  console.log(`${user.email} is now an admin.`);
}

await mongoose.disconnect();
