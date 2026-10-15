import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ApiUser } from "@/lib/api";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

interface UserChipProps {
  user: ApiUser;
  className?: string;
  showEmail?: boolean;
}

export default function UserChip({
  user,
  className,
  showEmail = false,
}: UserChipProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Avatar>
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 font-semibold text-white">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>
        {showEmail && (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
    </div>
  );
}
