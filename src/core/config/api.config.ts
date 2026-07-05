const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL as string | undefined;

if (!API_BASE_URL && import.meta.env.PROD) {
  throw new Error("VITE_API_BASE_URL is required in production");
}

// Full base URL including /api — used by apiClient
export const apiBaseUrl = API_BASE_URL ?? "";

// Origin only (no /api suffix) — used for building image/asset URLs.
// Prefers the explicit VITE_ASSET_BASE_URL; falls back to deriving it from
// VITE_API_BASE_URL by stripping the /api suffix if that env var isn't set.
// No hardcoded host here on purpose — both .env (dev) and Render's env
// config (prod) always provide one of these two vars.
const origin =
  ASSET_BASE_URL ?? (API_BASE_URL ? API_BASE_URL.replace(/\/api\/?$/, "") : "");

export const API_CONFIG = {
  BASE_URL: origin,
} as const;

// Builds a full endpoint URL (used where a full URL is needed outside apiClient)
export const getApiUrl = (endpoint: string): string => `${apiBaseUrl}${endpoint}`;
