import { Box, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import LazyModelViewer from "@/components/lazy-model-viewer";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { uploadApi } from "@/lib/listings";

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = ".glb,.gltf,model/gltf-binary,model/gltf+json";
const ALLOWED = [".glb", ".gltf"];

interface ModelUploaderProps {
  /** The uploaded model URL, or "" when there is none. */
  value: string;
  onChange: (url: string) => void;
}

/** Uploads a single .glb/.gltf model and previews it while editing. */
export default function ModelUploader({ value, onChange }: ModelUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const dot = file.name.lastIndexOf(".");
    const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
    if (!ALLOWED.includes(extension)) {
      setError("Choose a .glb or .gltf model file.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(`“${file.name}” is larger than 100 MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { file: uploaded } = await uploadApi.model(file);
      onChange(uploaded.url);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not upload that model.",
      );
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    onChange("");

    // Best-effort cleanup of a file this app uploaded itself.
    if (value.startsWith("/uploads/")) {
      uploadApi.remove(value.slice("/uploads/".length)).catch(() => {});
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={handleSelect}
      />

      {value ? (
        <div className="flex flex-col gap-3">
          <LazyModelViewer src={value} alt="Uploaded 3D model preview" />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <RefreshCw />
              )}
              {uploading ? "Uploading…" : "Replace model"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={remove}
              disabled={uploading}
            >
              <X />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <LoaderCircle className="animate-spin" /> : <Box />}
            {uploading ? "Uploading…" : "Add a 3D model"}
          </Button>
          <span className="text-xs text-muted-foreground">
            One .glb or .gltf file, up to 100 MB
          </span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Export from Blender with File → Export → glTF 2.0 and choose the
        <span className="font-medium"> .glb</span> format. A .glb is a single
        self-contained file, so it is the most reliable option.
      </p>
    </div>
  );
}
