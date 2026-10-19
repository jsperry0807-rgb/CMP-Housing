import Logo from "@/components/logo";
import UserMenu from "@/components/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function SiteHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 items-center gap-4">
          <a href="#/" aria-label="ECTS Housing home" className="shrink-0">
            <Logo />
          </a>

          <nav className="flex items-center">
            <a
              href="#/listings"
              className={cn(buttonVariants({ variant: "ghost" }), "text-sm")}
            >
              Browse
            </a>
            <a
              href="#/calculator"
              className={cn(buttonVariants({ variant: "ghost" }), "text-sm")}
            >
              Calculator
            </a>
            <a
              href="#/presentation"
              className={cn(buttonVariants({ variant: "ghost" }), "text-sm")}
            >
              Presentation
            </a>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <a
                href="#/login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "hidden sm:inline-flex",
                )}
              >
                Sign in
              </a>
              <a href="#/signup" className={cn(buttonVariants())}>
                Get started
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
