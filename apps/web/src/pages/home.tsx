import { ArrowRight, Building2, Search, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import EmptyState from "@/components/empty-state";
import ListingCard from "@/components/listing-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { listingsApi } from "@/lib/listings";
import { buildPath, navigate } from "@/lib/router";
import { useAsyncData } from "@/lib/use-async-data";
import { cn } from "@/lib/utils";

const PRICE_ITEMS: Record<string, string> = {
  any: "Any price",
  "300": "Up to €300",
  "500": "Up to €500",
  "750": "Up to €750",
  "1000": "Up to €1,000",
  "1500": "Up to €1,500",
};

export default function Home() {
  const { user } = useAuth();
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("any");

  const { data, loading, error } = useAsyncData(
    () => listingsApi.featured(),
    [],
  );

  function search(event: FormEvent) {
    event.preventDefault();
    navigate(
      buildPath("/listings", {
        q: city.trim(),
        maxPrice: maxPrice === "any" ? "" : maxPrice,
      }),
    );
  }

  return (
    <>
      <section className="border-b bg-linear-to-b from-muted/40 to-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Student housing, without the guesswork
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse rooms, studios and shared flats near your campus. Every
              listing is reviewed before it goes live.
            </p>
          </div>

          <form
            onSubmit={search}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            aria-label="Search listings"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City, e.g. Berlin"
                aria-label="City"
                className="h-11! pl-9"
              />
            </div>

            <Select
              items={PRICE_ITEMS}
              value={maxPrice}
              onValueChange={(value) => setMaxPrice(String(value))}
            >
              <SelectTrigger className="h-11! w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRICE_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" size="lg" className="h-11! px-6">
              Search
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Reviewed listings
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="size-4" />
              Rooms, studios &amp; flats
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Featured listings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The newest places added to ECTS Housing.
            </p>
          </div>

          <a
            href="#/listings"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Browse all
            <ArrowRight />
          </a>
        </div>

        <div className="mt-6">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="flex flex-col gap-3">
                  <Skeleton className="aspect-4/3 w-full rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <EmptyState
              icon={Building2}
              title="Could not load listings"
              description={error}
            />
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No listings yet"
              description="Once listings are approved they will show up here."
            />
          )}

          {data && data.items.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Have a place to rent out?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Create a listing in a couple of minutes. Our team reviews it, then
              it goes live to students browsing ECTS Housing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={user ? "#/dashboard" : "#/signup"}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {user ? "Go to dashboard" : "List your place"}
                <ArrowRight />
              </a>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">
                    1
                  </span>
                  Create an account and describe your place.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">
                    2
                  </span>
                  We review the listing before it is published.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">
                    3
                  </span>
                  It appears in browse results with photos and full details.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
