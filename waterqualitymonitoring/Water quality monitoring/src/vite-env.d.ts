/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_PROVIDER?: string
  readonly VITE_ARCGIS_FEATURE_SERVICE_URL?: string
  readonly VITE_ARCGIS_PORTAL_URL?: string
  readonly VITE_ARCGIS_CLIENT_ID?: string
  /** Optional override for production Web Map item id (WATER-DATA-02B). */
  readonly VITE_ARCGIS_WEBMAP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
