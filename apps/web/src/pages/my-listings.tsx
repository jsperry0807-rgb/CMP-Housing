import {
  Eye,
  Home,
  LoaderCircle,
  Pencil,
  PlusCircle,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import EmptyState from "@/components/empty-state";
import ListingImage from "@/components/listing-image";
import StatusBadge from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import {
  formatCost,
  formatDate,
  listingsApi,
  type Listing,
  type ListingStatus,
} from "@/lib/listings";
import { useAsyncData } from "@/lib/use-async-data";
import { cn } from "@/lib/utils";

/** The statuses an owner is allowed to set on their own design. */
type OwnerStatus = "draft" | "pending";

/** Owner-driven status changes, and the button each one shows. */
const TRANSITIONS: Partial<
  Record<ListingStatus, { to: OwnerStatus; label: string; icon: typeof Send }>
> = {
  draft: { to: "pending", label: "Submit for review", icon: Send },
  rejected: { to: "pending", label: "Resubmit", icon: Send },
};

export default function MyListings() {
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, loading, error } = useAsyncData(
    () => listingsApi.mine(),
    [version],
  );

  const reload = () => setVersion((current) => current + 1);

  async function changeStatus(listing: Listing, to: OwnerStatus) {
    setBusyId(listing._id);
    try {
      await listingsApi.update(listing._id, { status: to });
      toast.success(
        to === "pending" ? "Submitted for review." : "Design updated.",
      );
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the design",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await listingsApi.remove(toDelete._id);
      toast.success("Design deleted.");
      setToDelete(null);
      reload();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not delete the design",
      );
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.items ?? [];

  return (
    <DashboardLayout
      title="Team designs"
      description="Everything your team has submitted, in any state."
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
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-sm text-muted-foreground">{error}</Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No designs yet"
          description="Add your first house design and it will show up here while it waits for your teacher to review it."
          action={
            <a
              href="#/dashboard/listings/new"
              className={buttonVariants({ size: "lg" })}
            >
              <PlusCircle />
              Create a design
            </a>
          }
        />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {items.map((listing) => {
              const transition = TRANSITIONS[listing.status];
              const busy = busyId === listing._id;
              const city = [listing.address?.city, listing.address?.state]
                .filter(Boolean)
                .join(", ");

              return (
                <li
                  key={listing._id}
                  className="flex flex-wrap items-center gap-4 p-4"
                >
                  <a
                    href={`#/listings/${listing.slug}`}
                    className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                    aria-label={`View ${listing.name}`}
                  >
                    <ListingImage
                      src={listing.images?.[0]}
                      alt={listing.name}
                    />
                  </a>

                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`#/listings/${listing.slug}`}
                        className="truncate font-medium hover:underline"
                      >
                        {listing.name}
                      </a>
                      <StatusBadge status={listing.status} />
                    </div>

                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatCost(listing.totalCost)} · {city || "—"} · updated{" "}
                      {formatDate(listing.updatedAt)}
                    </p>

                    {listing.status === "rejected" &&
                      listing.rejectionReason && (
                        <p className="mt-1 text-xs text-destructive">
                          Rejected: {listing.rejectionReason}
                        </p>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`#/listings/${listing.slug}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      <Eye />
                      View
                    </a>

                    <a
                      href={`#/dashboard/listings/${listing.slug}/edit`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      <Pencil />
                      Edit
                    </a>

                    {transition && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => changeStatus(listing, transition.to)}
                      >
                        {busy ? (
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <transition.icon />
                        )}
                        {transition.label}
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => setToDelete(listing)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this design?</DialogTitle>
            <DialogDescription>
              {toDelete ? `“${toDelete.name}”` : "This design"} will be
              permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={deleting}
              onClick={() => setToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={deleting}
              onClick={confirmDelete}
              className={cn(deleting && "opacity-100")}
            >
              {deleting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              Delete design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
