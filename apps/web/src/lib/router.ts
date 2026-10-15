import { useEffect, useState } from "react";

export type Route = "landing" | "login" | "signup" | "dashboard";

export function parseRoute(hash: string): Route {
  switch (hash.replace(/^#/, "")) {
    case "/login":
      return "login";
    case "/signup":
      return "signup";
    case "/dashboard":
      return "dashboard";
    default:
      return "landing";
  }
}

export function navigate(to: "/" | "/login" | "/signup" | "/dashboard"): void {
  if (window.location.hash.replace(/^#/, "") === to) return;
  window.location.hash = to;
}

/** Subscribes to the URL hash so components can render per route. */
export function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return parseRoute(hash);
}
