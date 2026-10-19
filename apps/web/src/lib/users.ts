import { request, type ApiRole } from "./api";

/** An account as returned to the admin's user manager. */
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  /** The team this account belongs to, or null. */
  team: { id: string; name: string; logo?: string } | null;
  createdAt: string;
}

export const usersApi = {
  /** Every account on the site. Admin only. */
  list: () => request<{ users: ManagedUser[] }>("/api/users"),

  /** Change an account's role. Admin only. */
  setRole: (id: string, role: ApiRole) =>
    request<{ user: ManagedUser }>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  /** Delete an account and the designs it owns. Admin only. */
  remove: (id: string) =>
    request<void>(`/api/users/${id}`, { method: "DELETE" }),
};
