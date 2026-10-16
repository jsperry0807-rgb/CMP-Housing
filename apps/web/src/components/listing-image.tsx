import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ListingImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

/** An image that falls back to a neutral placeholder when it fails to load. */
export default function ListingImage({
  src,
  alt = "",
  className,
}: ListingImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid size-full place-items-center bg-muted text-muted-foreground/40",
          className,
        )}
      >
        <ImageOff className="size-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("size-full object-cover", className)}
    />
  );
}
