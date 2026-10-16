import { Badge } from "@/components/ui/badge";
import { LISTING_STATUS_LABELS, type ListingStatus } from "@/lib/listings";
import { cn } from "@/lib/utils";

const STYLES: Record<ListingStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  rented: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

export default function StatusBadge({
  status,
  className,
}: {
  status: ListingStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", STYLES[status], className)}
    >
      {LISTING_STATUS_LABELS[status]}
    </Badge>
  );
}
