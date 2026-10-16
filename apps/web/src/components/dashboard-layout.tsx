import {
  ArrowLeft,
  Home,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import Logo from "@/components/logo";
import SignOutButton from "@/components/sign-out-button";
import UserChip from "@/components/user-chip";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useRoute, type RouteName } from "@/lib/router";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  matches: RouteName[];
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    matches: ["dashboard"],
  },
  {
    label: "Team designs",
    href: "/dashboard/listings",
    icon: Home,
    matches: ["my-listings", "listing-form"],
  },
  {
    label: "Team profile",
    href: "/dashboard/team",
    icon: UsersRound,
    matches: ["team-profile"],
  },
  {
    label: "Manage teams",
    href: "/dashboard/teams",
    icon: UserCog,
    matches: ["teams"],
    adminOnly: true,
  },
  {
    label: "Moderation",
    href: "/dashboard/moderation",
    icon: ShieldCheck,
    matches: ["moderation"],
    adminOnly: true,
  },
];

interface DashboardLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({
  title,
  description,
  actions,
  children,
}: DashboardLayoutProps) {
  const route = useRoute();
  const { user } = useAuth();

  if (!user) return null;

  const items = NAV.filter((item) => !item.adminOnly || user.role === "admin");
  const isActive = (item: NavItem) => item.matches.includes(route.name);

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <a href="#/" aria-label="ECTS Housing home">
            <Logo />
          </a>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map((item) => (
            <a
              key={item.href}
              href={`#${item.href}`}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item)
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-3">
          <a
            href="#/dashboard/listings/new"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            <PlusCircle />
            New design
          </a>
        </div>

        <Separator />

        <div className="p-3">
          <a
            href="#/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Back to site
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6">
          <a href="#/" aria-label="ECTS Housing home" className="lg:hidden">
            <Logo />
          </a>

          <div className="ml-auto flex items-center gap-2">
            <UserChip user={user} className="hidden sm:flex" />
            <SignOutButton />
          </div>
        </header>

        {/* The sidebar is hidden on small screens, so show the same nav here. */}
        <nav className="flex gap-1 overflow-x-auto border-b p-2 lg:hidden">
          {items.map((item) => (
            <a
              key={item.href}
              href={`#${item.href}`}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive(item)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>

        <main className="flex-1 p-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>

              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
            </div>

            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
