# Performance Review Sənədi

## Ümumi qiymətləndirmə

Layihə kiçik-orta ölçülü admin paneldir. Performans optimizasiyaları **minimal səviyyədədir** — əsasən React Query cache və conditional query `enabled` flag istifadə olunur.

---

## Bundle size riskləri

### Böyük dependency-lər

| Package | Risk | Təsvir |
|---------|------|--------|
| **recharts** | Yüksək | Dashboard chart — tree-shaking partial |
| **react-dom + react** | Orta | Core, unavoidable |
| **@tanstack/react-query** | Aşağı-Orta | Well-optimized |
| **formik + yup** | Orta | Yalnız login istifadə edir, bütün bundle-a daxil |
| **lucide-react** | Aşağı | Named imports — tree-shakeable |
| **axios** | Aşağı | Standard size |

### Böyük komponent faylları (code splitting yox)

| Fayl | Sətir | Təsir |
|------|-------|-------|
| `ProductDetailsPage.tsx` | ~849 | Initial bundle |
| `CategoryAttributesPage.tsx` | ~764 | Initial bundle |
| `AddItemModal.tsx` | ~669 | Initial bundle |
| `DiscountsPage.tsx` | ~630 | Initial bundle |
| `ItemsPage.tsx` | ~615 | Initial bundle |

**Problem:** Bütün səhifələr `App.tsx`-də statik import olunur — initial bundle bütün səhifələri ehtiva edir.

---

## Lazy loading / Code splitting

**Status: ❌ Tətbiq olunmayıb**

```typescript
// Hazırkı (App.tsx)
import { ItemsPage } from "./pages/ItemsPage";

// Tövsiyə
const ItemsPage = React.lazy(() => import("./pages/ItemsPage"));
```

**Tövsiyə:** Hər route səhifəsini `React.lazy()` + `<Suspense>` ilə wrap et.

---

## Re-render riskləri

### ThemeContext

`useTheme()` bir çox komponentdə istifadə olunur. Theme dəyişdikdə bütün theme-aware komponentlər re-render olur.

**Tövsiyə:** CSS variables + `dark` class (React state əvəzinə).

### AuthContext

`AuthProvider` bütün app-i wrap edir. Auth state dəyişikliyi full tree re-render.

**Tövsiyə:** Context value `useMemo` ilə stabilize et.

### React Query

Düzgün istifadə olunur — yalnız query subscriber-ləri re-render olur.

### Missing memoization

| Pattern | Vəziyyət |
|---------|----------|
| `React.memo()` | ❌ Komponentlərdə istifadə olunmur |
| `useMemo()` | ⚠️ Yalnız AddItemModal-da (2 istifadə) |
| `useCallback()` | ⚠️ Yalnız ToastContext-də |

### Inline functions in render

CRUD səhifələrində table column `render` funksiyaları hər render-də yeni reference yaradır — Table bütün row-ları re-render edə bilər.

---

## Pagination və virtualization

### Pagination

✅ Server-side pagination istifadə olunur:

```typescript
productsApi.getProducts({ page, pageSize, searchTerm, ...filters })
```

Bütün CRUD səhifələrində `Pagination` komponenti var (10/25/50/100).

### Virtualization

❌ Virtual scroll/list **yoxdur**. Cədvəllər DOM-da bütün row-ları render edir.

**Risk:** pageSize=100 olduqda 100 DOM row — admin panel üçün acceptable, lakin böyük data üçün `@tanstack/react-virtual` tövsiyə olunur.

---

## Image optimization

| Pattern | Harada | Təsvir |
|---------|--------|--------|
| `ImageWithFallback` | ItemsPage, ProductDetailsPage | onError → fallback, infinite loop prevention |
| Lazy loading | ❌ | `<img loading="lazy">` istifadə olunmur |
| Image resize | ❌ | Backend thumbnail yox, full size load |
| Placeholder | ✅ | Package icon fallback |

### Image URL building

Müxtəlif URL pattern-ləri — bəzi şəkillər 404 → fallback → extra network request.

---

## Caching

| Mexanizm | Təsvir |
|----------|--------|
| React Query cache | Default staleTime (0) — data dərhal stale |
| Lookup cache | FilterModal: `staleTime: 1 hour` |
| localStorage | Theme, auth tokens |
| Service Worker | ❌ Yoxdur |
| HTTP cache headers | Backend-dən asılı |

**Tövsiyə:** Static lookup data (categories, brands) üçün global `staleTime: 5 * 60 * 1000`.

---

## Network optimizasiyası

| Pattern | Vəziyyət |
|---------|----------|
| Request deduplication | ✅ React Query default |
| Parallel requests | ✅ Dashboard (multiple useQuery) |
| Sequential uploads | ⚠️ `addProductImagesFromFiles` — for loop |
| Batch API | ❌ Yoxdur |
| Debounced search | ❌ Search input debounce yoxdur |

**Search debounce problemi:** ItemsPage-də hər keystroke yeni query trigger edir (React Query cache partial help).

---

## Performans təkmilləşdirmə prioritetləri

| Prioritet | Action | Təsir |
|-----------|--------|-------|
| 🔴 Yüksək | Route-based code splitting | Initial load ↓ |
| 🔴 Yüksək | Search debounce (300ms) | API call ↓ |
| 🟡 Orta | Lookup staleTime global | Cache hit ↑ |
| 🟡 Orta | Remove production console.log | Runtime ↓ |
| 🟡 Orta | Image lazy loading | Page load ↓ |
| 🟢 Aşağı | React.memo on Table rows | Re-render ↓ |
| 🟢 Aşağı | Parallel image upload | Upload speed ↑ |
