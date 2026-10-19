import { request } from "./api";

export type ListingStatus =
  "draft" | "pending" | "active" | "not-for-sale" | "rejected";
export type SortOption = "newest" | "cost-asc" | "cost-desc" | "sqft-desc";

export interface ListingAddress {
  line1?: string;
  city: string;
  state?: string;
  postalCode?: string;
}

/** A free-form "label: value" row (highlights, interior details). */
export interface ListingEntry {
  label: string;
  value: string;
}

export interface ListingMaps {
  location?: string;
  schools?: string;
  shops?: string;
}

/** The student who submitted a design (credited as "designed by"). */
export interface ListingOwner {
  id: string;
  name: string;
  /** Present where the API populates the account's contact details. */
  email?: string;
}

/** The team credited with a design. */
export interface ListingTeam {
  id?: string;
  name: string;
  logo?: string;
}

/** The fields needed to render a listing card. */
export interface ListingSummary {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  totalCost: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  address?: { city?: string; state?: string };
}

export interface CardListing extends ListingSummary {
  owner?: string | ListingOwner;
  team?: string | ListingTeam;
}

export interface Listing {
  _id: string;
  name: string;
  slug: string;
  address: ListingAddress;
  totalCost: number;
  beds: number;
  /** Can be fractional, e.g. 3.5 or 3.75. */
  baths: number;
  sqft: number;
  description: string;
  year?: number;
  propertyTax?: number;
  assessment?: number;
  maps?: ListingMaps;
  highlights: ListingEntry[];
  interior: ListingEntry[];
  roomTypes: string[];
  images: string[];
  /** Public URL of an uploaded interactive 3D model, if the design has one. */
  model?: string;
  /** An id normally, or a summary object once the API populates it. */
  similar?: Array<string | ListingSummary>;
  status: ListingStatus;
  rejectionReason?: string;
  owner: string | ListingOwner;
  /** An id normally, or the team once the API populates it. */
  team?: string | ListingTeam;
  createdAt: string;
  updatedAt: string;
}

export interface BrowseParams {
  q?: string;
  city?: string;
  minCost?: number;
  maxCost?: number;
  beds?: number;
  forSale?: boolean;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface BrowseResult {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface ListingInput {
  name: string;
  description: string;
  totalCost: number;
  beds: number;
  baths: number;
  sqft: number;
  year?: number;
  propertyTax?: number;
  assessment?: number;
  address: ListingAddress;
  maps: ListingMaps;
  highlights: ListingEntry[];
  interior: ListingEntry[];
  roomTypes: string[];
  images: string[];
  /** Public URL of an uploaded 3D model; omit or clear to remove it. */
  model?: string;
  status?: "draft" | "pending";
}

function toSearchParams(params: object): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const listingsApi = {
  browse: (params: BrowseParams = {}) =>
    request<BrowseResult>(`/api/listings${toSearchParams(params)}`),

  featured: () => request<{ items: Listing[] }>("/api/listings/featured"),

  bySlug: (slug: string) =>
    request<{ listing: Listing }>(`/api/listings/${encodeURIComponent(slug)}`),

  create: (input: ListingInput) =>
    request<{ listing: Listing }>("/api/listings", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: Partial<ListingInput>) =>
    request<{ listing: Listing }>(`/api/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/api/listings/${id}`, { method: "DELETE" }),

  mine: () =>
    request<{
      items: Listing[];
      counts: { total: number; pending: number; active: number };
    }>("/api/me/listings"),
};

export interface UploadedImage {
  url: string;
  name: string;
  size: number;
}

export const uploadApi = {
  /** Uploads up to 15 image files in one multipart request. */
  images: (files: File[]) => {
    const body = new FormData();
    for (const file of files) body.append("images", file);
    return request<{ files: UploadedImage[] }>("/api/uploads", {
      method: "POST",
      body,
    });
  },

  /** Uploads a single interactive 3D model (a .glb or .gltf file). */
  model: (file: File) => {
    const body = new FormData();
    body.append("model", file);
    return request<{ file: UploadedImage }>("/api/uploads/model", {
      method: "POST",
      body,
    });
  },

  remove: (name: string) =>
    request<void>(`/api/uploads/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
};

export interface ModerationQueueParams {
  status?: ListingStatus;
  page?: number;
  limit?: number;
}

export const moderationApi = {
  queue: (params: ModerationQueueParams = {}) =>
    request<BrowseResult>(`/api/moderation/listings${toSearchParams(params)}`),

  approve: (id: string) =>
    request<{ listing: Listing }>(`/api/moderation/listings/${id}/approve`, {
      method: "POST",
    }),

  reject: (id: string, reason: string) =>
    request<{ listing: Listing }>(`/api/moderation/listings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  active: "Live",
  "not-for-sale": "Not for sale",
  rejected: "Rejected",
};

export interface OwnerTeam {
  name: string;
  logo?: string;
  email?: string;
  member?: string;
}

/**
 * The team credited with a design: the team itself where the API populated it,
 * otherwise the submitting student. Null when nothing is populated yet.
 */
export function ownerTeam(listing: {
  owner?: string | ListingOwner;
  team?: string | ListingTeam;
}): OwnerTeam | null {
  const owner = typeof listing.owner === "object" ? listing.owner : undefined;
  const team = typeof listing.team === "object" ? listing.team : undefined;

  if (!team && !owner) return null;

  return {
    name: team?.name || owner?.name || "Unknown team",
    logo: team?.logo,
    email: owner?.email,
    member: owner?.name,
  };
}

/** The populated "similar houses", ignoring any raw ids. */
export function similarListings(listing: Listing): ListingSummary[] {
  return (listing.similar ?? []).filter(
    (item): item is ListingSummary => typeof item === "object" && item !== null,
  );
}

export function formatCost(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** 3 → "3", 3.5 → "3.5". Keeps fractional bathrooms readable. */
export function formatBaths(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0$/, "");
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
