import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import AuthLayout from "@/components/auth-layout";
import FormError from "@/components/form-error";
import FormField from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";
import {
  compactErrors,
  MIN_PASSWORD_LENGTH,
  SCHOOL_EMAIL_DOMAIN,
  validateName,
  validatePassword,
  validateSchoolEmail,
} from "@/lib/validation";

export default function Signup() {
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = compactErrors({
      name: validateName(name),
      email: validateSchoolEmail(email),
      password: validatePassword(password),
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError(null);
    setSubmitting(true);

    try {
      await signup({ name, email, password });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors;
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(
            compactErrors({
              name: fieldErrors.name,
              email: fieldErrors.email,
              password: fieldErrors.password,
            }),
          );
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your student account"
      description="Sign up with your school email, then your teacher will add you to a team before you submit a house design."
      footer={
        <>
          Already have an account?{" "}
          <a
            href="#/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {formError && <FormError message={formError} />}

        <FormField
          label="Your name"
          name="name"
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Alex Carter"
          error={errors.name}
          autoFocus
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder={`you@${SCHOOL_EMAIL_DOMAIN}`}
          hint={`Use your @${SCHOOL_EMAIL_DOMAIN} school email address`}
          error={errors.email}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          error={errors.password}
        />

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? <LoaderCircle className="animate-spin" /> : null}
          {submitting ? "Creating account…" : "Create account"}
          {!submitting && <ArrowRight />}
        </Button>
      </form>
    </AuthLayout>
  );
}
