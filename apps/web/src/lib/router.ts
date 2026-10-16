import { useEffect, useState } from "react";

export type RouteName =
  | "home"
  | "login"
  | "signup"
  | "dashboard"
  | "team-profile"
  | "teams"
  | "my-listings"
  | "listing-form"
  | "moderation"
  | "browse"
  | "listing";

export interface RouteState {
  name: RouteName;
  /** The listing slug, for "listing" and editing via "listing-form". */
  slug?: string;
  /** Everything after the "?" in the hash, e.g. "?city=Berlin". */
  query: URLSearchParams;
}

/** Routes that live behind the signed-in dashboard. */
export function isDashboardRoute(name: RouteName): boolean {
  return (
    name === "dashboard" ||
    name === "team-profile" ||
    name === "teams" ||
    name === "my-listings" ||
    name === "listing-form" ||
    name === "moderation"
  );
}

export function parseRoute(hash: string): RouteState {
  const raw = (hash || "").replace(/^#/, "");
  const [path = "", search = ""] = raw.split("?");
  const segments = path.split("/").filter(Boolean);
  const query = new URLSearchParams(search);
  const [first, second, third, fourth] = segments;

  switch (first) {
    case "home":
      return { name: "home", query };
    case "login":
      return { name: "login", query };
    case "signup":
      return { name: "signup", query };
    case "listings":
      return second
        ? { name: "listing", slug: decodeURIComponent(second), query }
        : { name: "browse", query };
    case "dashboard":
      if (second === "moderation") return { name: "moderation", query };
      if (second === "teams") return { name: "teams", query };
      if (second === "team") return { name: "team-profile", query };
      if (second === "listings") {
        if (!third) return { name: "my-listings", query };
        if (third === "new") return { name: "listing-form", query };
        if (fourth === "edit") {
          return {
            name: "listing-form",
            slug: decodeURIComponent(third),
            query,
          };
        }
      }
      return { name: "dashboard", query };
    default:
      // The root (`#/`) and any unknown path land on browse.
      return { name: "browse", query };
  }
}

/** Builds a "#/path?a=b" target, dropping empty values. */
export function buildPath(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function navigate(to: string): void {
  const target = to.replace(/^#/, "");
  if (window.location.hash.replace(/^#/, "") === target) return;
  window.location.hash = target;
}

/** Subscribes to the URL hash so components can render per route. */
export function useRoute(): RouteState {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return parseRoute(hash);
}
