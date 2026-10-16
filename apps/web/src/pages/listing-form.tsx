import {
  CircleAlert,
  LoaderCircle,
  Plus,
  Save,
  UsersRound,
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
import EmptyState from "@/components/empty-state";
import ImageUploader from "@/components/image-uploader";
import StatusBadge from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAuth } from "@/lib/auth";
import {
  listingsApi,
  type Listing,
  type ListingAddress,
  type ListingEntry,
  type ListingInput,
  type ListingMaps,
  type ListingStatus,
} from "@/lib/listings";
import { navigate } from "@/lib/router";
import { cn } from "@/lib/utils";

/** A repeatable "label: value" row. */
interface EntryRow {
  label: string;
  value: string;
}

/** Numeric inputs are kept as strings so a half-typed value never becomes NaN. */
interface FormState {
  name: string;
  description: string;
  totalCost: string;
  beds: string;
  baths: string;
  sqft: string;
  year: string;
  propertyTax: string;
  assessment: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  mapLocation: string;
  mapSchools: string;
  mapShops: string;
  highlights: EntryRow[];
  interior: EntryRow[];
  roomTypes: string[];
  images: string[];
  /** Only meaningfully used while editing. */
  status: Visibility;
}

/** The owner-settable statuses, plus "keep" which only appears when editing. */
type Visibility = "keep" | "draft" | "pending";

const MAX_IMAGES = 15;

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  totalCost: "",
  beds: "3",
  baths: "2",
  sqft: "",
  year: "",
  propertyTax: "",
  assessment: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  mapLocation: "",
  mapSchools: "",
  mapShops: "",
  highlights: [],
  interior: [],
  roomTypes: [],
  images: [],
  status: "pending",
};

function fromListing(listing: Listing): FormState {
  return {
    name: listing.name,
    description: listing.description,
    totalCost: String(listing.totalCost),
    beds: String(listing.beds),
    baths: String(listing.baths),
    sqft: String(listing.sqft),
    year: listing.year === undefined ? "" : String(listing.year),
    propertyTax:
      listing.propertyTax === undefined ? "" : String(listing.propertyTax),
    assessment:
      listing.assessment === undefined ? "" : String(listing.assessment),
    line1: listing.address?.line1 ?? "",
    city: listing.address?.city ?? "",
    state: listing.address?.state ?? "",
    postalCode: listing.address?.postalCode ?? "",
    mapLocation: listing.maps?.location ?? "",
    mapSchools: listing.maps?.schools ?? "",
    mapShops: listing.maps?.shops ?? "",
    highlights: listing.highlights?.map((entry) => ({ ...entry })) ?? [],
    interior: listing.interior?.map((entry) => ({ ...entry })) ?? [],
    roomTypes: [...(listing.roomTypes ?? [])],
    images: [...(listing.images ?? [])],
    status: "keep",
  };
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Every row must be complete, or removed entirely. */
function incompleteRows(rows: EntryRow[]): boolean {
  return rows.some(
    (row) => Boolean(row.label.trim()) !== Boolean(row.value.trim()),
  );
}

function cleanEntries(rows: EntryRow[]): ListingEntry[] {
  return rows
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) => ({ label: row.label.trim(), value: row.value.trim() }));
}

/** Client-side pre-flight; the API re-validates everything anyway. */
function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (form.name.trim().length < 3) {
    errors.name = "Use at least 3 characters.";
  }

  if (form.description.trim().length < 20) {
    errors.description = "Write at least 20 characters.";
  }

  const cost = toNumber(form.totalCost);
  if (cost === undefined || cost <= 0) {
    errors.totalCost = "Enter a total cost greater than 0.";
  }

  if (!form.city.trim()) errors.city = "City is required.";

  if (form.images.length === 0) {
    errors.images = "Add at least one photo.";
  } else if (form.images.length > MAX_IMAGES) {
    errors.images = `Use at most ${MAX_IMAGES} photos.`;
  }

  if (incompleteRows(form.highlights)) {
    errors.highlights = "Complete or remove the highlighted rows.";
  }
  if (incompleteRows(form.interior)) {
    errors.interior = "Complete or remove the highlighted rows.";
  }

  return errors;
}

function buildPayload(form: FormState): ListingInput {
  const address: ListingAddress = { city: form.city.trim() };
  if (form.line1.trim()) address.line1 = form.line1.trim();
  if (form.state.trim()) address.state = form.state.trim();
  if (form.postalCode.trim()) address.postalCode = form.postalCode.trim();

  const maps: ListingMaps = {};
  if (form.mapLocation.trim()) maps.location = form.mapLocation.trim();
  if (form.mapSchools.trim()) maps.schools = form.mapSchools.trim();
  if (form.mapShops.trim()) maps.shops = form.mapShops.trim();

  const payload: ListingInput = {
    name: form.name.trim(),
    description: form.description.trim(),
    totalCost: toNumber(form.totalCost) ?? 0,
    beds: toNumber(form.beds) ?? 0,
    baths: toNumber(form.baths) ?? 0,
    sqft: toNumber(form.sqft) ?? 0,
    address,
    maps,
    highlights: cleanEntries(form.highlights),
    interior: cleanEntries(form.interior),
    roomTypes: form.roomTypes.map((room) => room.trim()).filter(Boolean),
    images: form.images,
  };

  const year = toNumber(form.year);
  if (year !== undefined) payload.year = year;

  const propertyTax = toNumber(form.propertyTax);
  if (propertyTax !== undefined) payload.propertyTax = propertyTax;

  const assessment = toNumber(form.assessment);
  if (assessment !== undefined) payload.assessment = assessment;

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

/** Two-column label/value rows with add and remove. */
function EntryRows({
  id,
  rows,
  onChange,
  labelPlaceholder,
  valuePlaceholder,
  error,
}: {
  id: string;
  rows: EntryRow[];
  onChange: (rows: EntryRow[]) => void;
  labelPlaceholder: string;
  valuePlaceholder: string;
  error?: string;
}) {
  function update(index: number, patch: Partial<EntryRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            id={`${id}-label-${index}`}
            value={row.label}
            onChange={(event) => update(index, { label: event.target.value })}
            placeholder={labelPlaceholder}
            aria-label={`Row ${index + 1} label`}
            className="sm:max-w-52"
          />
          <Input
            id={`${id}-value-${index}`}
            value={row.value}
            onChange={(event) => update(index, { value: event.target.value })}
            placeholder={valuePlaceholder}
            aria-label={`Row ${index + 1} value`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove row ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <X />
          </Button>
        </div>
      ))}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Add ${id} row`}
          onClick={() => onChange([...rows, { label: "", value: "" }])}
        >
          <Plus />
          Add row
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ListingForm({ slug }: { slug?: string }) {
  const editing = Boolean(slug);
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [listingId, setListingId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<ListingStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [customRoom, setCustomRoom] = useState("");

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
              : "Could not load this design",
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

  function addRoom() {
    const value = customRoom.trim();
    if (!value) return;

    setForm((current) =>
      current.roomTypes.some(
        (room) => room.toLowerCase() === value.toLowerCase(),
      )
        ? current
        : { ...current, roomTypes: [...current.roomTypes, value] },
    );
    setCustomRoom("");
  }

  function onRoomKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addRoom();
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
        toast.success("Design updated.");
      } else {
        await listingsApi.create(payload);
        toast.success(
          payload.status === "draft"
            ? "Draft saved."
            : "Submitted — your teacher will review it shortly.",
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

  const title = editing ? "Edit design" : "New design";
  const description = editing
    ? "Update the details below. Live designs stay live after saving."
    : "Fill in the details of your house and submit it for your teacher to review.";

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
            Back to team designs
          </a>
        </Card>
      </DashboardLayout>
    );
  }

  // A design belongs to a team, so a student needs one before submitting.
  if (!editing && user && user.role !== "admin" && !user.team) {
    return (
      <DashboardLayout
        title="New design"
        description="You need a team before you can submit a design."
      >
        <EmptyState
          icon={UsersRound}
          title="No team yet"
          description="Your teacher will add you to a team. Once you are on one, you can submit designs for it."
          action={
            <a
              href="#/dashboard/team"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View team profile
            </a>
          }
        />
      </DashboardLayout>
    );
  }

  const statusItems: Record<string, string> = editing
    ? {
        keep: `Keep current status${currentStatus ? ` (${currentStatus})` : ""}`,
        draft: "Draft — not submitted",
        pending: "Submit for review",
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
              Name your design and give it a short write-up.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Field label="Design name" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Barn Brothers"
                maxLength={120}
                aria-invalid={errors.name ? true : undefined}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              error={errors.description}
              hint="Describe the house, its layout and what makes it special. At least 20 characters."
            >
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                placeholder="A renovated barn with a wrap-around porch and an open kitchen…"
                rows={5}
                maxLength={6000}
                aria-invalid={errors.description ? true : undefined}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost &amp; size</CardTitle>
            <CardDescription>The numbers buyers compare first.</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Total cost ($)"
                htmlFor="totalCost"
                error={errors.totalCost}
              >
                <Input
                  id="totalCost"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={form.totalCost}
                  onChange={(event) => set("totalCost", event.target.value)}
                  placeholder="500000"
                  aria-invalid={errors.totalCost ? true : undefined}
                />
              </Field>

              <Field label="Bedrooms" htmlFor="beds" error={errors.beds}>
                <Input
                  id="beds"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  value={form.beds}
                  onChange={(event) => set("beds", event.target.value)}
                />
              </Field>

              <Field
                label="Bathrooms"
                htmlFor="baths"
                error={errors.baths}
                hint="Decimals are fine, e.g. 3.5"
              >
                <Input
                  id="baths"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={50}
                  step={0.25}
                  value={form.baths}
                  onChange={(event) => set("baths", event.target.value)}
                />
              </Field>

              <Field label="Size (sqft)" htmlFor="sqft" error={errors.sqft}>
                <Input
                  id="sqft"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.sqft}
                  onChange={(event) => set("sqft", event.target.value)}
                  placeholder="3334"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Year built"
                htmlFor="year"
                error={errors.year}
                hint="Optional"
              >
                <Input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  min={1800}
                  max={2100}
                  value={form.year}
                  onChange={(event) => set("year", event.target.value)}
                  placeholder="2022"
                />
              </Field>

              <Field
                label="Property tax / yr ($)"
                htmlFor="propertyTax"
                error={errors.propertyTax}
                hint="Optional"
              >
                <Input
                  id="propertyTax"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.propertyTax}
                  onChange={(event) => set("propertyTax", event.target.value)}
                />
              </Field>

              <Field
                label="Assessment ($)"
                htmlFor="assessment"
                error={errors.assessment}
                hint="Optional"
              >
                <Input
                  id="assessment"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.assessment}
                  onChange={(event) => set("assessment", event.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Where the house is built.</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Field
              label="Street address"
              htmlFor="line1"
              error={errors.line1}
              hint="Optional"
            >
              <Input
                id="line1"
                value={form.line1}
                onChange={(event) => set("line1", event.target.value)}
                placeholder="101 SW Western Blvd"
                maxLength={160}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" htmlFor="city" error={errors.city}>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => set("city", event.target.value)}
                  placeholder="Corvallis"
                  maxLength={80}
                  aria-invalid={errors.city ? true : undefined}
                />
              </Field>

              <Field label="State" htmlFor="state" error={errors.state}>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(event) => set("state", event.target.value)}
                  placeholder="OR"
                  maxLength={40}
                />
              </Field>

              <Field
                label="ZIP code"
                htmlFor="postalCode"
                error={errors.postalCode}
              >
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(event) => set("postalCode", event.target.value)}
                  placeholder="97333"
                  maxLength={20}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highlights</CardTitle>
            <CardDescription>
              Short facts shown as cards, e.g. Parking → Garage, or HOA → None.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <EntryRows
              id="highlights"
              rows={form.highlights}
              onChange={(rows) => set("highlights", rows)}
              labelPlaceholder="Parking"
              valuePlaceholder="Garage"
              error={errors.highlights}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interior</CardTitle>
            <CardDescription>
              Interior details, e.g. Basement → Full, or Dimensions &amp; Layout
              → 3,334 sqft.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <EntryRows
              id="interior"
              rows={form.interior}
              onChange={(rows) => set("interior", rows)}
              labelPlaceholder="Basement"
              valuePlaceholder="Full, Exterior Entry"
              error={errors.interior}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
            <CardDescription>
              List the rooms in the house, e.g. Theater Room or Man Cave.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {form.roomTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.roomTypes.map((room) => (
                  <span
                    key={room}
                    className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm"
                  >
                    {room}
                    <button
                      type="button"
                      aria-label={`Remove ${room}`}
                      onClick={() =>
                        set(
                          "roomTypes",
                          form.roomTypes.filter((item) => item !== room),
                        )
                      }
                      className="grid size-5 place-items-center rounded-full transition-colors hover:bg-background"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={customRoom}
                onChange={(event) => setCustomRoom(event.target.value)}
                onKeyDown={onRoomKeyDown}
                placeholder="Add a room and press Enter"
                aria-label="Add a room"
                className="sm:max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                aria-label="Add room"
                onClick={addRoom}
              >
                <Plus />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Up to {MAX_IMAGES} photos. The first three become the showcase
              images.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ImageUploader
              value={form.images}
              onChange={(urls) => set("images", urls)}
              max={MAX_IMAGES}
            />
            {errors.images && (
              <p className="mt-2 text-xs text-destructive">{errors.images}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maps</CardTitle>
            <CardDescription>
              Optional Google Maps embed URLs. In Google Maps choose Share →
              Embed a map and paste the src URL from the iframe.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Field
              label="Where it sits"
              htmlFor="mapLocation"
              error={errors.mapLocation}
            >
              <Textarea
                id="mapLocation"
                value={form.mapLocation}
                onChange={(event) => set("mapLocation", event.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=…"
                rows={2}
                maxLength={1000}
              />
            </Field>

            <Field
              label="Nearby schools"
              htmlFor="mapSchools"
              error={errors.mapSchools}
            >
              <Textarea
                id="mapSchools"
                value={form.mapSchools}
                onChange={(event) => set("mapSchools", event.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=…"
                rows={2}
                maxLength={1000}
              />
            </Field>

            <Field
              label="Shops & places to eat"
              htmlFor="mapShops"
              error={errors.mapShops}
            >
              <Textarea
                id="mapShops"
                value={form.mapShops}
                onChange={(event) => set("mapShops", event.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=…"
                rows={2}
                maxLength={1000}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>
              Save it as a draft or submit it to your teacher for approval.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Field
              label="Status"
              htmlFor="status"
              className="max-w-xs"
              hint={
                editing && currentStatus === "active"
                  ? "This design is live. Submitting again sends it back for review."
                  : undefined
              }
            >
              <Select
                items={statusItems}
                value={form.status}
                onValueChange={(value) =>
                  set("status", (value ?? "pending") as Visibility)
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
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <Save />}
            {submitting
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Submit design"}
          </Button>

          <a
            href="#/dashboard/listings"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Cancel
          </a>
        </div>
      </form>
    </DashboardLayout>
  );
}
