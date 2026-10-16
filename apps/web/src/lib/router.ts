import { useEffect, useState } from "react";

export type RouteName =
  "home" | "login" | "signup" | "dashboard" | "browse" | "listing";

export interface RouteState {
  name: RouteName;
  /** Set when name is "listing". */
  slug?: string;
  /** Everything after the "?" in the hash, e.g. "?city=Berlin". */
  query: URLSearchParams;
}

export function parseRoute(hash: string): RouteState {
  const raw = (hash || "").replace(/^#/, "");
  const [path = "", search = ""] = raw.split("?");
  const segments = path.split("/").filter(Boolean);
  const query = new URLSearchParams(search);
  const [first, second] = segments;

  switch (first) {
    case "login":
      return { name: "login", query };
    case "signup":
      return { name: "signup", query };
    case "dashboard":
      return { name: "dashboard", query };
    case "listings":
      return second
        ? { name: "listing", slug: decodeURIComponent(second), query }
        : { name: "browse", query };
    default:
      return { name: "home", query };
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
