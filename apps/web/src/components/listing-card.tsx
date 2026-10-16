import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import ListingImage from "@/components/listing-image";
import TeamAvatar from "@/components/team-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatBaths,
  formatCost,
  formatNumber,
  ownerTeam,
  type CardListing,
} from "@/lib/listings";

export default function ListingCard({ listing }: { listing: CardListing }) {
  const team = ownerTeam(listing);
  const city =
    [listing.address?.city, listing.address?.state]
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <a
      href={`#/listings/${listing.slug}`}
      className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors group-hover:ring-foreground/25">
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <ListingImage
            src={listing.images?.[0]}
            alt={listing.name}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute top-2.5 left-2.5 bg-background/85 text-foreground backdrop-blur">
            {formatCost(listing.totalCost)}
          </Badge>
        </div>

        <CardContent className="flex flex-col gap-1">
          <h3 className="line-clamp-2 font-heading text-base font-semibold">
            {listing.name}
          </h3>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {city}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {listing.beds ? (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5" />
                {listing.beds} bed
              </span>
            ) : null}
            {listing.baths ? (
              <span className="flex items-center gap-1">
                <Bath className="size-3.5" />
                {formatBaths(listing.baths)} bath
              </span>
            ) : null}
            {listing.sqft ? (
              <span className="flex items-center gap-1">
                <Ruler className="size-3.5" />
                {formatNumber(listing.sqft)} sqft
              </span>
            ) : null}
          </div>

          {team && (
            <div className="mt-2 flex items-center gap-2 border-t pt-2">
              <TeamAvatar name={team.name} logo={team.logo} size="sm" />
              <span className="truncate text-xs text-muted-foreground">
                {team.name}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
