import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import ListingImage from "@/components/listing-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, LISTING_TYPE_LABELS, type Listing } from "@/lib/listings";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <a
      href={`#/listings/${listing.slug}`}
      className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors group-hover:ring-foreground/25">
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <ListingImage
            src={listing.images[0]}
            alt={listing.title}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute top-2.5 left-2.5 bg-background/85 text-foreground backdrop-blur">
            {LISTING_TYPE_LABELS[listing.type]}
          </Badge>
        </div>

        <CardContent className="flex flex-col gap-1">
          <p className="font-heading text-base font-semibold">
            {formatPrice(listing)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / month
            </span>
          </p>

          <h3 className="line-clamp-2 text-sm font-medium">{listing.title}</h3>

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {listing.address.city}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {listing.bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {listing.bathrooms} bath
            </span>
            {listing.areaM2 ? (
              <span className="flex items-center gap-1">
                <Ruler className="size-3.5" />
                {listing.areaM2} m²
              </span>
            ) : null}
            {listing.furnished && <span>Furnished</span>}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
