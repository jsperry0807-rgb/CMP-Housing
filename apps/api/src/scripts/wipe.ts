/**
 * Wipes all application data, leaving a clean slate:
 * houses (listings), teams, and accounts (students and teachers).
 *
 *   pnpm --filter api db:wipe -- --yes
 *
 * Refuses to run without `--yes` because it cannot be undone.
 */
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { Listing } from "../models/listing.js";
import { Team } from "../models/team.js";
import { User } from "../models/user.js";

if (!process.argv.includes("--yes")) {
  console.error(
    "This deletes every house, team and account and cannot be undone.\n" +
      "Re-run with --yes to confirm:\n" +
      "  pnpm --filter api db:wipe -- --yes",
  );
  process.exit(1);
}

await connectDatabase();

const [listings, teams, users] = await Promise.all([
  Listing.deleteMany({}),
  Team.deleteMany({}),
  User.deleteMany({}),
]);

console.log(
  `Wiped ${listings.deletedCount} house(s), ${teams.deletedCount} team(s) and ${users.deletedCount} account(s).`,
);

await mongoose.disconnect();
