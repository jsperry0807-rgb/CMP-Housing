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
  validateEmail,
  validatePassword,
} from "@/lib/validation";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = compactErrors({
      email: validateEmail(email),
      password: validatePassword(password),
    });

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
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
      title="Welcome back"
      description="Sign in to your ECTS Housing account."
      footer={
        <>
          New here?{" "}
          <a
            href="#/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        {formError && <FormError message={formError} />}

        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
          autoFocus
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password}
        />

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="mt-1 w-full"
        >
          {submitting ? (
            <>
              <LoaderCircle className="animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
