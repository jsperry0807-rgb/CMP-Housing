import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Home,
  Landmark,
  MapPin,
  Pencil,
  Receipt,
  Ruler,
  School,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import EmptyState from "@/components/empty-state";
import ListingCard from "@/components/listing-card";
import ListingImage from "@/components/listing-image";
import StatusBadge from "@/components/status-badge";
import TeamAvatar from "@/components/team-avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  formatBaths,
  formatCost,
  formatNumber,
  listingsApi,
  ownerTeam,
  similarListings,
  type ListingEntry,
} from "@/lib/listings";
import { useAsyncData } from "@/lib/use-async-data";
import { cn } from "@/lib/utils";

function addressLine(address: {
  line1?: string;
  city: string;
  state?: string;
  postalCode?: string;
}): string {
  return [address.line1, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate">{value}</dd>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-lg font-medium">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EntryList({ entries }: { entries: ListingEntry[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <div
          key={`${entry.label}-${entry.value}`}
          className="flex flex-col border-b pb-2 last:border-0"
        >
          <dt className="text-xs text-muted-foreground">{entry.label}</dt>
          <dd className="text-sm">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MapEmbed({ title, src }: { title: string; src: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-2 aspect-16/10 overflow-hidden rounded-lg border bg-muted">
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    </div>
  );
}

export default function ListingDetail({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [active, setActive] = useState(0);

  const { data, loading, error } = useAsyncData(
    () => listingsApi.bySlug(slug),
    [slug],
  );

  const listing = data?.listing;
  const similar = listing ? similarListings(listing) : [];
  const needsFallback = Boolean(listing) && similar.length === 0;

  // Older designs have no hand-picked "similar" set, so fall back to the
  // newest approved designs.
  const fallback = useAsyncData(
    () =>
      needsFallback
        ? listingsApi.browse({ limit: 4, sort: "newest" })
        : Promise.resolve(null),
    [slug, needsFallback],
  );

  const team = listing ? ownerTeam(listing) : null;
  const listingTeamId =
    listing && typeof listing.team === "object"
      ? listing.team.id
      : typeof listing?.team === "string"
        ? listing.team
        : undefined;
  const canManage =
    user && listing
      ? user.role === "admin" ||
        (typeof listing.owner === "object" && listing.owner.id === user.id) ||
        (Boolean(listingTeamId) && user.team?.id === listingTeamId)
      : false;

  const moreItems =
    similar.length > 0
      ? similar
      : (fallback.data?.items ?? [])
          .filter((item) => item.slug !== slug)
          .slice(0, 3);

  const images = listing?.images ?? [];
  const activeImage = images[Math.min(active, Math.max(images.length - 1, 0))];

  // Mongoose drops an empty `maps` object, so treat a missing one as empty.
  const maps = listing?.maps ?? {};

  const pricePerSqft =
    listing && listing.sqft > 0
      ? Math.round(listing.totalCost / listing.sqft)
      : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <a
        href="#/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to designs
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
            icon={Home}
            title="Design unavailable"
            description={error}
            action={
              <a
                href="#/listings"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Browse other designs
              </a>
            }
          />
        </div>
      )}

      {listing && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {listing.year ? (
              <Badge variant="secondary">Built {listing.year}</Badge>
            ) : null}
            {team && <Badge variant="secondary">{team.name}</Badge>}
            {listing.status !== "active" && (
              <StatusBadge status={listing.status} />
            )}
          </div>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance">
            {listing.name}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {addressLine(listing.address)}
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
                    src={activeImage}
                    alt={listing.name}
                    className="h-full w-full"
                  />
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={`Show photo ${index + 1}`}
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

              <Section title="About this design">
                <p className="whitespace-pre-line text-muted-foreground">
                  {listing.description}
                </p>
              </Section>

              {listing.highlights.length > 0 && (
                <Section title="Highlights">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {listing.highlights.map((entry) => (
                      <div
                        key={`${entry.label}-${entry.value}`}
                        className="rounded-lg border bg-card p-3"
                      >
                        <p className="text-xs text-muted-foreground">
                          {entry.label}
                        </p>
                        <p className="text-sm font-medium">{entry.value}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {listing.interior.length > 0 && (
                <Section title="Interior details">
                  <EntryList entries={listing.interior} />
                </Section>
              )}

              {listing.roomTypes.length > 0 && (
                <Section title="Rooms">
                  <div className="flex flex-wrap gap-2">
                    {listing.roomTypes.map((room) => (
                      <span
                        key={room}
                        className="rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {room}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {(maps.location || maps.schools || maps.shops) && (
                <Section title="Neighbourhood">
                  <div className="flex flex-col gap-6">
                    {maps.location && (
                      <MapEmbed title="Where it sits" src={maps.location} />
                    )}
                    {maps.schools && (
                      <MapEmbed title="Nearby schools" src={maps.schools} />
                    )}
                    {maps.shops && (
                      <MapEmbed
                        title="Shops & places to eat"
                        src={maps.shops}
                      />
                    )}
                  </div>
                </Section>
              )}
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-fit">
              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total build cost
                    </p>
                    <p className="font-heading text-3xl font-semibold">
                      {formatCost(listing.totalCost)}
                    </p>
                    {pricePerSqft !== undefined && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        About {formatCost(pricePerSqft)} per sqft
                      </p>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
                    <Spec
                      icon={BedDouble}
                      label="Bedrooms"
                      value={String(listing.beds)}
                    />
                    <Spec
                      icon={Bath}
                      label="Bathrooms"
                      value={formatBaths(listing.baths)}
                    />
                    <Spec
                      icon={Ruler}
                      label="Size"
                      value={`${formatNumber(listing.sqft)} sqft`}
                    />
                    <Spec
                      icon={CalendarDays}
                      label="Year"
                      value={listing.year ? String(listing.year) : "—"}
                    />
                  </dl>

                  {(listing.propertyTax !== undefined ||
                    listing.assessment !== undefined) && (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
                      {listing.propertyTax !== undefined && (
                        <Spec
                          icon={Receipt}
                          label="Property tax / yr"
                          value={formatCost(listing.propertyTax)}
                        />
                      )}
                      {listing.assessment !== undefined && (
                        <Spec
                          icon={Landmark}
                          label="Assessment"
                          value={formatCost(listing.assessment)}
                        />
                      )}
                    </dl>
                  )}

                  {team && (
                    <div className="flex items-center gap-3 border-t pt-4">
                      <TeamAvatar name={team.name} logo={team.logo} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {team.name}
                        </p>
                        {team.member && (
                          <p className="truncate text-xs text-muted-foreground">
                            Designed by {team.member}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {canManage && (
                    <a
                      href={`#/dashboard/listings/${listing.slug}/edit`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "w-full",
                      )}
                    >
                      <Pencil />
                      Edit this design
                    </a>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="size-4 shrink-0" />
                    Includes the full build, not the land.
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <School className="size-4 shrink-0" />
                    School and shop maps are in the neighbourhood section.
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="size-4 shrink-0" />
                    Costs are shown in US dollars.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>

          {moreItems.length > 0 && (
            <div className="mt-14">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                {similar.length > 0 ? "Similar designs" : "More designs"}
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {moreItems.map((item) => (
                  <ListingCard key={item._id} listing={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
