import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import EmptyState from "@/components/empty-state";
import ListingCard from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listingsApi,
  type BrowseParams,
  type SortOption,
} from "@/lib/listings";
import { buildPath, navigate } from "@/lib/router";
import { useAsyncData } from "@/lib/use-async-data";

const SORTS: SortOption[] = ["newest", "cost-asc", "cost-desc", "sqft-desc"];

function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBrowseParams(query: URLSearchParams): BrowseParams {
  const sort = query.get("sort");

  return {
    q: query.get("q") ?? undefined,
    maxCost: toNumber(query.get("maxCost")),
    minCost: toNumber(query.get("minCost")),
    beds: toNumber(query.get("beds")),
    sort: SORTS.includes(sort as SortOption) ? (sort as SortOption) : undefined,
    page: toNumber(query.get("page")) ?? 1,
    limit: 12,
  };
}

export default function Browse({ query }: { query: URLSearchParams }) {
  const params = parseBrowseParams(query);
  const key = query.toString();

  const { data, loading, error } = useAsyncData(
    () => listingsApi.browse(params),
    [key],
  );

  function goToPage(page: number) {
    const next = new URLSearchParams(query);
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    navigate(buildPath("/listings", Object.fromEntries(next)));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Browse student designs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every house designed by an ECTS team.
        </p>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <Skeleton className="aspect-4/3 w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <EmptyState
            icon={SearchX}
            title="Could not load designs"
            description={error}
          />
        )}

        {data && data.items.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No designs match your search"
            description="Try a different keyword or budget."
            action={
              <Button variant="outline" onClick={() => navigate("/listings")}>
                Clear search
              </Button>
            }
          />
        )}

        {data && data.items.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground" role="status">
              {data.total} {data.total === 1 ? "design" : "designs"} found
            </p>

            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {data.pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={data.page <= 1}
                  onClick={() => goToPage(data.page - 1)}
                >
                  <ChevronLeft />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.pages}
                </span>

                <Button
                  variant="outline"
                  disabled={data.page >= data.pages}
                  onClick={() => goToPage(data.page + 1)}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
