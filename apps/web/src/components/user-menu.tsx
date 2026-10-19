import {
  CirclePlus,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import TeamAvatar from "@/components/team-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAdmin, isStaff, ROLE_LABELS, type ApiUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";

export default function UserMenu({ user }: { user: ApiUser }) {
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);

  const team = user.team?.name?.trim() || user.name;

  async function handleSignOut() {
    setPending(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <TeamAvatar name={team} logo={user.team?.logo} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-medium">{team}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {user.name} · {user.email}
            </p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigate("/dashboard")}>
            <LayoutDashboard />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/dashboard/listings/new")}>
            <CirclePlus />
            New design
          </DropdownMenuItem>
          {user.role === "student" && (
            <DropdownMenuItem onClick={() => navigate("/dashboard/team")}>
              <UsersRound />
              Team profile
            </DropdownMenuItem>
          )}
          {isStaff(user) && (
            <>
              <DropdownMenuItem onClick={() => navigate("/dashboard/teams")}>
                <UserCog />
                Manage teams
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/moderation")}
              >
                <ShieldCheck />
                Moderation
              </DropdownMenuItem>
            </>
          )}
          {isAdmin(user) && (
            <DropdownMenuItem onClick={() => navigate("/dashboard/users")}>
              <Users />
              Users
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={pending}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
