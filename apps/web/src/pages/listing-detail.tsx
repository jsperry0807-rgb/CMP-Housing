import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  Layers,
  MapPin,
  Ruler,
  Sofa,
  User,
} from "lucide-react";
import { useState } from "react";
import EmptyState from "@/components/empty-state";
import ListingImage from "@/components/listing-image";
import StatusBadge from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  formatDate,
  formatPrice,
  LISTING_TYPE_LABELS,
  listingsApi,
  ownerName,
} from "@/lib/listings";
import { useAsyncData } from "@/lib/use-async-data";
import { cn } from "@/lib/utils";

export default function ListingDetail({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [active, setActive] = useState(0);

  const { data, loading, error } = useAsyncData(
    () => listingsApi.bySlug(slug),
    [slug],
  );

  const listing = data?.listing;

  const canManage =
    user && listing
      ? user.role === "admin" ||
        (typeof listing.owner === "object" && listing.owner.id === user.id)
      : false;

  const specs = listing
    ? [
        { icon: BedDouble, label: "Bedrooms", value: String(listing.bedrooms) },
        {
          icon: Bath,
          label: "Bathrooms",
          value: String(listing.bathrooms),
        },
        {
          icon: Ruler,
          label: "Area",
          value: listing.areaM2 ? `${listing.areaM2} m²` : "—",
        },
        {
          icon: Layers,
          label: "Floor",
          value: listing.floor === undefined ? "—" : String(listing.floor),
        },
        {
          icon: Sofa,
          label: "Furnished",
          value: listing.furnished ? "Yes" : "No",
        },
        {
          icon: Building2,
          label: "Type",
          value: LISTING_TYPE_LABELS[listing.type],
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <a
        href="#/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to listings
      </a>

      {loading && (
        <div className="mt-6 flex flex-col gap-6">
          <Skeleton className="aspect-16/9 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      )}

      {error && !loading && (
        <div className="mt-6">
          <EmptyState
            icon={Building2}
            title="Listing unavailable"
            description={error}
            action={
              <a
                href="#/listings"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Browse other listings
              </a>
            }
          />
        </div>
      )}

      {listing && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {LISTING_TYPE_LABELS[listing.type]}
            </Badge>
            {listing.furnished && <Badge variant="secondary">Furnished</Badge>}
            {listing.status !== "active" && (
              <StatusBadge status={listing.status} />
            )}
          </div>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance">
            {listing.title}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {[
              listing.address.street,
              listing.address.postalCode,
              listing.address.city,
              listing.address.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>

          {canManage && listing.status === "rejected" && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Rejected: {listing.rejectionReason ?? "no reason given"}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="aspect-16/10 overflow-hidden rounded-xl bg-muted">
                  <ListingImage
                    src={listing.images[active]}
                    alt={listing.title}
                    className="h-full w-full"
                  />
                </div>

                {listing.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                    {listing.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={`Show image ${index + 1}`}
                        aria-current={index === active}
                        className={cn(
                          "aspect-4/3 overflow-hidden rounded-lg bg-muted outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                          index === active
                            ? "ring-2 ring-ring"
                            : "opacity-70 hover:opacity-100",
                        )}
                      >
                        <ListingImage
                          src={image}
                          alt=""
                          className="h-full w-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <section>
                <h2 className="font-heading text-lg font-medium">
                  About this place
                </h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {listing.description}
                </p>
              </section>

              {listing.amenities.length > 0 && (
                <section>
                  <h2 className="font-heading text-lg font-medium">
                    Amenities
                  </h2>
                  <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                    {listing.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center gap-2">
                        <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h2 className="font-heading text-lg font-medium">Location</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {[
                    listing.address.street,
                    listing.address.postalCode,
                    listing.address.city,
                    listing.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <p className="font-heading text-2xl font-semibold">
                      {formatPrice(listing)}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / month
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Excludes utilities
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
                    {specs.map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <dt className="text-xs text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="truncate">{value}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>

                  <div className="flex flex-col gap-3 border-t pt-4 text-sm">
                    {ownerName(listing) && (
                      <div className="flex items-center gap-2">
                        <User className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">Listed by</span>
                        <span className="truncate font-medium">
                          {ownerName(listing)}
                        </span>
                      </div>
                    )}

                    {listing.availableFrom && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Available from
                        </span>
                        <span>{formatDate(listing.availableFrom)}</span>
                      </div>
                    )}
                  </div>

                  {canManage && (
                    <p className="border-t pt-4 text-xs text-muted-foreground">
                      You can edit this listing from your dashboard.
                    </p>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
