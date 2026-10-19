import { Router } from "express";
import { isValidObjectId, type QueryFilter } from "mongoose";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { slugify } from "../lib/slug.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import {
  Listing,
  LISTING_STATUSES,
  PUBLIC_LISTING_STATUSES,
  type IListing,
} from "../models/listing.js";
import { isStaff, type UserDocument } from "../models/user.js";

export const listingRouter = Router();

// Owners may set these on their own listing; only a teacher or admin may approve.
const OWNER_SETTABLE_STATUSES = ["draft", "pending"] as const;
const OWNER_SETTABLE = new Set<string>(OWNER_SETTABLE_STATUSES);

/** Team details shown wherever a listing is presented. */
const TEAM_FIELDS = "name logo";
/** Submitter details shown wherever a listing is presented. */
const OWNER_FIELDS = "name email";

const entrySchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

const addressSchema = z.object({
  line1: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().max(40).optional(),
  postalCode: z.string().trim().max(20).optional(),
});

const mapsSchema = z.object({
  location: z.string().trim().max(1000).optional(),
  schools: z.string().trim().max(1000).optional(),
  shops: z.string().trim().max(1000).optional(),
});

const listingInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(6000),
  totalCost: z.coerce.number().int().min(0).max(1_000_000_000),
  beds: z.coerce.number().int().min(0).max(50).default(0),
  baths: z.coerce.number().min(0).max(50).default(0),
  sqft: z.coerce.number().int().min(0).max(1_000_000).default(0),
  year: z.coerce.number().int().min(1800).max(2100).optional(),
  propertyTax: z.coerce.number().min(0).max(10_000_000).optional(),
  assessment: z.coerce.number().min(0).max(1_000_000_000).optional(),
  address: addressSchema,
  maps: mapsSchema.default({ location: undefined }),
  highlights: z.array(entrySchema).max(20).default([]),
  interior: z.array(entrySchema).max(30).default([]),
  roomTypes: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  images: z.array(z.string().trim().min(1).max(500)).max(15).default([]),
  model: z.string().trim().max(500).optional(),
  similar: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/))
    .max(12)
    .optional(),
  status: z.enum(OWNER_SETTABLE_STATUSES).default("pending"),
});

// Admins may set any status; owners are limited to OWNER_SETTABLE_STATUSES.
const listingUpdateSchema = listingInputSchema
  .extend({ status: z.enum(LISTING_STATUSES).optional() })
  .partial();

const browseQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  minCost: z.coerce.number().min(0).optional(),
  maxCost: z.coerce.number().min(0).optional(),
  beds: z.coerce.number().int().min(0).optional(),
  sort: z
    .enum(["newest", "cost-asc", "cost-desc", "sqft-desc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const SORTS: Record<
  z.infer<typeof browseQuerySchema>["sort"],
  Record<string, 1 | -1>
> = {
  newest: { createdAt: -1 },
  "cost-asc": { totalCost: 1 },
  "cost-desc": { totalCost: -1 },
  "sqft-desc": { sqft: -1 },
};

/** Fields returned for the "similar houses" cards on the detail page. */
const SIMILAR_FIELDS =
  "name slug images totalCost beds baths sqft address owner team";

/** Stops user input from being interpreted as a regex. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }
  return parsed.data;
}

function requireObjectId(id: string): string {
  if (!isValidObjectId(id)) throw new HttpError(404, "Listing not found");
  return id;
}

/** `owner` is an ObjectId normally, or a User document when populated. */
function ownerIdOf(listing: { owner: unknown }): string {
  const owner = listing.owner as { _id?: unknown } | null;
  if (owner && typeof owner === "object" && owner._id) {
    return String(owner._id);
  }
  return String(owner);
}

function teamIdOf(listing: { team?: unknown }): string | null {
  const team = listing.team as { _id?: unknown } | null | undefined;
  if (team && typeof team === "object" && team._id) {
    return String(team._id);
  }
  if (team) return String(team);
  return null;
}

function canManage(
  listing: { owner: unknown; team?: unknown },
  user: UserDocument,
): boolean {
  if (isStaff(user.role)) return true;
  const teamId = teamIdOf(listing);
  const userTeam = user.team ? String(user.team) : null;
  if (teamId && userTeam && teamId === userTeam) return true;
  return ownerIdOf(listing) === String(user._id);
}

/** Adds a short suffix until the slug is free, ignoring `excludeId`'s own slug. */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "listing";
  let slug = base;

  const filter = (value: string) =>
    excludeId ? { slug: value, _id: { $ne: excludeId } } : { slug: value };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await Listing.exists(filter(slug));
    if (!taken) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------- public reads

listingRouter.get("/", async (req, res) => {
  const parsed = browseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid query", parsed.error.issues);
  }

  const { q, city, minCost, maxCost, beds, sort, page, limit } = parsed.data;

  const filter: QueryFilter<IListing> = {
    status: { $in: PUBLIC_LISTING_STATUSES },
  };

  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ name: rx }, { description: rx }, { "address.city": rx }];
  }
  if (city) {
    filter["address.city"] = new RegExp(`^${escapeRegExp(city)}$`, "i");
  }
  if (minCost !== undefined || maxCost !== undefined) {
    filter.totalCost = {
      ...(minCost !== undefined ? { $gte: minCost } : {}),
      ...(maxCost !== undefined ? { $lte: maxCost } : {}),
    };
  }
  if (beds !== undefined) filter.beds = { $gte: beds };

  const [total, items] = await Promise.all([
    Listing.countDocuments(filter),
    Listing.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("owner", OWNER_FIELDS)
      .populate("team", TEAM_FIELDS),
  ]);

  res.json({
    items,
    total,
    page,
    pageSize: limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

// Declared before "/:slug" so it is not swallowed by the parameterised route.
listingRouter.get("/featured", async (_req, res) => {
  const items = await Listing.find({ status: { $in: PUBLIC_LISTING_STATUSES } })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("owner", OWNER_FIELDS)
    .populate("team", TEAM_FIELDS);

  res.json({ items });
});

listingRouter.get("/:slug", optionalAuth, async (req, res) => {
  const listing = await Listing.findOne({
    slug: String(req.params.slug),
  })
    .populate("owner", OWNER_FIELDS)
    .populate("team", TEAM_FIELDS)
    .populate({
      path: "similar",
      select: SIMILAR_FIELDS,
      populate: [
        { path: "owner", select: OWNER_FIELDS },
        { path: "team", select: TEAM_FIELDS },
      ],
    });

  if (!listing) throw new HttpError(404, "Listing not found");

  // Non-public listings are only visible to their owner and teachers.
  if (!PUBLIC_LISTING_STATUSES.includes(listing.status)) {
    const allowed = req.user && canManage(listing, req.user);
    if (!allowed) throw new HttpError(404, "Listing not found");
  }

  res.json({ listing });
});

// --------------------------------------------------------------- owner writes

listingRouter.post("/", requireAuth, async (req, res) => {
  const user = req.user!;
  const input = parseBody(listingInputSchema, req.body);

  // Students submit as part of a team; staff may post designs without one.
  if (!user.team && !isStaff(user.role)) {
    throw new HttpError(
      400,
      "You need to be on a team before submitting a design",
    );
  }

  const listing = await Listing.create({
    ...input,
    slug: await uniqueSlug(input.name),
    owner: user._id,
    team: user.team,
  });

  const created = await listing.save();
  const populated = await Listing.findById(created._id)
    .populate("owner", OWNER_FIELDS)
    .populate("team", TEAM_FIELDS);
  res.status(201).json({ listing: populated ?? created });
});

listingRouter.patch("/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = requireObjectId(String(req.params.id));

  const listing = await Listing.findById(id);
  if (!listing) throw new HttpError(404, "Listing not found");
  if (!canManage(listing, user)) {
    throw new HttpError(403, "This is not your listing");
  }

  const input = parseBody(listingUpdateSchema, req.body);

  // Owners may not approve their own listing.
  if (
    input.status !== undefined &&
    !isStaff(user.role) &&
    !OWNER_SETTABLE.has(input.status)
  ) {
    throw new HttpError(403, "Only a teacher can approve a listing");
  }

  // Drop undefined keys so an omitted field never blanks the stored value.
  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );

  const previousName = listing.name;
  Object.assign(listing, changes);

  // Keep the URL stable unless the name actually changes.
  if (input.name && input.name !== previousName) {
    listing.slug = await uniqueSlug(input.name, String(listing._id));
  }

  const saved = await listing.save();
  const populated = await Listing.findById(saved._id)
    .populate("owner", OWNER_FIELDS)
    .populate("team", TEAM_FIELDS);
  res.json({ listing: populated ?? saved });
});

listingRouter.delete("/:id", requireAuth, async (req, res) => {
  const user = req.user!;
  const id = requireObjectId(String(req.params.id));

  const listing = await Listing.findById(id);
  if (!listing) throw new HttpError(404, "Listing not found");
  if (!canManage(listing, user)) {
    throw new HttpError(403, "This is not your listing");
  }

  await listing.deleteOne();
  res.status(204).end();
});
