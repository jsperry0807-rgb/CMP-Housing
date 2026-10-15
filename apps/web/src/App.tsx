import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";

/**
 * Minimal hash-based routing: `#/` is the landing page, `#/dashboard` is the
 * dashboard. Swap this out for a router when you need real routes.
 */
function useHashPage(): "landing" | "dashboard" {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "/",
  );

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route === "/dashboard" ? "dashboard" : "landing";
}

export default function App() {
  const page = useHashPage();

  return page === "dashboard" ? <Dashboard /> : <Landing />;
}
