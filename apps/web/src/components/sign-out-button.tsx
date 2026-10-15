import { LogOut, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { navigate } from "@/lib/router";

export default function SignOutButton() {
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      onClick={handleSignOut}
      disabled={pending}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : <LogOut />}
      Sign out
    </Button>
  );
}
