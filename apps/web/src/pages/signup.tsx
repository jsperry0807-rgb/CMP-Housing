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
  validateEmail,
  validateName,
  validatePassword,
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
      email: validateEmail(email),
      password: validatePassword(password),
    });

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
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
      title="Create your account"
      description="Start using ECTS Housing in a minute."
      footer={
        <>
          Already have an account?{" "}
          <a
            href="#/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        {formError && <FormError message={formError} />}

        <FormField
          label="Name"
          name="name"
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Ada Lovelace"
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
          placeholder="you@example.com"
          error={errors.email}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="Create a password"
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
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
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
