import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import ListingImage from "@/components/listing-image";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { uploadApi } from "@/lib/listings";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

/** Uploads photos straight to the API and keeps the URLs in form state. */
export default function ImageUploader({
  value,
  onChange,
  max = 15,
  label = "Add photos",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if (value.length + files.length > max) {
      setError(`You can add up to ${max} photos.`);
      return;
    }

    const tooBig = files.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setError(`“${tooBig.name}” is larger than 8 MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { files: uploaded } = await uploadApi.images(files);
      onChange([...value, ...uploaded.map((file) => file.url)]);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not upload those photos.",
      );
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((item) => item !== url));

    // Best-effort cleanup of files this app uploaded itself.
    if (url.startsWith("/uploads/")) {
      uploadApi.remove(url.slice("/uploads/".length)).catch(() => {});
    }
  }

  const full = value.length >= max;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={handleSelect}
        />

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={uploading || full}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <ImagePlus />
          )}
          {uploading ? "Uploading…" : label}
        </Button>

        <span className="text-xs text-muted-foreground">
          {value.length} / {max} photos
        </span>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-4/3 overflow-hidden rounded-lg bg-muted"
            >
              <ListingImage src={url} alt="" />

              {index < 3 && value.length > 3 && (
                <span className="absolute top-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
                  Showcase
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(url)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
