import { LoaderCircle } from "lucide-react";

/** Shown while the session is being checked, or while a redirect is pending. */
export default function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderCircle
        role="status"
        aria-label="Loading"
        className="size-6 animate-spin text-muted-foreground"
      />
    </div>
  );
}
