import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MonitorPlay,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listingsApi, type Listing } from "@/lib/listings";
import { useAsyncData } from "@/lib/use-async-data";

export default function Presentation() {
  const { data, loading, error } = useAsyncData(
    () => listingsApi.browse({ limit: 50 }),
    [],
  );

  const listings = data?.items ?? [];

  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [presenting, setPresenting] = useState(false);
  const [houseIndex, setHouseIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  const selectedListings = useMemo(
    () =>
      selectedOrder
        .map((id) => listings.find((listing) => listing._id === id))
        .filter((listing): listing is Listing => Boolean(listing)),
    [selectedOrder, listings],
  );

  function toggle(id: string) {
    setSelectedOrder((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function selectAll() {
    setSelectedOrder(listings.map((listing) => listing._id));
  }

  function clearSelection() {
    setSelectedOrder([]);
  }

  function moveSelected(index: number, direction: -1 | 1) {
    setSelectedOrder((previous) => {
      const target = index + direction;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  const start = useCallback(() => {
    if (selectedListings.length === 0) return;
    setHouseIndex(0);
    setImageIndex(0);
    setPresenting(true);
  }, [selectedListings.length]);

  const stop = useCallback(() => setPresenting(false), []);

  const nextImage = useCallback(() => {
    const listing = selectedListings[houseIndex];
    if (!listing || listing.images.length === 0) return;
    setImageIndex((current) => (current + 1) % listing.images.length);
  }, [selectedListings, houseIndex]);

  const previousImage = useCallback(() => {
    const listing = selectedListings[houseIndex];
    if (!listing || listing.images.length === 0) return;
    setImageIndex(
      (current) =>
        (current - 1 + listing.images.length) % listing.images.length,
    );
  }, [selectedListings, houseIndex]);

  const nextHouse = useCallback(() => {
    setHouseIndex((current) =>
      selectedListings.length === 0
        ? 0
        : (current + 1) % selectedListings.length,
    );
    setImageIndex(0);
  }, [selectedListings.length]);

  const previousHouse = useCallback(() => {
    setHouseIndex((current) =>
      selectedListings.length === 0
        ? 0
        : (current - 1 + selectedListings.length) % selectedListings.length,
    );
    setImageIndex(0);
  }, [selectedListings.length]);

  useEffect(() => {
    if (!presenting) return;

    function handleKey(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          previousImage();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextImage();
          break;
        case "ArrowUp":
          event.preventDefault();
          previousHouse();
          break;
        case "ArrowDown":
          event.preventDefault();
          nextHouse();
          break;
        case "Escape":
          event.preventDefault();
          stop();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [presenting, previousImage, nextImage, previousHouse, nextHouse, stop]);

  const currentListing = selectedListings[houseIndex];
  const currentImage =
    currentListing && currentListing.images.length > 0
      ? currentListing.images[
          Math.min(imageIndex, currentListing.images.length - 1)
        ]
      : null;

  if (presenting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
        <header className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm text-white/70">
              House {houseIndex + 1} of {selectedListings.length}
            </p>
            <h1 className="text-xl font-semibold">
              {currentListing?.name ?? "No design selected"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={stop}
            aria-label="Exit presentation"
          >
            <X className="size-5" />
          </Button>
        </header>

        <div className="relative flex flex-1 items-center justify-center px-6">
          {currentImage ? (
            <img
              src={currentImage}
              alt={currentListing?.name ?? ""}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <p className="text-white/70">This design has no photos.</p>
          )}

          {currentListing && currentListing.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousImage}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 backdrop-blur hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-4 p-4 text-sm text-white/70">
          <span>
            {currentListing
              ? `Photo ${Math.min(imageIndex, currentListing.images.length - 1) + 1} of ${currentListing.images.length || 0}`
              : ""}
          </span>
          <span>←/→ photos · ↑/↓ houses · Esc exit</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Presentation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the designs you want to present, then step through them.
        </p>
      </div>
      {loading && (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && listings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No designs available to present.
        </p>
      )}

      {!loading && listings.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={selectedListings.length === 0}
              onClick={start}
            >
              <MonitorPlay />
              Start presentation ({selectedListings.length})
            </Button>
          </div>

          {selectedListings.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-medium">
                Presentation order (top to bottom)
              </h2>
              <ul className="flex flex-col gap-2">
                {selectedListings.map((listing, index) => (
                  <li
                    key={listing._id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {listing.images[0] && (
                      <img
                        src={listing.images[0]}
                        alt=""
                        className="size-12 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{listing.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {listing.address?.city} · {listing.images.length} photos
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => moveSelected(index, -1)}
                        disabled={index === 0}
                        aria-label="Move earlier in presentation"
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => moveSelected(index, 1)}
                        disabled={index === selectedListings.length - 1}
                        aria-label="Move later in presentation"
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggle(listing._id)}
                        aria-label="Remove from presentation"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-sm font-medium">Available designs</h2>
            <ul className="flex flex-col gap-2">
              {listings
                .filter((listing) => !selectedOrder.includes(listing._id))
                .map((listing: Listing) => (
                  <li key={listing._id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggle(listing._id)}
                        className="size-4"
                      />
                      {listing.images[0] && (
                        <img
                          src={listing.images[0]}
                          alt=""
                          className="size-12 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{listing.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {listing.address?.city} · {listing.images.length}{" "}
                          photos
                        </p>
                      </div>
                    </label>
                  </li>
                ))}
              {listings.every((listing) =>
                selectedOrder.includes(listing._id),
              ) && (
                <p className="text-sm text-muted-foreground">
                  All designs are already in the presentation.
                </p>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
