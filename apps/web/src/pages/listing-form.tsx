import {
  CircleAlert,
  ImageIcon,
  LoaderCircle,
  Plus,
  Save,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import ListingImage from "@/components/listing-image";
import StatusBadge from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import {
  AMENITY_PRESETS,
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  listingsApi,
  type Listing,
  type ListingAddress,
  type ListingInput,
  type ListingStatus,
  type ListingType,
} from "@/lib/listings";
import { navigate } from "@/lib/router";
import { cn } from "@/lib/utils";

/** Numeric inputs are kept as strings so a half-typed value never becomes NaN. */
interface FormState {
  title: string;
  description: string;
  type: ListingType;
  pricePerMonth: string;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  floor: string;
  furnished: boolean;
  amenities: string[];
  street: string;
  city: string;
  postalCode: string;
  country: string;
  imagesText: string;
  availableFrom: string;
  /** Only meaningfully used while editing. */
  status: Visibility;
}

/** The owner-settable statuses, plus "keep" which only appears when editing. */
type Visibility = "keep" | "draft" | "pending" | "rented";

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  type: "apartment",
  pricePerMonth: "",
  bedrooms: "1",
  bathrooms: "1",
  areaM2: "",
  floor: "",
  furnished: false,
  amenities: [],
  street: "",
  city: "",
  postalCode: "",
  country: "",
  imagesText: "",
  availableFrom: "",
  status: "pending",
};

function fromListing(listing: Listing): FormState {
  return {
    title: listing.title,
    description: listing.description,
    type: listing.type,
    pricePerMonth: String(listing.pricePerMonth),
    bedrooms: String(listing.bedrooms),
    bathrooms: String(listing.bathrooms),
    areaM2: listing.areaM2 === undefined ? "" : String(listing.areaM2),
    floor: listing.floor === undefined ? "" : String(listing.floor),
    furnished: listing.furnished,
    amenities: listing.amenities ?? [],
    street: listing.address?.street ?? "",
    city: listing.address?.city ?? "",
    postalCode: listing.address?.postalCode ?? "",
    country: listing.address?.country ?? "",
    imagesText: (listing.images ?? []).join("\n"),
    availableFrom: listing.availableFrom
      ? listing.availableFrom.slice(0, 10)
      : "",
    status: "keep",
  };
}

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Client-side pre-flight; the API re-validates everything anyway. */
function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.title.trim().length < 5) {
    errors.title = "Use at least 5 characters.";
  }

  if (form.description.trim().length < 20) {
    errors.description = "Write at least 20 characters.";
  }

  const price = toNumber(form.pricePerMonth);
  if (price === undefined || price <= 0) {
    errors.pricePerMonth = "Enter a monthly price greater than 0.";
  }

  if (!form.city.trim()) errors.city = "City is required.";

  const images = parseLines(form.imagesText);
  if (images.length > 12) {
    errors.images = "Use at most 12 images.";
  } else if (images.some((url) => !/^https?:\/\//i.test(url))) {
    errors.images = "Every image URL must start with http:// or https://";
  }

  return errors;
}

function buildPayload(form: FormState): ListingInput {
  const address: ListingAddress = { city: form.city.trim() };
  if (form.street.trim()) address.street = form.street.trim();
  if (form.postalCode.trim()) address.postalCode = form.postalCode.trim();
  if (form.country.trim()) address.country = form.country.trim();

  const payload: ListingInput = {
    title: form.title.trim(),
    description: form.description.trim(),
    pricePerMonth: toNumber(form.pricePerMonth) ?? 0,
    type: form.type,
    bedrooms: toNumber(form.bedrooms) ?? 0,
    bathrooms: toNumber(form.bathrooms) ?? 0,
    furnished: form.furnished,
    amenities: form.amenities,
    address,
    images: parseLines(form.imagesText),
  };

  const areaM2 = toNumber(form.areaM2);
  if (areaM2 !== undefined) payload.areaM2 = areaM2;

  const floor = toNumber(form.floor);
  if (floor !== undefined) payload.floor = floor;

  if (form.availableFrom) {
    payload.availableFrom = new Date(form.availableFrom).toISOString();
  }

  if (form.status !== "keep") payload.status = form.status;

  return payload;
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default function ListingForm({ slug }: { slug?: string }) {
  const editing = Boolean(slug);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [listingId, setListingId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ListingStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [customAmenity, setCustomAmenity] = useState("");

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setLoading(true);
    setLoadError(null);

    listingsApi
      .bySlug(slug)
      .then(({ listing }) => {
        if (!active) return;
        setForm(fromListing(listing));
        setListingId(listing._id);
        setCurrentStatus(listing.status);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load this listing",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(name: string) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(name)
        ? current.amenities.filter((item) => item !== name)
        : [...current.amenities, name],
    }));
  }

  function addCustomAmenity() {
    const value = customAmenity.trim();
    if (!value) return;

    setForm((current) =>
      current.amenities.some(
        (item) => item.toLowerCase() === value.toLowerCase(),
      )
        ? current
        : { ...current, amenities: [...current.amenities, value] },
    );
    setCustomAmenity("");
  }

  function onCustomAmenityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomAmenity();
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const clientErrors = validate(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const payload = buildPayload(form);

      if (editing && listingId) {
        await listingsApi.update(listingId, payload);
        toast.success("Listing updated.");
      } else {
        await listingsApi.create(payload);
        toast.success(
          payload.status === "draft"
            ? "Draft saved."
            : "Submitted — an admin will review it shortly.",
        );
      }

      navigate("/dashboard/listings");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title = editing ? "Edit listing" : "New listing";
  const description = editing
    ? "Update the details below. Live listings stay live after saving."
    : "Fill in the details and submit it for review.";

  if (loading) {
    return (
      <DashboardLayout title={title} description={description}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout title={title} description={description}>
        <Card className="items-center gap-3 py-10 text-center">
          <CircleAlert className="size-6 text-destructive" />
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <a
            href="#/dashboard/listings"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Back to my listings
          </a>
        </Card>
      </DashboardLayout>
    );
  }

  const previewImages = parseLines(form.imagesText).slice(0, 6);

  const statusItems = editing
    ? {
        keep: `Keep current status${currentStatus ? ` (${currentStatus})` : ""}`,
        draft: "Draft — not submitted",
        pending: "Submit for review",
        rented: "Mark as rented",
      }
    : {
        draft: "Save as draft",
        pending: "Submit for review",
      };

  return (
    <DashboardLayout
      title={title}
      description={description}
      actions={
        editing && currentStatus ? (
          <StatusBadge status={currentStatus} />
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>
              The headline details students see first.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Field label="Title" htmlFor="title" error={errors.title}>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="Sunny room in a shared flat near campus"
                maxLength={120}
                aria-invalid={errors.title ? true : undefined}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              error={errors.description}
              hint="What makes the place worth a visit? At least 20 characters."
            >
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="Furnished room with a desk, fast internet, and a shared kitchen…"
                rows={5}
                maxLength={4000}
                aria-invalid={errors.description ? true : undefined}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="type" error={errors.type}>
                <Select
                  items={LISTING_TYPE_LABELS}
                  value={form.type}
                  onValueChange={(value) =>
                    set("type", (value ?? "apartment") as ListingType)
                  }
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {LISTING_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Price per month (€)"
                htmlFor="pricePerMonth"
                error={errors.pricePerMonth}
              >
                <Input
                  id="pricePerMonth"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={form.pricePerMonth}
                  onChange={(event) => set("pricePerMonth", event.target.value)}
                  placeholder="650"
                  aria-invalid={errors.pricePerMonth ? true : undefined}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Size, layout, and availability.</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Bedrooms"
                htmlFor="bedrooms"
                error={errors.bedrooms}
              >
                <Input
                  id="bedrooms"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  value={form.bedrooms}
                  onChange={(event) => set("bedrooms", event.target.value)}
                />
              </Field>

              <Field
                label="Bathrooms"
                htmlFor="bathrooms"
                error={errors.bathrooms}
              >
                <Input
                  id="bathrooms"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  value={form.bathrooms}
                  onChange={(event) => set("bathrooms", event.target.value)}
                />
              </Field>

              <Field
                label="Area (m²)"
                htmlFor="areaM2"
                error={errors.areaM2}
                hint="Optional"
              >
                <Input
                  id="areaM2"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={form.areaM2}
                  onChange={(event) => set("areaM2", event.target.value)}
                  placeholder="24"
                />
              </Field>

              <Field
                label="Floor"
                htmlFor="floor"
                error={errors.floor}
                hint="Optional"
              >
                <Input
                  id="floor"
                  type="number"
                  inputMode="numeric"
                  value={form.floor}
                  onChange={(event) => set("floor", event.target.value)}
                  placeholder="2"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Available from"
                htmlFor="availableFrom"
                error={errors.availableFrom}
                hint="Optional"
              >
                <Input
                  id="availableFrom"
                  type="date"
                  value={form.availableFrom}
                  onChange={(event) => set("availableFrom", event.target.value)}
                />
              </Field>

              <div className="flex flex-col justify-end gap-2">
                <Label htmlFor="furnished">Furnishing</Label>
                <label
                  htmlFor="furnished"
                  className="flex h-8 items-center gap-2 text-sm"
                >
                  <Checkbox
                    id="furnished"
                    checked={form.furnished}
                    onCheckedChange={(checked) =>
                      set("furnished", checked === true)
                    }
                  />
                  Offered furnished
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>
              Tap the common ones, or add your own.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {AMENITY_PRESETS.map((name) => {
                const selected = form.amenities.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleAmenity(name)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      selected
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Input
                value={customAmenity}
                onChange={(event) => setCustomAmenity(event.target.value)}
                onKeyDown={onCustomAmenityKeyDown}
                placeholder="Add another amenity"
                aria-label="Add another amenity"
                maxLength={40}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={addCustomAmenity}
              >
                <Plus />
                Add
              </Button>
            </div>

            {form.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.amenities.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleAmenity(name)}
                      aria-label={`Remove ${name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {errors.amenities && (
              <p className="text-xs text-destructive">{errors.amenities}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Only the city is shown on the public page.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Field label="Street" htmlFor="street" error={errors.street}>
              <Input
                id="street"
                value={form.street}
                onChange={(event) => set("street", event.target.value)}
                placeholder="12 Campusstraße"
                maxLength={160}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="City"
                htmlFor="city"
                error={errors.city ?? errors.address}
              >
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => set("city", event.target.value)}
                  placeholder="Berlin"
                  maxLength={80}
                  aria-invalid={errors.city ? true : undefined}
                />
              </Field>

              <Field
                label="Postal code"
                htmlFor="postalCode"
                error={errors.postalCode}
              >
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(event) => set("postalCode", event.target.value)}
                  placeholder="10115"
                  maxLength={20}
                />
              </Field>

              <Field label="Country" htmlFor="country" error={errors.country}>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(event) => set("country", event.target.value)}
                  placeholder="Germany"
                  maxLength={80}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Paste one image URL per line — up to 12.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Textarea
              id="images"
              value={form.imagesText}
              onChange={(event) => set("imagesText", event.target.value)}
              placeholder={
                "https://picsum.photos/seed/my-room-1/1200/800\nhttps://picsum.photos/seed/my-room-2/1200/800"
              }
              rows={4}
              aria-label="Image URLs"
              aria-invalid={errors.images ? true : undefined}
            />

            {errors.images && (
              <p className="text-xs text-destructive">{errors.images}</p>
            )}

            {previewImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {previewImages.map((url) => (
                  <div
                    key={url}
                    className="aspect-4/3 overflow-hidden rounded-lg bg-muted"
                  >
                    <ListingImage src={url} alt="" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="size-4" />
                Previews will appear here once you paste a URL.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-wrap items-end justify-between gap-4">
            <Field
              label="Visibility"
              htmlFor="status"
              className="min-w-56"
              hint={
                editing
                  ? "Leave as-is to keep it where it is."
                  : "Reviewed listings go live once approved."
              }
            >
              <Select
                items={statusItems}
                value={form.status}
                onValueChange={(value) =>
                  set("status", (value ?? "keep") as FormState["status"])
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center gap-2">
              <a
                href="#/dashboard/listings"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Cancel
              </a>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Save />
                )}
                {editing ? "Save changes" : "Create listing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </DashboardLayout>
  );
}
