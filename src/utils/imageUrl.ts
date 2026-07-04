import { API_CONFIG, apiBaseUrl } from "../core/config/api.config";

/**
 * Resolves any image reference returned by the backend (absolute URL, /api/images/{id},
 * wwwroot-relative path, or a bare image id) into a URL the browser can load.
 * Returns null for empty input so callers can keep their existing icon-fallback UI.
 */
export function resolveImageUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (trimmed.startsWith("/api/")) return `${API_CONFIG.BASE_URL}${trimmed}`;

  if (/^wwwroot\/?/i.test(trimmed)) {
    return `${API_CONFIG.BASE_URL}/${trimmed.replace(/^wwwroot\/?/i, "")}`;
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/images/")) {
    return `${API_CONFIG.BASE_URL}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/") || trimmed.startsWith("images/")) {
    return `${API_CONFIG.BASE_URL}/${trimmed}`;
  }

  if (trimmed.startsWith("/")) return `${API_CONFIG.BASE_URL}${trimmed}`;

  // Bare image id (GUID, optionally with a file extension) → GET /api/images/{id}
  return `${apiBaseUrl}/images/${trimmed}`;
}
