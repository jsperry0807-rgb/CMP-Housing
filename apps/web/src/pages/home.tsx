import {
  ArrowRight,
  Home as HomeIcon,
  PencilRuler,
  Search,
  ShieldCheck,
} from "lucide-react";
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

const BUDGET_ITEMS: Record<string, string> = {
  any: "Any budget",
  "500000": "Up to $500,000",
  "600000": "Up to $600,000",
  "700000": "Up to $700,000",
  "800000": "Up to $800,000",
};

export default function Home() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [maxCost, setMaxCost] = useState("any");

  const { data, loading, error } = useAsyncData(
    () => listingsApi.featured(),
    [],
  );

  function search(event: FormEvent) {
    event.preventDefault();
    navigate(
      buildPath("/listings", {
        q: keyword.trim(),
        maxCost: maxCost === "any" ? "" : maxCost,
      }),
    );
  }

  return (
    <>
      <section className="border-b bg-linear-to-b from-muted/40 to-background">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Houses designed by ECTS students
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Every year the class is given a house to design from the ground
              up. Browse their finished designs — floor plans, costs and photo
              galleries included.
            </p>
          </div>

          <form
            onSubmit={search}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            aria-label="Search designs"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search by team, house name or city"
                aria-label="Search designs"
                className="h-11! pl-9"
              />
            </div>

            <Select
              items={BUDGET_ITEMS}
              value={maxCost}
              onValueChange={(value) => setMaxCost(String(value))}
            >
              <SelectTrigger className="h-11! w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BUDGET_ITEMS).map(([value, label]) => (
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
              Reviewed by the teacher
            </span>
            <span className="flex items-center gap-2">
              <PencilRuler className="size-4" />
              Designed by student teams
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Featured designs
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The most recent houses added to ECTS Housing.
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
              icon={HomeIcon}
              title="Could not load designs"
              description={error}
            />
          )}

          {data && data.items.length === 0 && (
            <EmptyState
              icon={HomeIcon}
              title="No designs yet"
              description="Once a design is approved by the teacher it will show up here."
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
              Designed a house this year?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign up with your team, add your photos and details, then submit
              it. Your teacher reviews it before it goes live on ECTS Housing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!user && (
                <a
                  href="#/signup"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Create your team account
                  <ArrowRight />
                </a>
              )}
              <a
                href={user ? "#/dashboard" : "#/login"}
                className={cn(
                  buttonVariants({
                    variant: user ? "default" : "outline",
                    size: "lg",
                  }),
                )}
              >
                {user ? "Go to dashboard" : "Sign in"}
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
                  Sign up and name your team (add a logo if you have one).
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">
                    2
                  </span>
                  Add your design: cost, size, photos, maps and details.
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-foreground">
                    3
                  </span>
                  Your teacher approves it and it appears here for everyone.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
