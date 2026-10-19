/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Feature flag for uploading and viewing interactive 3D models (glTF/.glb)
   * on a house design. Set to "true" in apps/web/.env to turn it on.
   */
  readonly VITE_ENABLE_3D_MODELS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
