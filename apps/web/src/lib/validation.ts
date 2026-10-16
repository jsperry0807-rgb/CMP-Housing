/** Client-side validation mirroring the API rules in apps/api. */

export const MIN_PASSWORD_LENGTH = 8;

/** Students sign up with their Erie County Technical School email address. */
export const SCHOOL_EMAIL_DOMAIN = "ects.org";

export function validateName(value: string): string | undefined {
  if (!value.trim()) return "Name is required";
  if (value.trim().length > 80) return "Name must be 80 characters or fewer";
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address";
  }
  return undefined;
}

/** Signup emails must be on the school domain, on top of the format check. */
export function validateSchoolEmail(value: string): string | undefined {
  const format = validateEmail(value);
  if (format) return format;
  if (!value.trim().toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`)) {
    return `Use your @${SCHOOL_EMAIL_DOMAIN} school email address`;
  }
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return undefined;
}

/** Drops keys with undefined values so a field with no error is simply absent. */
export function compactErrors(
  errors: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
}
