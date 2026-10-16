import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Save, UserCog, UsersRound } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import EmptyState from "@/components/empty-state";
import TeamAvatar from "@/components/team-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { teamsApi, type TeamDetail } from "@/lib/teams";
import { initials } from "@/lib/utils";

export default function TeamProfile() {
  const { user, setUser } = useAuth();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    teamsApi
      .mine()
      .then((result) => {
        if (!cancelled) setTeam(result.team);
      })
      .catch(() => {
        if (!cancelled) setTeam(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingTeam(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length === 0) {
      setError("Your name is required");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { user: updated } = await authApi.updateMe({ name: name.trim() });
      setUser(updated);
      toast.success("Profile saved");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not save your profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      title="Team profile"
      description="Your team is credited on every design it submits."
    >
      <div className="flex flex-col gap-6">
        {loadingTeam ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ) : team ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TeamAvatar name={team.name} logo={team.logo} size="lg" />
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    {team.members.length} member
                    {team.members.length === 1 ? "" : "s"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  {member.id === user.id && (
                    <Badge variant="secondary">You</Badge>
                  )}
                </div>
              ))}

              <p className="mt-2 text-xs text-muted-foreground">
                Your teacher manages team membership. Ask them to add or remove
                a teammate.
              </p>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={user.role === "admin" ? UserCog : UsersRound}
            title={
              user.role === "admin"
                ? "Teachers are not on a team"
                : "No team yet"
            }
            description={
              user.role === "admin"
                ? "Create teams and assign your students to them from Manage teams."
                : "Your teacher will add you to a team. Once you are on one, you can submit designs for it."
            }
            action={
              user.role === "admin" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.hash = "/dashboard/teams";
                  }}
                >
                  <UserCog />
                  Manage teams
                </Button>
              ) : undefined
            }
          />
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                The details used to sign in and how you are credited as a team
                member.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-5">
              <div className="grid max-w-md gap-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Carter"
                />
              </div>

              <div className="grid max-w-md gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  {user.role === "admin"
                    ? "Signed in as a teacher."
                    : "Signed in as a student."}
                </p>
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div>
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
