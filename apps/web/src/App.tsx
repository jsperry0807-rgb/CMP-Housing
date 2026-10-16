import { useEffect } from "react";
import FullPageLoader from "@/components/full-page-loader";
import SiteLayout from "@/components/site-layout";
import { useAuth } from "@/lib/auth";
import { navigate, parseRoute, useRoute } from "@/lib/router";
import Browse from "@/pages/browse";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ListingDetail from "@/pages/listing-detail";
import Login from "@/pages/login";
import Signup from "@/pages/signup";

export default function App() {
  const route = useRoute();
  const { user, loading } = useAuth();

  // Keep the URL and the session in sync: the dashboard is private, and the
  // auth pages are pointless once you're signed in. Read the live hash rather
  // than the rendered route, so an explicit navigate() (e.g. after sign out)
  // is not undone by a stale render.
  useEffect(() => {
    if (loading) return;
    const current = parseRoute(window.location.hash);
    if (current.name === "dashboard" && !user) navigate("/login");
    if ((current.name === "login" || current.name === "signup") && user)
      navigate("/dashboard");
  }, [route.name, route.slug, user, loading]);

  if (loading) return <FullPageLoader />;

  switch (route.name) {
    case "login":
      return user ? <FullPageLoader /> : <Login />;
    case "signup":
      return user ? <FullPageLoader /> : <Signup />;
    case "dashboard":
      return user ? <Dashboard /> : <FullPageLoader />;
    case "browse":
      return (
        <SiteLayout>
          <Browse query={route.query} />
        </SiteLayout>
      );
    case "listing":
      return (
        <SiteLayout>
          {/* Keyed by slug so gallery state resets between listings. */}
          <ListingDetail key={route.slug} slug={route.slug!} />
        </SiteLayout>
      );
    default:
      return (
        <SiteLayout>
          <Home />
        </SiteLayout>
      );
  }
}
