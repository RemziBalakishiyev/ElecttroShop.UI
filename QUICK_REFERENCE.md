# Developer Quick Reference

## Tez-tez istifadə olunan command-lar

```bash
# Development server
npm run dev
# → http://localhost:5173

# Production build
npm run build

# Build preview
npm run preview

# Lint
npm run lint

# Dependencies install
npm install
```

---

## Vacib folder-lər

| Folder | Məzmun |
|--------|--------|
| `src/pages/` | Route səhifələri |
| `src/components/commons/` | UI kit (Button, Input, Table, ...) |
| `src/components/modals/` | Biznes modal-ları |
| `src/core/api/` | API client + domain API modulları |
| `src/core/context/` | AuthContext, ThemeContext |
| `src/core/hooks/` | useLogin, useRefreshToken |
| `src/core/config/` | api.config.ts, theme.ts |
| `src/layouts/` | MainLayout, Sidebar, Header |
| `src/modules/auth/` | Auth səhifələri və layout |
| `src/locales/az/` | i18n tərcümələr |
| `src/utils/` | cn, apiResponse |

---

## Vacib komponentlər

| Komponent | Import | İstifadə |
|-----------|--------|----------|
| `Button` | `components/commons/Button` | Actions |
| `Input` | `components/commons/Input` | Form fields |
| `Table` | `components/commons/Table` | Data tables |
| `Modal` | `components/commons/Modal` | Dialogs |
| `ConfirmationModal` | `components/commons/ConfirmationModal` | Delete confirm |
| `Pagination` | `components/commons/Pagination` | Page navigation |
| `AddItemModal` | `components/modals/AddItemModal` | Product create/edit |
| `FilterModal` | `components/commons/FilterModal` | Product filters |
| `MainLayout` | `layouts/MainLayout` | Admin layout |
| `ProtectedRoute` | `core/components/ProtectedRoute` | Auth guard |

---

## Vacib hook-lar

```typescript
import { useAuthContext } from "./core/context/AuthContext";
import { useTheme } from "./core/context/ThemeContext";
import { useToast } from "./core/providers/ToastContext";
import { useLogin } from "./core/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
```

| Hook | Return | Nümunə |
|------|--------|--------|
| `useAuthContext()` | user, isAuthenticated, logout | Header, ProtectedRoute |
| `useTheme()` | theme, setTheme, toggleTheme | Dark/light styling |
| `useToast()` | success, error, info, warning | Mutation feedback |
| `useLogin(callback?)` | mutation object | LoginPage |
| `useQuery({...})` | data, isLoading, isError | Data fetching |
| `useMutation({...})` | mutate, isPending | CRUD operations |
| `useTranslation()` | t | i18n strings |

---

## Vacib route-lar

| Path | Səhifə |
|------|--------|
| `/login` | Login |
| `/` | Dashboard |
| `/products` | Məhsul siyahısı |
| `/products/:id` | Məhsul detalları |
| `/categories` | Kateqoriyalar |
| `/categories/:categoryId/attributes` | Atributlar |
| `/brands` | Brendlər |
| `/discounts` | Endirimlər |

---

## Vacib API service-lər

| Import | Fayl | Əsas metodlar |
|--------|------|---------------|
| `authApi` | `core/api/auth.api.ts` | login, refreshToken |
| `productsApi` | `core/api/products.api.ts` | getProducts, createProduct, updateProduct, deleteProduct |
| `categoriesApi` | `core/api/categories.api.ts` | getCategories, createCategory, getCategoryAttributes |
| `brandsApi` | `core/api/brands.api.ts` | getBrands, createBrand, getPromotionalBrands |
| `discountsApi` | `core/api/discounts.api.ts` | getDiscounts, createDiscount |
| `dashboardApi` | `core/api/dashboard.api.ts` | getDashboardData, getDashboardChart |
| `imagesApi` | `core/api/images.api.ts` | uploadImage, deleteImage |

### API base URL

```
https://localhost:44312/api
```

Konfiq: `src/core/config/api.config.ts`

---

## React Query key-lər (sürətli referans)

```typescript
["dashboard"]
["dashboardChart", period]
["promotional-brands"]
["products", page, pageSize, searchTerm, filters]
["product", id]
["categories", page, pageSize, searchTerm]
["category", categoryId]
["category-attributes", categoryId]
["brands", page, pageSize, searchTerm]
["discounts", page, pageSize, searchTerm, filterType, filterActive]
["categories-lookup"]
["brands-lookup"]
```

---

## Yeni səhifə əlavə etmək

1. `src/pages/NewPage.tsx` yarat
2. `src/App.tsx`-ə route əlavə et:

```tsx
<Route path="/new-page" element={
  <ProtectedRoute>
    <MainLayout>
      <NewPage />
    </MainLayout>
  </ProtectedRoute>
} />
```

3. `src/layouts/Sidebar.tsx`-ə menu item əlavə et
4. `src/locales/az/translation.json`-a tərcümə key-ləri əlavə et

---

## Yeni API endpoint əlavə etmək

1. Müvafiq `src/core/api/*.api.ts` faylına metod əlavə et
2. TypeScript interface-ləri define et
3. Səhifədə `useQuery` / `useMutation` istifadə et
4. Error handling: `toast.error(parseApiError(err))`

---

## Debug zamanı baxılmalı yerlər

| Problem | Haraya bax |
|---------|------------|
| Login işləmir | `useAuth.ts`, `auth.api.ts`, Network tab |
| 401 errors | `apiClient.ts` interceptor, localStorage tokens |
| API URL wrong | `core/config/api.config.ts` |
| Data null/undefined | Response unwrap: `(data)?.value \|\| data` |
| Route redirect loop | `ProtectedRoute`, `PublicRoute`, `AuthContext` |
| Toast görünmür | `ToastProvider` in `AppProviders`, `useToast()` |
| Dark mode issue | `ThemeContext`, component theme conditionals |
| i18n missing key | `locales/az/translation.json` |
| CORS error | Backend CORS config (frontend-də proxy yox) |
| Build error | `tsc -b` output, TypeScript strict errors |

---

## localStorage key-lər

| Key | Məzmun |
|-----|--------|
| `accessToken` | JWT access token |
| `refreshToken` | JWT refresh token |
| `expiresAt` | Token expiry ISO string |
| `user` | JSON User object |
| `theme` | `"light"` or `"dark"` |

---

## Sənəd naviqasiyası

| Sual | Sənəd |
|------|-------|
| Layihə nədir? | [README.md](./README.md) |
| Folder strukturu? | [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) |
| Route-lar? | [ROUTING.md](./ROUTING.md) |
| Səhifə detalları? | [PAGES_AND_SCREENS.md](./PAGES_AND_SCREENS.md) |
| Komponent props? | [COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md) |
| State necə işləyir? | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) |
| API endpoint-lər? | [API_INTEGRATION.md](./API_INTEGRATION.md) |
| Login flow? | [AUTHENTICATION_AUTHORIZATION_FRONTEND.md](./AUTHENTICATION_AUTHORIZATION_FRONTEND.md) |
| Form validation? | [FORMS_AND_VALIDATION.md](./FORMS_AND_VALIDATION.md) |
| UI qaydaları? | [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) |
| Build/deploy? | [BUILD_AND_DEPLOYMENT.md](./BUILD_AND_DEPLOYMENT.md) |
