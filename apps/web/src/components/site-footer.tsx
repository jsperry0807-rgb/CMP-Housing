import Logo from "@/components/logo";

export default function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo />

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <a
            className="transition-colors hover:text-foreground"
            href="#/listings"
          >
            Browse listings
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="#/signup"
          >
            List a place
          </a>
          <a className="transition-colors hover:text-foreground" href="#/login">
            Sign in
          </a>
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ECTS Housing — a demo project.
        </p>
      </div>
    </footer>
  );
}
