# Error Handling və Logging Sənədi

## Ümumi yanaşma

Error handling **decentralized** (mərkəzləşdirilmmiş deyil) — hər səhifə/mutation öz error handling-ini edir. Global error boundary **yoxdur**.

---

## Error handling layer-ləri

```
┌─────────────────────────────────────────────┐
│  Layer 1: Axios interceptor (apiClient)     │
│  → 401 refresh, error.response.data reject  │
├─────────────────────────────────────────────┤
│  Layer 2: React Query (useQuery/useMutation)│
│  → isError, onError callbacks               │
├─────────────────────────────────────────────┤
│  Layer 3: Component UI                      │
│  → Toast, inline error, error page          │
└─────────────────────────────────────────────┘
```

---

## API error handling

### Axios interceptor

**Fayl:** `src/core/api/apiClient.ts`

| Ssenari | Davranış |
|---------|----------|
| 401 + refresh token | Retry with new token |
| 401 + no refresh | clearAll + redirect `/login` |
| Error with response body | `Promise.reject(error.response.data)` |
| Network error | `Promise.reject(error)` |

### Response error format

```typescript
{
  isSuccess: false,
  error: {
    code: string,
    message: string,
    type: "Validation" | "Failure"
  }
}
```

### Error parsing inconsistency

Kod bazasında 3+ fərqli pattern:

```typescript
// Pattern 1 — interceptor reject
(error as any)?.error?.message

// Pattern 2 — axios wrapper
error.response?.data?.message

// Pattern 3 — generic fallback
toast.error(t('products.delete_error'))
```

---

## Global error boundary

**Status: ❌ Yoxdur**

React Error Boundary komponenti tapılmadı. Unhandled render error bütün app-i crash edə bilər.

**Tövsiyə:**
```tsx
// main.tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## Query error handling

### Dashboard

```tsx
if (isError || !data) {
  return <div>{t('common.dashboard_load_error')}</div>;
}
```

### CRUD səhifələr

```tsx
if (isError) {
  return <div>Error loading products: {error?.message}</div>;
}
```

**Pattern:** Full-page error message, retry button **yoxdur**.

---

## Mutation error handling

Tipik pattern:

```typescript
const deleteMutation = useMutation({
  mutationFn: ...,
  onSuccess: () => { toast.success(...); },
  onError: (err) => {
    console.error("Failed to delete:", err);
    toast.error(t('...'));
  },
});
```

---

## Toast/notification sistemi

**Fayllar:**
- `src/core/providers/ToastContext.tsx` — provider + hooks
- `src/components/commons/Toast.tsx` — toast item
- `src/components/commons/ToastContainer.tsx` — container

### API

```typescript
const toast = useToast();
toast.success("Uğurlu əməliyyat");
toast.error("Xəta baş verdi");
toast.info("Məlumat");
toast.warning("Xəbərdarlıq");
```

### Xüsusiyyətlər

| Feature | Dəyər |
|---------|-------|
| Default duration | 3000ms |
| Position | Fixed (ToastContainer) |
| Animation | slideIn (CSS keyframe) |
| Auto dismiss | ✅ |
| Manual close | ✅ |
| Stack | Multiple toasts |
| Global | ✅ Context-based |

---

## Console log / debug

### Aktiv console.log-lar (risk)

| Fayl | Məzmun | Risk |
|------|--------|------|
| `apiClient.ts` | `console.log("API Response:", response.data)` | 🔴 Production data leak |
| `useAuth.ts` | Login response debug (9 log) | 🔴 Token leak risk |
| `auth.api.ts` | Raw response log | 🔴 Token leak risk |
| CRUD pages | `console.error("Failed to ...")` | 🟡 Acceptable (error only) |
| `ForgotPasswordPage` | `console.log("Send OTP to:", email)` | 🟡 Dev only |

**Tövsiyə:** Production build-də debug log-ları silmək və ya `import.meta.env.DEV` guard istifadə etmək:

```typescript
if (import.meta.env.DEV) {
  console.log("API Response:", response.data);
}
```

---

## Loading error states

| UI Pattern | Harada |
|------------|--------|
| Full-page spinner | Dashboard, ProductDetails |
| Table loading text | Table `isLoading` prop |
| Button loading spinner | Button `loading` prop |
| Skeleton pulse | PromotionalBrands |
| Inline error div | LoginPage |

**Retry mechanism:** Heç bir səhifədə "Retry" düyməsi **yoxdur** (React Query `refetch` istifadə olunmur).

---

## Error handling təkmilləşdirmə planı

| Prioritet | Action |
|-----------|--------|
| 🔴 | Global ErrorBoundary əlavə et |
| 🔴 | Production console.log-ları sil |
| 🔴 | Vahid `parseApiError()` utility |
| 🟡 | Query error UI-ya retry button |
| 🟡 | Network offline detection |
| 🟢 | Error monitoring (Sentry) integration |
| 🟢 | Structured logging service |

### Tövsiyə olunan parseApiError

```typescript
// utils/parseApiError.ts (tövsiyə)
export function parseApiError(error: unknown): string {
  if (!error) return "Naməlum xəta";
  if (typeof error === "object" && "error" in error) {
    return (error as ApiResponse<null>).error?.message || "Xəta baş verdi";
  }
  if (error instanceof Error) return error.message;
  return "Xəta baş verdi";
}
```
