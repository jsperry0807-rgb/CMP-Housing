import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  PlusCircle,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import StatusBadge from "@/components/status-badge";
import TeamAvatar from "@/components/team-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isStaff } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatCost,
  listingsApi,
  moderationApi,
  type BrowseResult,
} from "@/lib/listings";
import { useAsyncData } from "@/lib/use-async-data";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  loading: boolean;
}) {
  const content = (
    <Card
      className={cn(
        "h-full transition-colors",
        href && "hover:ring-foreground/25",
      )}
    >
      <CardContent className="flex items-center gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-10" />
          ) : (
            <p className="font-heading text-2xl font-semibold tabular-nums">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <a href={`#${href}`}>{content}</a> : content;
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const staff = isStaff(user);

  const mine = useAsyncData(() => listingsApi.mine(), []);
  const pendingQueue = useAsyncData<BrowseResult | null>(
    () =>
      staff
        ? moderationApi.queue({ status: "pending", limit: 1 })
        : Promise.resolve(null),
    [staff],
  );

  if (!user) return null;

  const team = user.team?.name?.trim() || user.name;
  const counts = mine.data?.counts;
  const recent = mine.data?.items.slice(0, 3) ?? [];

  return (
    <DashboardLayout
      title={`Welcome back, ${team}`}
      description="Manage your team's designs and keep an eye on what needs review."
      actions={
        <a
          href="#/dashboard/listings/new"
          className={buttonVariants({ size: "lg" })}
        >
          <PlusCircle />
          New design
        </a>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total designs"
          value={counts?.total ?? 0}
          icon={Home}
          href="/dashboard/listings"
          loading={mine.loading}
        />
        <StatCard
          label="Live"
          value={counts?.active ?? 0}
          icon={CheckCircle2}
          href="/dashboard/listings"
          loading={mine.loading}
        />
        <StatCard
          label="Awaiting review"
          value={counts?.pending ?? 0}
          icon={Clock}
          href="/dashboard/listings"
          loading={mine.loading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Recent designs"
            action={
              <a
                href="#/dashboard/listings"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                View all
                <ArrowRight />
              </a>
            }
          >
            {mine.loading ? (
              <div className="flex flex-col gap-3">
                {[0, 1].map((index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven't submitted a design yet.
                </p>
                <a
                  href="#/dashboard/listings/new"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-3",
                  )}
                >
                  <PlusCircle />
                  Create your first design
                </a>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {recent.map((listing) => (
                  <li key={listing._id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <a
                        href={`#/dashboard/listings/${listing.slug}/edit`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {listing.name}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {formatCost(listing.totalCost)} ·{" "}
                        {listing.address?.city ?? "—"}
                      </p>
                    </div>
                    <StatusBadge status={listing.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Your team">
            <div className="flex items-center gap-3">
              <TeamAvatar name={team} logo={user.team?.logo} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.team?.name ?? "No team yet"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.name} · {user.email}
                </p>
              </div>
            </div>

            <a
              href={staff ? "#/dashboard/teams" : "#/dashboard/team"}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-3",
              )}
            >
              <UsersRound />
              {staff ? "Manage teams" : "View team"}
            </a>
          </SectionCard>

          {staff && (
            <SectionCard title="Moderation">
              {pendingQueue.loading ? (
                <Skeleton className="h-6 w-44" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-heading text-2xl font-semibold text-foreground tabular-nums">
                    {pendingQueue.data?.total ?? 0}
                  </span>{" "}
                  design
                  {(pendingQueue.data?.total ?? 0) === 1 ? "" : "s"} awaiting
                  review.
                </p>
              )}

              <a
                href="#/dashboard/moderation"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-3",
                )}
              >
                <ShieldCheck />
                Open queue
              </a>
            </SectionCard>
          )}

          <SectionCard title="Quick actions">
            <div className="flex flex-col gap-2">
              <a
                href="#/listings"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "justify-start",
                )}
              >
                <Home />
                Browse all designs
              </a>
              <a
                href="#/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "justify-start",
                )}
              >
                <ArrowRight />
                Back to homepage
              </a>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
