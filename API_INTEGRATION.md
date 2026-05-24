# API Integration Sənədi

## API client strukturu

### Axios instance

**Fayl:** `src/core/api/apiClient.ts`

```typescript
const apiClient = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
  // → https://localhost:44312/api
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
```

### Request interceptor

Hər sorğuya Bearer token əlavə edir:

```typescript
const token = tokenStorage.getAccessToken();
if (token && config.headers) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### Response interceptor

1. **Success:** `console.log("API Response:", response.data)` — debug log
2. **401 Unauthorized:** Refresh token flow
3. **Error:** `error.response.data` reject olunur

### Refresh token flow

```
401 response
  ↓
_retry flag yoxla
  ↓
refreshToken localStorage-dan oxu
  ↓
POST /api/auth/refresh-token { refreshToken }
  ↓
Uğurlu → yeni token-lar save → original request retry
Uğursuz → tokenStorage.clearAll() → window.location.href = "/login"
```

---

## Konfiqurasiya

**Fayl:** `src/core/config/api.config.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: "https://localhost:44312",
  API_PREFIX: "/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH_TOKEN: "/auth/refresh-token",
    },
  },
};
```

**Qeyd:** Endpoint-lərin əksəriyyəti birbaşa API modul fayllarında hardcoded path kimi yazılıb.

---

## API modulları

### auth.api.ts

| Metod | HTTP | Endpoint | Request | Response |
|-------|------|----------|---------|----------|
| `login` | POST | `/auth/login` | `LoginRequest` | `ApiResponse<LoginResponse>` |
| `refreshToken` | POST | `/auth/refresh-token` | `RefreshTokenRequest` | `ApiResponse<RefreshTokenResponse>` |

---

### products.api.ts

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `getProducts` | GET | `/Products` |
| `getProductById` | GET | `/Products/:id` |
| `searchProducts` | GET | `/Products/search` |
| `createProduct` | POST | `/Products` |
| `updateProduct` | PUT | `/Products/:id` |
| `deleteProduct` | DELETE | `/Products/:id` |
| `updatePrice` | PATCH | `/Products/:id/price` |
| `updateStock` | PATCH | `/Products/:id/stock` |
| `uploadImage` | POST | `/Products/:id/image` |
| `setBanner` | POST | `/Products/:id/banner` |
| `removeBanner` | DELETE | `/Products/:id/banner` |
| `setFeatured` | POST | `/Products/:id/featured` |
| `removeFeatured` | DELETE | `/Products/:id/featured` |
| `addProductImage` | POST | `/Products/:id/images` |
| `deleteProductImage` | DELETE | `/Products/:id/images/:imageId` |
| `setPrimaryImage` | POST | `/Products/:id/images/:imageId/primary` |
| `createProductVariant` | POST | `/Products/:id/variants` |
| `updateProductVariant` | PUT | `/Products/:id/variants/:variantId` |
| `deleteProductVariant` | DELETE | `/Products/:id/variants/:variantId` |

**Helper funksiyalar:**
- `buildProductImageIdsForSave()` — şəkil upload + ID toplama
- `getProductExistingImageCount()` — mövcud şəkil sayı
- `addProductImagesFromFiles()` — fayl upload + link

---

### categories.api.ts

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `getCategories` | GET | `/categories` |
| `getCategoryById` | GET | `/categories/:id` |
| `getCategoryBySlug` | GET | `/categories/slug/:slug` |
| `createCategory` | POST | `/categories` |
| `updateCategory` | PUT | `/categories/:id` |
| `deleteCategory` | DELETE | `/categories/:id` |
| `getCategoryAttributes` | GET | `/categories/:categoryId/attributes` |
| `createCategoryAttribute` | POST | `/categories/:categoryId/attributes` |
| `updateCategoryAttribute` | PUT | `/categories/attributes/:id` |
| `deleteCategoryAttribute` | DELETE | `/categories/attributes/:id` |
| `addAttributeValue` | POST | `/categories/attributes/:attributeId/values` |
| `updateAttributeValue` | PUT | `/categories/attributes/values/:valueId` |
| `deleteAttributeValue` | DELETE | `/categories/attributes/values/:valueId` |
| `getLookup` | GET | `/categories/lookup` |

---

### brands.api.ts

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `getBrands` | GET | `/brands` |
| `getBrandById` | GET | `/brands/:id` |
| `createBrand` | POST | `/brands` |
| `updateBrand` | PUT | `/brands/:id` |
| `deleteBrand` | DELETE | `/brands/:id` |
| `getPromotionalBrands` | GET | `/brands/promotional` |
| `getLookup` | GET | `/brands/lookup` |

---

### discounts.api.ts

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `getDiscounts` | GET | `/discounts` |
| `getDiscountById` | GET | `/discounts/:id` |
| `createDiscount` | POST | `/discounts` |
| `updateDiscount` | PUT | `/discounts/:id` |
| `deleteDiscount` | DELETE | `/discounts/:id` |

---

### dashboard.api.ts

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `getDashboardData` | GET | `/Dashboard` |
| `getDashboardChart` | GET | `/Dashboard/chart?period=&periodCount=` |

---

### images.api.ts

| Metod | HTTP | Endpoint |
|-------|------|----------|
| `uploadImage` | POST | `/images/upload` (multipart/form-data) |
| `deleteImage` | DELETE | `/images/:imageId` |

---

## Response handling

### Standard wrapper

```typescript
interface ApiResponse<T> {
  isSuccess: boolean;
  value: T | null;
  error: ApiError | null;
}

interface ApiError {
  code: string;
  message: string;
  type: "Validation" | "Failure";
}
```

### Paged response

```typescript
interface PagedApiResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

### Unwrap utility

**Fayl:** `src/utils/apiResponse.ts`

```typescript
export function unwrapApiData<T>(response: unknown): T {
  if (response && typeof response === "object" && "value" in response) {
    const value = (response as { value: unknown }).value;
    if (value !== null && value !== undefined) return value as T;
  }
  return response as T;
}
```

**İstifadə:** `productsApi.getProductById`, `categoriesApi.getCategoryAttributes`

**Problem:** Kod bazasının əksəriyyəti hələ `(data as any)?.value || data` pattern istifadə edir.

---

## Endpoint → Frontend istifadə xəritəsi

| Endpoint | Frontend istifadə yeri |
|----------|------------------------|
| `POST /auth/login` | `LoginPage` → `useLogin` |
| `POST /auth/refresh-token` | `apiClient` interceptor, `useRefreshToken` |
| `GET /Products` | `ItemsPage`, `DiscountsPage` |
| `GET /Products/:id` | `ProductDetailsPage` |
| `POST/PUT/DELETE /Products/*` | `ItemsPage`, `ProductDetailsPage` |
| `GET /categories` | `CategoriesPage`, `DiscountsPage` |
| `GET /categories/:id/attributes` | `CategoryAttributesPage`, `AddItemModal` |
| `GET /brands` | `BrandsPage`, `DiscountsPage` |
| `GET /brands/promotional` | `PromotionalBrands` |
| `GET /brands/lookup` | `FilterModal` |
| `GET /categories/lookup` | `FilterModal` |
| `GET /discounts` | `DiscountsPage` |
| `GET /Dashboard` | `DashboardPage` |
| `GET /Dashboard/chart` | `DashboardChart` |
| `POST /images/upload` | `AddItemModal`, `ProductDetailsPage`, `buildProductImageIdsForSave` |

---

## Multipart upload

Şəkil upload sorğularında `Content-Type: multipart/form-data` header manual set olunur:

```typescript
const formData = new FormData();
formData.append("file", file);
await apiClient.post("/images/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

---

## Şəkil URL quruluşu

Müxtəlif pattern-lər istifadə olunur (inconsistency):

```typescript
// Pattern 1: Full URL
product.imageUrl.startsWith("http") ? product.imageUrl : ...

// Pattern 2: Base URL + path
`${API_CONFIG.BASE_URL}${product.imageUrl}`

// Pattern 3: Image ID
`${API_CONFIG.BASE_URL}/api/images/${url}`

// Pattern 4: PromotionalBrands
`${API_CONFIG.BASE_URL}/images/${featuredProduct.imageId}`
```

**Dəqiqləşdirilməlidir:** Backend-in canonical image URL formatı.

---

## Security qeydləri

| Mövzu | Vəziyyət |
|-------|----------|
| Token storage | localStorage (XSS riski) |
| HTTPS | Dev: `https://localhost:44312` |
| CORS | Backend konfiqurasiyasından asılıdır |
| Request logging | Production-da `console.log` response data riski |
