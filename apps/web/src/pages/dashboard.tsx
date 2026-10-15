import { ArrowLeft, Folder, LayoutDashboard, Settings } from "lucide-react";
import Logo from "@/components/logo";
import SignOutButton from "@/components/sign-out-button";
import UserChip from "@/components/user-chip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: Folder, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Logo />
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ label, icon: Icon, active }) => (
            <span
              key={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </span>
          ))}
        </nav>

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
          <h1 className="font-heading text-base font-medium">Overview</h1>

          <div className="flex items-center gap-2">
            <UserChip user={user} className="hidden sm:flex" />
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard content goes here</CardTitle>
              <CardDescription>Signed in as {user.email}</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Add your widgets, tables, and charts to this area.
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
