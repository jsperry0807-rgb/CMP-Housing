import { useState } from "react";
import { LoaderCircle, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import EmptyState from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, type ApiRole } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usersApi, type ManagedUser } from "@/lib/users";
import { useAsyncData } from "@/lib/use-async-data";
import { initials } from "@/lib/utils";

const ROLE_ITEMS: Record<string, string> = {
  student: ROLE_LABELS.student,
  teacher: ROLE_LABELS.teacher,
  admin: ROLE_LABELS.admin,
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function Users() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const { data, loading, error } = useAsyncData(
    () => usersApi.list(),
    [version],
  );

  const reload = () => setVersion((current) => current + 1);
  const accounts = data?.users ?? [];
  const counts = {
    student: accounts.filter((account) => account.role === "student").length,
    teacher: accounts.filter((account) => account.role === "teacher").length,
    admin: accounts.filter((account) => account.role === "admin").length,
  };

  async function changeRole(target: ManagedUser, role: ApiRole) {
    if (role === target.role) return;

    setBusyId(target.id);
    try {
      await usersApi.setRole(target.id, role);
      toast.success(
        `${target.name} is now a ${ROLE_LABELS[role].toLowerCase()}.`,
      );
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not change the role"));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;

    setDeletingBusy(true);
    try {
      await usersApi.remove(deleting.id);
      toast.success(`${deleting.name} was removed.`);
      setDeleting(null);
      reload();
    } catch (caught) {
      toast.error(errorMessage(caught, "Could not remove the account"));
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <DashboardLayout
      title="Users"
      description="Every account on the site. Promote a student to a teacher, or a teacher to an admin."
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-sm text-muted-foreground">{error}</Card>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No accounts yet"
          description="Accounts appear here as students sign up for the site."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              {counts.student} student{counts.student === 1 ? "" : "s"} ·{" "}
              {counts.teacher} teacher{counts.teacher === 1 ? "" : "s"} ·{" "}
              {counts.admin} admin{counts.admin === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-2">
            {accounts.map((account) => {
              const isSelf = account.id === user?.id;

              return (
                <div
                  key={account.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                    {initials(account.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {account.name}
                      {isSelf && <Badge variant="secondary">You</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {account.email}
                      {account.team ? ` · ${account.team.name}` : ""}
                    </p>
                  </div>

                  <Select
                    items={ROLE_ITEMS}
                    value={account.role}
                    disabled={isSelf || busyId === account.id}
                    onValueChange={(value) => {
                      if (value) changeRole(account, value as ApiRole);
                    }}
                  >
                    <SelectTrigger
                      className="w-36"
                      aria-label={`Role for ${account.name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        {ROLE_LABELS.student}
                      </SelectItem>
                      <SelectItem value="teacher">
                        {ROLE_LABELS.teacher}
                      </SelectItem>
                      <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${account.name}`}
                    disabled={isSelf}
                    onClick={() => setDeleting(account)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deletingBusy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this account?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `${deleting.name} (${deleting.email})`
                : "This account"}{" "}
              will be deleted, along with any designs they own. This cannot be
              undone.
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
              Remove account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
