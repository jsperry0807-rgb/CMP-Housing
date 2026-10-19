import "@google/model-viewer";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export type { ModelViewerProps };

/**
 * Renders an interactive 3D model with Google's <model-viewer> web component.
 * Visitors can drag to orbit and scroll to zoom; it auto-rotates until they
 * touch it. The component is registered by the side-effect import above.
 */
export default function ModelViewer({ src, alt, className }: ModelViewerProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "grid aspect-16/10 place-items-center rounded-xl border bg-muted p-6 text-center",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium">
            This 3D model could not be loaded.
          </p>
          <p className="text-xs text-muted-foreground">
            The file may be broken or a .gltf that references missing textures.
          </p>
          <a href={src} download className="text-xs underline">
            Download the model to inspect it
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-16/10 overflow-hidden rounded-xl border bg-linear-to-b from-muted to-background",
        className,
      )}
    >
      <model-viewer
        src={src}
        alt={alt}
        camera-controls
        auto-rotate
        auto-rotate-delay={1500}
        rotation-per-second="18deg"
        shadow-intensity="1"
        exposure="1"
        environment-image="neutral"
        interaction-prompt="auto"
        touch-action="pan-y"
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%" }}
      />

      <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-background/70 py-1.5 text-center text-[11px] text-muted-foreground backdrop-blur">
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  );
}
