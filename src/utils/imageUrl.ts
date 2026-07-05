import { API_CONFIG, apiBaseUrl } from "../core/config/api.config";

const PLACEHOLDER = "/placeholder.png";

/**
 * Resolves any image reference returned by the backend — a full Cloudinary URL,
 * an absolute API URL, a legacy relative path, or a bare image id — into a URL
 * the browser can load. Absolute URLs (Cloudinary included) are returned
 * unchanged; everything else is rebuilt against the asset/API origin.
 */
export function getImageUrl(value?: string | null): string {
  if (!value?.trim()) return PLACEHOLDER;

  const trimmed = value.trim();

  // Cloudinary (or any other) absolute URL — never touch it.
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

  // Legacy bare image id (GUID, optionally with a file extension) → GET /api/images/{id}
  return `${apiBaseUrl}/images/${trimmed}`;
}

interface ProductImageLike {
  id?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  imagePath?: string | null;
}

interface ProductImageSource {
  imageUrl?: string | null;
  primaryImageUrl?: string | null;
  mainImageUrl?: string | null;
  thumbnailUrl?: string | null;
  imagePath?: string | null;
  imageId?: string | null;
  images?: ProductImageLike[] | null;
}

/**
 * Picks the single best image reference off a product-like object, in priority
 * order, so every screen shows the same image for the same product. `imageUrl`
 * is checked first since that's where the backend now puts the Cloudinary URL
 * for newly uploaded images; the rest are fallbacks for older records.
 */
export function resolveProductImage(product?: ProductImageSource | null): string | null {
  if (!product) return null;

  const firstImage = product.images?.[0];

  const candidates = [
    product.imageUrl,
    product.primaryImageUrl,
    product.mainImageUrl,
    product.thumbnailUrl,
    product.imagePath,
    product.imageId,
    firstImage?.imageUrl,
    firstImage?.url,
    firstImage?.imagePath,
    firstImage?.id,
    firstImage?.imageId,
  ];

  return candidates.find((candidate) => !!candidate?.trim()) ?? null;
}
