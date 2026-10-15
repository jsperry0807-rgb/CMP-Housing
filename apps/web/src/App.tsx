import { useEffect } from "react";
import FullPageLoader from "@/components/full-page-loader";
import { useAuth } from "@/lib/auth";
import { navigate, parseRoute, useRoute } from "@/lib/router";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";

export default function App() {
  const route = useRoute();
  const { user, loading } = useAuth();

  // Keep the URL and the session in sync: the dashboard is private, and the
  // auth pages are pointless once you're signed in. Read the live hash rather
  // than the rendered `route`, so an explicit navigate() (e.g. after sign out)
  // is not undone by a stale render.
  useEffect(() => {
    if (loading) return;
    const current = parseRoute(window.location.hash);
    if (current === "dashboard" && !user) navigate("/login");
    if ((current === "login" || current === "signup") && user)
      navigate("/dashboard");
  }, [route, user, loading]);

  if (loading) return <FullPageLoader />;

  switch (route) {
    case "login":
      return user ? <FullPageLoader /> : <Login />;
    case "signup":
      return user ? <FullPageLoader /> : <Signup />;
    case "dashboard":
      return user ? <Dashboard /> : <FullPageLoader />;
    default:
      return <Landing />;
  }
}
