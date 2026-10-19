export type ApiRole = "student" | "teacher" | "admin";

/** Teachers and admins share moderation and team-management powers. */
export function isStaff(
  user: Pick<ApiUser, "role"> | null | undefined,
): boolean {
  return user?.role === "teacher" || user?.role === "admin";
}

/** Admins sit above teachers and manage accounts and roles. */
export function isAdmin(
  user: Pick<ApiUser, "role"> | null | undefined,
): boolean {
  return user?.role === "admin";
}

/** Human-readable labels for each role. */
export const ROLE_LABELS: Record<ApiRole, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
};

/** The team a student belongs to, as returned on an authenticated user. */
export interface ApiTeam {
  id: string;
  name: string;
  /** Public URL of the team logo. */
  logo?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  /** The student team this account belongs to, assigned by a teacher. */
  team?: ApiTeam | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileInput {
  name?: string;
}

interface ApiErrorBody {
  error?: {
    message?: string;
    details?: unknown;
  };
}

interface ValidationIssue {
  path?: Array<string | number>;
  message?: string;
}

/** Error thrown for any failed API call, including network failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  /** Field-level messages from API validation errors, keyed by field name. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};

    const errors: Record<string, string> = {};
    for (const issue of this.details as ValidationIssue[]) {
      const field = issue.path?.[0];
      if (typeof field === "string" && issue.message && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return errors;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers, ...rest } = init ?? {};
  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(path, {
      credentials: "include",
      ...rest,
      headers: {
        // A FormData body must keep the browser-generated multipart boundary.
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ApiError(0, "Could not reach the API. Is apps/api running?");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error?.message ?? `Request failed with status ${response.status}`,
      body?.error?.details,
    );
  }

  return data as T;
}

export const authApi = {
  me: () => request<{ user: ApiUser }>("/api/auth/me"),

  signup: (input: SignupInput) =>
    request<{ user: ApiUser }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: LoginInput) =>
    request<{ user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateMe: (input: ProfileInput) =>
    request<{ user: ApiUser }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
};
