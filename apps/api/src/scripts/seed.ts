/**
 * Seeds demo data for ECTS Housing.
 *
 *   pnpm --filter api db:seed
 *
 * For local and test databases only: it writes demo accounts (all sharing the
 * password below) and houses. It refuses to run when NODE_ENV=production.
 *
 * Replaces the demo accounts and the houses they own, leaving anything created
 * by real accounts alone. The houses themselves live in `house-catalog.ts`,
 * shared with the historical seed; photos are read from
 * `apps/api/seed-images/<image path>/` when that folder exists, otherwise a
 * handful of placeholder images are used so the galleries are not empty.
 */
import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { HOUSES, houseSlug, imagesFor } from "./house-catalog.js";
import { Listing } from "../models/listing.js";
import { Team, type TeamDocument } from "../models/team.js";
import { User } from "../models/user.js";

const DEMO_PASSWORD = "password123";

/** Accounts created by older versions of this seed; cleaned up on re-seed. */
const LEGACY_DEMO_EMAILS = ["mara@example.com", "jonas@example.com"];

interface DemoTeam {
  email: string;
  teamName: string;
  member: string;
}

const TEAMS: Record<string, DemoTeam> = {
  timberline: {
    email: "timberline@example.com",
    teamName: "Timberline Studio",
    member: "Ada Whitfield",
  },
  keystone: {
    email: "keystone@example.com",
    teamName: "Keystone Draft",
    member: "Marcus Bell",
  },
  blueridge: {
    email: "blueridge@example.com",
    teamName: "Blue Ridge Design",
    member: "Priya Raman",
  },
  summit: {
    email: "summit@example.com",
    teamName: "Summit Works",
    member: "Diego Alvarez",
  },
};

interface DemoAccount {
  name: string;
  email: string;
  role: "student" | "admin";
  /** Key into `TEAMS`, for accounts a teacher assigns to a team. */
  teamKey?: keyof typeof TEAMS;
}

const ACCOUNTS: DemoAccount[] = [
  ...Object.entries(TEAMS).map(([key, team]) => ({
    name: team.member,
    email: team.email,
    role: "student" as const,
    teamKey: key as keyof typeof TEAMS,
  })),
  {
    name: "Mr. Hartley",
    email: "admin@example.com",
    role: "admin",
  },
  {
    name: "Sam Rivera",
    email: "student@example.com",
    role: "student",
  },
];

async function upsertTeam(name: string): Promise<TeamDocument> {
  const existing = await Team.findOne({ name });
  if (existing) {
    return existing;
  }
  return Team.create({ name });
}

async function upsertAccount(account: DemoAccount, teamId?: string) {
  const existing = await User.findOne({ email: account.email });

  if (existing) {
    existing.name = account.name;
    existing.role = account.role;
    existing.team = teamId ? new mongoose.Types.ObjectId(teamId) : undefined;
    await existing.save();
    return existing;
  }

  return User.create({
    name: account.name,
    email: account.email,
    password: DEMO_PASSWORD,
    role: account.role,
    ...(teamId ? { team: teamId } : {}),
  });
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "db:seed writes demo accounts and houses and must not run against production.",
    );
    process.exit(1);
  }

  console.warn(
    "WARNING: db:seed creates demo accounts and houses (password: " +
      DEMO_PASSWORD +
      "). Use it only on a local or test database.",
  );

  await connectDatabase();

  // Clear out accounts created by earlier versions of this seed.
  const legacy = await User.find({ email: { $in: LEGACY_DEMO_EMAILS } });
  if (legacy.length > 0) {
    const legacyIds = legacy.map((user) => user._id);
    await Listing.deleteMany({ owner: { $in: legacyIds } });
    await User.deleteMany({ _id: { $in: legacyIds } });
    console.log(`Removed ${legacy.length} legacy demo account(s).`);
  }

  // The old schema kept the team identity on the user; drop those leftovers now
  // that membership points at a Team document. `strict: false` is required
  // because these paths are no longer part of the schema.
  await User.updateMany(
    {},
    { $unset: { teamName: "", teamLogo: "" } },
    { strict: false },
  );

  // One Team document per demo team; membership lives on the user.
  const teamIds = new Map<string, string>();
  for (const [key, team] of Object.entries(TEAMS)) {
    const doc = await upsertTeam(team.teamName);
    teamIds.set(key, String(doc._id));
  }

  const accounts = new Map<string, string>();
  for (const account of ACCOUNTS) {
    const teamId = account.teamKey ? teamIds.get(account.teamKey) : undefined;
    const user = await upsertAccount(account, teamId);
    accounts.set(account.email, String(user._id));
  }

  // Re-seed only the houses owned by the demo teams.
  const ownerIds = [...accounts.values()];
  await Listing.deleteMany({ owner: { $in: ownerIds } });

  const created: Array<{ id: string; totalCost: number }> = [];

  for (const house of HOUSES) {
    const owner = accounts.get(TEAMS[house.team].email)!;
    const team = teamIds.get(house.team)!;
    const slug = houseSlug(house.name);

    const listing = await Listing.create({
      name: house.name,
      slug,
      address: house.address,
      totalCost: house.totalCost,
      beds: house.beds,
      baths: house.baths,
      sqft: house.sqft,
      description: house.description,
      year: house.year,
      ...(house.propertyTax !== undefined
        ? { propertyTax: house.propertyTax }
        : {}),
      ...(house.assessment !== undefined
        ? { assessment: house.assessment }
        : {}),
      maps: house.maps,
      highlights: house.highlights,
      interior: house.interior,
      roomTypes: house.roomTypes,
      images: await imagesFor(house.imagePath, slug),
      status: "active",
      owner,
      team,
    });

    created.push({ id: String(listing._id), totalCost: house.totalCost });
  }

  // Link each house to the three most similarly priced ones.
  for (const house of created) {
    const similar = created
      .filter((other) => other.id !== house.id)
      .sort(
        (a, b) =>
          Math.abs(a.totalCost - house.totalCost) -
          Math.abs(b.totalCost - house.totalCost),
      )
      .slice(0, 3)
      .map((other) => other.id);

    await Listing.updateOne({ _id: house.id }, { $set: { similar } });
  }

  console.log(
    `Seeded ${created.length} houses and ${ACCOUNTS.length} accounts (password: ${DEMO_PASSWORD}).`,
  );

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
