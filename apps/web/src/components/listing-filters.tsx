import { Search, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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

const COST_ITEMS: Record<string, string> = {
  any: "Any budget",
  "500000": "Up to $500,000",
  "600000": "Up to $600,000",
  "700000": "Up to $700,000",
  "800000": "Up to $800,000",
};

const BEDROOM_ITEMS: Record<string, string> = {
  any: "Any size",
  "2": "2+ bedrooms",
  "3": "3+ bedrooms",
  "4": "4+ bedrooms",
  "5": "5+ bedrooms",
};

const SORT_ITEMS: Record<string, string> = {
  newest: SORT_LABELS.newest,
  "cost-asc": SORT_LABELS["cost-asc"],
  "cost-desc": SORT_LABELS["cost-desc"],
  "sqft-desc": SORT_LABELS["sqft-desc"],
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

  const hasFilters = ["q", "maxCost", "beds"].some((key) => query.has(key));

  return (
    <div className="rounded-xl border bg-card p-4">
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search by team, house name, city or keyword…"
            aria-label="Search designs"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <FilterField label="Max cost">
          <Select
            items={COST_ITEMS}
            value={query.get("maxCost") ?? "any"}
            onValueChange={(value) => set("maxCost", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COST_ITEMS).map(([value, label]) => (
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
            value={query.get("beds") ?? "any"}
            onValueChange={(value) => set("beds", value)}
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

        <div className="flex items-end">
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/listings")}
            >
              <X />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
