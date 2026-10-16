import { request } from "./api";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

/** A team with its members, as returned to a signed-in student. */
export interface TeamDetail {
  id: string;
  name: string;
  logo?: string;
  members: TeamMember[];
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  /** The team this student is on, or null while unassigned. */
  team: string | null;
}

export interface TeamsOverview {
  teams: TeamDetail[];
  students: StudentSummary[];
}

export const teamsApi = {
  /** The signed-in student's team, or null if a teacher has not assigned one. */
  mine: () => request<{ team: TeamDetail | null }>("/api/me/team"),

  /** Admin overview of every team and student. */
  overview: () => request<TeamsOverview>("/api/teams"),

  create: (input: { name: string; logo?: string }) =>
    request<{ team: TeamDetail }>("/api/teams", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: { name?: string; logo?: string }) =>
    request<{ team: TeamDetail }>(`/api/teams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/api/teams/${id}`, { method: "DELETE" }),

  /** Assigns a student to a team, or passes null to unassign them. */
  assign: (userId: string, team: string | null) =>
    request<{ student: StudentSummary }>("/api/teams/assign", {
      method: "POST",
      body: JSON.stringify({ userId, team }),
    }),
};
