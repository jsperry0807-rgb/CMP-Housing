import type { ReactNode } from "react";
import Logo from "@/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Centered shell shared by the login and signup pages. */
export default function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 shrink-0 items-center px-6">
        <a href="#/" aria-label="ECTS Housing home">
          <Logo />
        </a>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 pb-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <h1 className="font-heading text-lg leading-snug font-medium">
              {title}
            </h1>
            <CardDescription>{description}</CardDescription>
          </CardHeader>

          <CardContent>{children}</CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            {footer}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
