import TeamAvatar from "@/components/team-avatar";
import type { ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UserChipProps {
  user: ApiUser;
  className?: string;
  showEmail?: boolean;
}

/** The signed-in account, presented under its team name when it has one. */
export default function UserChip({
  user,
  className,
  showEmail = false,
}: UserChipProps) {
  const label = user.team?.name?.trim() || user.name;

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <TeamAvatar name={label} logo={user.team?.logo} />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        {showEmail && (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
    </div>
  );
}
