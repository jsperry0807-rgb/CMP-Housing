import { request } from "./api";

export type ListingType = "room" | "studio" | "apartment" | "house";
export type ListingStatus =
  "draft" | "pending" | "active" | "rejected" | "rented";

export type SortOption = "newest" | "price-asc" | "price-desc";

export interface ListingAddress {
  street?: string;
  city: string;
  postalCode?: string;
  country?: string;
}

export interface ListingOwner {
  id: string;
  name: string;
  /** Present in the admin queue, which populates name + email. */
  email?: string;
}

export interface Listing {
  _id: string;
  title: string;
  slug: string;
  description: string;
  /** Whole currency units per month, e.g. 750. */
  pricePerMonth: number;
  currency: string;
  type: ListingType;
  bedrooms: number;
  bathrooms: number;
  areaM2?: number;
  floor?: number;
  furnished: boolean;
  amenities: string[];
  address: ListingAddress;
  images: string[];
  availableFrom?: string;
  status: ListingStatus;
  rejectionReason?: string;
  /** An id normally, or `{ id, name }` once the API populates it. */
  owner: string | ListingOwner;
  createdAt: string;
  updatedAt: string;
}

export interface BrowseParams {
  q?: string;
  city?: string;
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  furnished?: boolean;
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
  title: string;
  description: string;
  pricePerMonth: number;
  type: ListingType;
  bedrooms: number;
  bathrooms: number;
  areaM2?: number;
  floor?: number;
  furnished: boolean;
  amenities: string[];
  address: ListingAddress;
  images: string[];
  availableFrom?: string;
  status?: "draft" | "pending" | "rented";
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

export interface AdminQueueParams {
  status?: ListingStatus;
  page?: number;
  limit?: number;
}

export const adminApi = {
  queue: (params: AdminQueueParams = {}) =>
    request<BrowseResult>(`/api/admin/listings${toSearchParams(params)}`),

  approve: (id: string) =>
    request<{ listing: Listing }>(`/api/admin/listings/${id}/approve`, {
      method: "POST",
    }),

  reject: (id: string, reason: string) =>
    request<{ listing: Listing }>(`/api/admin/listings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

/** Amenities offered as one-tap chips in the listing form. */
export const AMENITY_PRESETS = [
  "Wi-Fi",
  "Heating",
  "Kitchen",
  "Washing machine",
  "Dishwasher",
  "Balcony",
  "Elevator",
  "Parking",
  "Garden",
  "Basement storage",
  "Pets allowed",
  "Wheelchair accessible",
];

export const LISTING_TYPES: ListingType[] = [
  "room",
  "studio",
  "apartment",
  "house",
];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  room: "Room",
  studio: "Studio",
  apartment: "Apartment",
  house: "House",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  active: "Live",
  rejected: "Rejected",
  rented: "Rented",
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export function ownerName(listing: Listing): string | null {
  return typeof listing.owner === "object" && listing.owner !== null
    ? listing.owner.name
    : null;
}

export function formatPrice(
  listing: Pick<Listing, "pricePerMonth" | "currency">,
) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: listing.currency || "EUR",
    maximumFractionDigits: 0,
  }).format(listing.pricePerMonth);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
