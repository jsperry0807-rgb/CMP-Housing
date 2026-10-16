import {
  Check,
  ExternalLink,
  LoaderCircle,
  ShieldCheck,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi,
  formatDate,
  formatPrice,
  LISTING_STATUS_LABELS,
  type Listing,
  type ListingStatus,
} from "@/lib/listings";
import { useAsyncData } from "@/lib/use-async-data";
import { cn } from "@/lib/utils";

const TABS: ListingStatus[] = [
  "pending",
  "active",
  "rejected",
  "rented",
  "draft",
];

function ownerContact(listing: Listing): string | null {
  return typeof listing.owner === "object" && listing.owner !== null
    ? (listing.owner.email ?? listing.owner.name)
    : null;
}

export default function Moderation() {
  const [status, setStatus] = useState<ListingStatus>("pending");
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Listing | null>(null);
  const [reason, setReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [savingReject, setSavingReject] = useState(false);

  const { data, loading, error } = useAsyncData(
    () => adminApi.queue({ status, limit: 50 }),
    [status, version],
  );

  const reload = () => setVersion((current) => current + 1);
  const items = data?.items ?? [];

  async function approve(listing: Listing) {
    setBusyId(listing._id);
    try {
      await adminApi.approve(listing._id);
      toast.success(`“${listing.title}” is now live.`);
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not approve the listing",
      );
    } finally {
      setBusyId(null);
    }
  }

  function openReject(listing: Listing) {
    setRejecting(listing);
    setReason("");
    setRejectError(null);
  }

  async function confirmReject() {
    if (!rejecting) return;

    const value = reason.trim();
    if (value.length < 3) {
      setRejectError("Give a short reason (at least 3 characters).");
      return;
    }

    setSavingReject(true);
    try {
      await adminApi.reject(rejecting._id, value);
      toast.success(`“${rejecting.title}” was rejected.`);
      setRejecting(null);
      reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reject the listing",
      );
    } finally {
      setSavingReject(false);
    }
  }

  return (
    <DashboardLayout
      title="Moderation"
      description="Approve listings so they go live, or send them back with a reason."
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={status === tab}
              onClick={() => setStatus(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                status === tab
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {LISTING_STATUS_LABELS[tab]}
            </button>
          ))}
        </div>

        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} listing{(data?.total ?? 0) === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 text-sm text-muted-foreground">{error}</Card>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={`Nothing ${status === "pending" ? "to review" : "here"}`}
            description={
              status === "pending"
                ? "The queue is clear. New submissions will show up here."
                : `No listings have the “${LISTING_STATUS_LABELS[status]}” status.`
            }
          />
        ) : (
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {items.map((listing) => {
                const busy = busyId === listing._id;

                return (
                  <li
                    key={listing._id}
                    className="flex flex-wrap items-start gap-4 p-4"
                  >
                    <a
                      href={`#/listings/${listing.slug}`}
                      className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                      aria-label={`View ${listing.title}`}
                    >
                      <ListingImage
                        src={listing.images[0]}
                        alt={listing.title}
                      />
                    </a>

                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`#/listings/${listing.slug}`}
                          className="truncate font-medium hover:underline"
                        >
                          {listing.title}
                        </a>
                        <StatusBadge status={listing.status} />
                      </div>

                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatPrice(listing)} / month · {listing.address.city}{" "}
                        · submitted {formatDate(listing.createdAt)}
                      </p>

                      {ownerContact(listing) && (
                        <p className="text-xs text-muted-foreground">
                          {ownerContact(listing)}
                        </p>
                      )}

                      {listing.status === "rejected" &&
                        listing.rejectionReason && (
                          <p className="mt-1 text-xs text-destructive">
                            Reason: {listing.rejectionReason}
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
                        <ExternalLink />
                        Preview
                      </a>

                      {listing.status !== "active" && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => approve(listing)}
                        >
                          {busy ? (
                            <LoaderCircle className="animate-spin" />
                          ) : (
                            <Check />
                          )}
                          Approve
                        </Button>
                      )}

                      {listing.status !== "rejected" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => openReject(listing)}
                        >
                          <X />
                          Reject
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <Dialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open && !savingReject) setRejecting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this listing?</DialogTitle>
            <DialogDescription>
              {rejecting ? `“${rejecting.title}”` : "This listing"} will be
              hidden from the public and the owner will see your reason.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (rejectError) setRejectError(null);
              }}
              placeholder="e.g. The photos do not show the actual room."
              rows={3}
              maxLength={500}
              aria-label="Reason for rejection"
              aria-invalid={rejectError ? true : undefined}
              autoFocus
            />
            {rejectError && (
              <p className="text-xs text-destructive">{rejectError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={savingReject}
              onClick={() => setRejecting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={savingReject}
              onClick={confirmReject}
            >
              {savingReject ? <LoaderCircle className="animate-spin" /> : <X />}
              Reject listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
