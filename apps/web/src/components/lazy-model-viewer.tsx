import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModelViewerProps } from "@/components/model-viewer";

/**
 * Lazily loads the 3D viewer. The viewer pulls in a large WebGL library, so we
 * keep it out of the main bundle and only fetch it when a 3D model is actually
 * shown. The type-only import above is erased at build time.
 */
const ModelViewer = lazy(() => import("@/components/model-viewer"));

export default function LazyModelViewer(props: ModelViewerProps) {
  return (
    <Suspense
      fallback={<Skeleton className="aspect-16/10 w-full rounded-xl" />}
    >
      <ModelViewer {...props} />
    </Suspense>
  );
}
