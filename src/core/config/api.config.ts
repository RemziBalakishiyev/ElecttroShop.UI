const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!API_BASE_URL && import.meta.env.PROD) {
  throw new Error("VITE_API_BASE_URL is required in production");
}

// Full base URL including /api — used by apiClient
export const apiBaseUrl = API_BASE_URL || "https://localhost:44312/api";

// Origin only (no /api suffix) — used for building image URLs
const origin = API_BASE_URL
  ? API_BASE_URL.replace(/\/api\/?$/, "")
  : "https://localhost:44312";

export const API_CONFIG = {
  BASE_URL: origin,
} as const;

// Builds a full endpoint URL (used where a full URL is needed outside apiClient)
export const getApiUrl = (endpoint: string): string => `${apiBaseUrl}${endpoint}`;
