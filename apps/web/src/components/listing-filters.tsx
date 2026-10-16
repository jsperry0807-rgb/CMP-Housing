import { Search, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
import { SORT_LABELS } from "@/lib/listings";
import { buildPath, navigate } from "@/lib/router";

const TYPE_ITEMS: Record<string, string> = {
  any: "Any type",
  room: "Room",
  studio: "Studio",
  apartment: "Apartment",
  house: "House",
};

const PRICE_ITEMS: Record<string, string> = {
  any: "Any price",
  "300": "Up to €300",
  "500": "Up to €500",
  "750": "Up to €750",
  "1000": "Up to €1,000",
  "1500": "Up to €1,500",
};

const BEDROOM_ITEMS: Record<string, string> = {
  any: "Any size",
  "1": "1+ bedrooms",
  "2": "2+ bedrooms",
  "3": "3+ bedrooms",
};

const SORT_ITEMS: Record<string, string> = {
  newest: SORT_LABELS.newest,
  "price-asc": SORT_LABELS["price-asc"],
  "price-desc": SORT_LABELS["price-desc"],
};

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function ListingFilters({ query }: { query: URLSearchParams }) {
  const [text, setText] = useState(() => query.get("q") ?? "");

  // Keep the box in sync when the URL changes from elsewhere (back button,
  // a hero search, or "clear filters").
  useEffect(() => {
    setText(query.get("q") ?? "");
  }, [query]);

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(query);
    // "any" is the sentinel for "no filter"; empty values are dropped.
    const normalized = !value || value === "any" ? "" : value;

    if (normalized) next.set(key, normalized);
    else next.delete(key);
    if (key !== "page") next.delete("page");

    navigate(buildPath("/listings", Object.fromEntries(next)));
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    set("q", text.trim());
  }

  function reset() {
    navigate("/listings");
  }

  const hasFilters = ["q", "type", "maxPrice", "bedrooms", "furnished"].some(
    (key) => query.has(key),
  );

  const furnish = query.get("furnished") === "true";

  return (
    <div className="rounded-xl border bg-card p-4">
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search by city or keyword…"
            aria-label="Search listings"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <FilterField label="Type">
          <Select
            items={TYPE_ITEMS}
            value={query.get("type") ?? "any"}
            onValueChange={(value) => set("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Max price">
          <Select
            items={PRICE_ITEMS}
            value={query.get("maxPrice") ?? "any"}
            onValueChange={(value) => set("maxPrice", value)}
          >
            <SelectTrigger className="w-full">
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
        </FilterField>

        <FilterField label="Bedrooms">
          <Select
            items={BEDROOM_ITEMS}
            value={query.get("bedrooms") ?? "any"}
            onValueChange={(value) => set("bedrooms", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BEDROOM_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Sort by">
          <Select
            items={SORT_ITEMS}
            value={query.get("sort") ?? "newest"}
            onValueChange={(value) =>
              set("sort", value === "newest" ? "" : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Furnishing">
          <label className="flex h-8 items-center gap-2 text-sm">
            <Checkbox
              checked={furnish}
              onCheckedChange={(checked) =>
                set("furnished", checked ? "true" : "")
              }
            />
            Furnished only
          </label>
        </FilterField>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <X />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
