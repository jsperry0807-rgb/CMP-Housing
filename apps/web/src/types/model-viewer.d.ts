import type { HTMLAttributes } from "react";

/**
 * Props for Google's <model-viewer> web component. It is registered by
 * importing "@google/model-viewer"; these types let us use it in JSX.
 *
 * Docs: https://modelviewer.dev/docs/
 */
type ModelViewerProps = HTMLAttributes<HTMLElement> & {
  src?: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: number;
  "rotation-per-second"?: string;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  "environment-image"?: string;
  exposure?: string | number;
  "camera-orbit"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "field-of-view"?: string;
  "interaction-prompt"?: "auto" | "none";
  "touch-action"?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
