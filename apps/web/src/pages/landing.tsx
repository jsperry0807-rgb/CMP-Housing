import { ArrowRight } from "lucide-react";
import Logo from "@/components/logo";
import SignOutButton from "@/components/sign-out-button";
import UserChip from "@/components/user-chip";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
          <a href="#/" aria-label="ECTS Housing home">
            <Logo />
          </a>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <UserChip user={user} className="hidden sm:flex" />
                <SignOutButton />
              </>
            ) : (
              <>
                <a
                  href="#/login"
                  className={cn(buttonVariants({ variant: "ghost" }))}
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-20">
        <div className="max-w-xl">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance">
            Welcome to ECTS Housing
          </h1>
          <p className="mt-3 text-muted-foreground">
            This is the starting point. Replace it with your own content.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <a
                href="#/dashboard"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Open dashboard
                <ArrowRight />
              </a>
            ) : (
              <>
                <a
                  href="#/signup"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Create an account
                  <ArrowRight />
                </a>
                <a
                  href="#/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                  )}
                >
                  Sign in
                </a>
              </>
            )}
          </div>

          {user && (
            <p className="mt-4 text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{user.email}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
