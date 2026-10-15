import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Form-level error banner. */
export default function FormError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>Could not continue</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
