import { useEffect } from "react";
import FullPageLoader from "@/components/full-page-loader";
import SiteLayout from "@/components/site-layout";
import { useAuth } from "@/lib/auth";
import { isDashboardRoute, navigate, parseRoute, useRoute } from "@/lib/router";
import Browse from "@/pages/browse";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ListingDetail from "@/pages/listing-detail";
import ListingForm from "@/pages/listing-form";
import Login from "@/pages/login";
import Moderation from "@/pages/moderation";
import MortgageCalculator from "@/pages/mortgage-calculator";
import MyListings from "@/pages/my-listings";
import Signup from "@/pages/signup";
import TeamProfile from "@/pages/team-profile";
import Teams from "@/pages/teams";

export default function App() {
  const route = useRoute();
  const { user, loading } = useAuth();

  // Keep the URL and the session in sync: the dashboard is private, the
  // moderation queue is admin-only, and the auth pages are pointless once
  // you're signed in. Read the live hash rather than the rendered route, so an
  // explicit navigate() (e.g. after sign out) is not undone by a stale render.
  useEffect(() => {
    if (loading) return;
    const current = parseRoute(window.location.hash);

    if (isDashboardRoute(current.name) && !user) {
      navigate("/login");
      return;
    }
    if (
      (current.name === "moderation" || current.name === "teams") &&
      user?.role !== "admin"
    ) {
      navigate("/dashboard");
      return;
    }
    if ((current.name === "login" || current.name === "signup") && user) {
      navigate("/dashboard");
    }
  }, [route.name, route.slug, user, loading]);

  if (loading) return <FullPageLoader />;

  switch (route.name) {
    case "login":
      return user ? <FullPageLoader /> : <Login />;
    case "signup":
      return user ? <FullPageLoader /> : <Signup />;
    case "dashboard":
      return user ? <Dashboard /> : <FullPageLoader />;
    case "my-listings":
      return user ? <MyListings /> : <FullPageLoader />;
    case "team-profile":
      return user ? <TeamProfile /> : <FullPageLoader />;
    case "teams":
      return user?.role === "admin" ? <Teams /> : <FullPageLoader />;
    case "listing-form":
      return user ? (
        <ListingForm key={route.slug ?? "new"} slug={route.slug} />
      ) : (
        <FullPageLoader />
      );
    case "moderation":
      return user?.role === "admin" ? <Moderation /> : <FullPageLoader />;
    case "home":
      return (
        <SiteLayout>
          <Home />
        </SiteLayout>
      );
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
    case "calculator":
      return (
        <SiteLayout>
          <MortgageCalculator query={route.query} />
        </SiteLayout>
      );
    default:
      // Browse is the main page, so it also backs the root and unknown paths.
      return (
        <SiteLayout>
          <Browse query={route.query} />
        </SiteLayout>
      );
  }
}
