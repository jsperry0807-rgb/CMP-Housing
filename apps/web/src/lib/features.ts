/**
 * Feature flags toggled through environment variables, so unfinished work can
 * ship to the branch without being visible to anyone.
 *
 * To turn a flag on, add it to `apps/web/.env` (copy `.env.example`) and
 * restart the dev server — Vite only reads env files at start-up.
 */

/** Upload and view interactive 3D models (glTF/.glb) on a house design. */
export const THREE_D_MODELS_ENABLED =
  import.meta.env.VITE_ENABLE_3D_MODELS === "true";
