import { useState, type FormEvent } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import EmptyState from "@/components/empty-state";
import ImageUploader from "@/components/image-uploader";
import TeamAvatar from "@/components/team-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { teamsApi, type StudentSummary, type TeamDetail } from "@/lib/teams";
import { useAsyncData } from "@/lib/use-async-data";
import { initials } from "@/lib/utils";

const UNASSIGNED = "unassigned";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function Teams() {
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create / rename dialog. `editing` is null while creating a new team.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamDetail | null>(null);
  const [formName, setFormName] = useState("");
  const [formLogo, setFormLogo] = useState<string[]>([]);
  const [savingForm, setSavingForm] = useState(false);

  const [deleting, setDeleting] = useState<TeamDetail | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const { data, loading, error } = useAsyncData(
    () => teamsApi.overview(),
    [version],
  );

  const reload = () => setVersion((current) => current + 1);
  const teams = data?.teams ?? [];
  const students = data?.students ?? [];
  const unassigned = students.filter((student) => !student.team);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormLogo([]);
    setFormOpen(true);
  }

  function openEdit(team: TeamDetail) {
    setEditing(team);
    setFormName(team.name);
    setFormLogo(team.logo ? [team.logo] : []);
    setFormOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = formName.trim();
    if (name.length < 2) {
      toast.error("Give the team a name of at least 2 characters.");
      return;
    }

    setSavingForm(true);
    try {
      if (editing) {
        await teamsApi.update(editing.id, { name, logo: formLogo[0] ?? "" });
        toast.success("Team updated");
      } else {
        await teamsApi.create({
          name,
          ...(formLogo[0] ? { logo: formLogo[0] } : {}),
        });
        toast.success("Team created");
      }
      setFormOpen(false);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not save the team"));
    } finally {
      setSavingForm(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await teamsApi.remove(deleting.id);
      toast.success(`“${deleting.name}” was removed.`);
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not remove the team"));
    } finally {
      setDeletingBusy(false);
    }
  }

  async function assign(student: StudentSummary, teamId: string | null) {
    setBusyId(student.id);
    try {
      await teamsApi.assign(student.id, teamId);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not update the team"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout
      title="Manage teams"
      description="Create teams and assign students. Designs belong to the team, so every member can edit them."
      actions={
        <Button onClick={openCreate}>
          <Plus />
          New team
        </Button>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-sm text-muted-foreground">{error}</Card>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No teams yet"
          description="Create your first team, then assign students to it."
          action={
            <Button onClick={openCreate}>
              <Plus />
              New team
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                unassigned={unassigned}
                busyId={busyId}
                onEdit={() => openEdit(team)}
                onDelete={() => setDeleting(team)}
                onAssign={assign}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {unassigned.length === 0
                  ? "Every student is on a team."
                  : `${unassigned.length} student${
                      unassigned.length === 1 ? "" : "s"
                    } not on a team yet.`}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-2">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No student accounts yet.
                </p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                      {initials(student.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>

                    <Select
                      items={Object.fromEntries([
                        [UNASSIGNED, "No team"],
                        ...teams.map((team) => [team.id, team.name]),
                      ])}
                      value={student.team ?? UNASSIGNED}
                      disabled={busyId === student.id}
                      onValueChange={(value) =>
                        assign(
                          student,
                          !value || value === UNASSIGNED ? null : value,
                        )
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>No team</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / rename a team */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !savingForm) setFormOpen(false);
        }}
      >
        <DialogContent>
          <form onSubmit={submitForm} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit team" : "Create a team"}
              </DialogTitle>
              <DialogDescription>
                The team name and logo appear on every design the team submits.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Timberline Studio"
                maxLength={60}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label>Team logo (optional)</Label>
              <ImageUploader
                value={formLogo}
                onChange={setFormLogo}
                max={1}
                label="Upload logo"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={savingForm}
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={savingForm}>
                {savingForm ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Plus />
                )}
                {editing ? "Save team" : "Create team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove a team */}
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deletingBusy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this team?</DialogTitle>
            <DialogDescription>
              {deleting ? `“${deleting.name}”` : "This team"} will be deleted
              and its members will become unassigned. Teams that own designs
              cannot be removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              size="lg"
              disabled={deletingBusy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={deletingBusy}
              onClick={confirmDelete}
            >
              {deletingBusy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              Remove team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface TeamCardProps {
  team: TeamDetail;
  unassigned: StudentSummary[];
  busyId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: (student: StudentSummary, teamId: string | null) => void;
}

function TeamCard({
  team,
  unassigned,
  busyId,
  onEdit,
  onDelete,
  onAssign,
}: TeamCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <TeamAvatar name={team.name} logo={team.logo} size="lg" />

          <div className="min-w-0 flex-1">
            <CardTitle>{team.name}</CardTitle>
            <CardDescription>
              {team.members.length} member
              {team.members.length === 1 ? "" : "s"}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 />
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {team.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No members yet. Assign a student below.
          </p>
        ) : (
          team.members.map((member) => {
            const student: StudentSummary = {
              id: member.id,
              name: member.name,
              email: member.email,
              team: team.id,
            };

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                  {initials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${member.name} from ${team.name}`}
                  disabled={busyId === member.id}
                  onClick={() => onAssign(student, null)}
                >
                  {busyId === member.id ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <X />
                  )}
                </Button>
              </div>
            );
          })
        )}

        {unassigned.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            <Select
              value=""
              onValueChange={(value) => {
                const student = unassigned.find((item) => item.id === value);
                if (student) onAssign(student, team.id);
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Add a student…" />
              </SelectTrigger>
              <SelectContent>
                {unassigned.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
