# Code Quality və Improvement Sənədi

## Ümumi qiymətləndirmə

Layihə funksional admin paneldir, lakin kod keyfiyyəti baxımından **refactoring ehtiyacı** var. Əsas problemlər: böyük səhifə komponentləri, duplicated pattern-lər, inconsistent API response handling və debug log-lar.

---

## Təkrarlanan komponentlər

| Duplicate | Fayllar | Tövsiyə |
|-----------|---------|---------|
| `ImageWithFallback` | `ItemsPage.tsx`, `ProductDetailsPage.tsx` | Extract to `commons/ImageWithFallback.tsx` |
| CRUD page boilerplate | Categories, Brands, Discounts | `useCrudPage<T>()` custom hook |
| Theme conditional classes | 15+ komponent | CSS variables / `dark:` prefix |
| Response unwrap | Bütün səhifələr | Universal `unwrapApiData()` |
| Error toast pattern | Bütün mutations | `useMutationWithToast()` wrapper |
| Inline stat card | DashboardPage | Extract `StatCard` to commons |
| Inline status badge | DashboardPage | Extract `StatusBadge` to commons |

---

## Böyük / şişmiş komponentlər

| Fayl | Sətir | Problem | Tövsiyə |
|------|-------|---------|---------|
| `ProductDetailsPage.tsx` | ~849 | Həddindən artıq responsibility | Split: Info, Images, Variants, Actions |
| `CategoryAttributesPage.tsx` | ~764 | Attribute + value logic mixed | Separate components |
| `AddItemModal.tsx` | ~669 | Form + upload + variants | Sub-components |
| `DiscountsPage.tsx` | ~630 | Form + table + filters | Extract DiscountForm |
| `ItemsPage.tsx` | ~615 | Table + modals + mutations | Extract hooks |

**Hədəf:** Heç bir komponent 300 sətirdən çox olmamalıdır.

---

## State management problemləri

| Problem | Təsvir | Həll |
|---------|--------|------|
| Form state inconsistency | Formik (login) vs useState (CRUD) | Vahid approach |
| Response unwrap scatter | `(data as any)?.value \|\| data` | Central utility |
| Query key string literals | Magic strings everywhere | Query key factory |
| No optimistic updates | Slow UX on mutations | React Query optimistic |
| Auth expiration passive | Only checks, no proactive refresh | Refresh before expiry |
| Remember Me non-functional | UI checkbox does nothing | Implement or remove |

---

## API call dağınıqlığı

| Problem | Nümunə |
|---------|--------|
| Image upload in component | ProductDetailsPage direct `imagesApi.uploadImage` |
| Image URL building | 4+ different URL patterns |
| Sequential file upload | `addProductImagesFromFiles` for loop |
| Direct API in pages | Pages call API directly, no service layer |
| Missing error typing | `error: any` everywhere |

**Tövsiyə:** Service layer pattern:

```
pages/ → hooks/ (useProducts, useCategories) → api/ (productsApi)
```

---

## Refactor edilməli hissələr

### Prioritet 1 (Kritik)

1. **Environment config** — hardcoded API URL → env variables
2. **Production console.log removal** — apiClient, useAuth, auth.api
3. **parseApiError utility** — vahid error handling
4. **unwrapApiData universal adoption** — bütün səhifələrdə

### Prioritet 2 (Vacib)

5. **Route lazy loading** — App.tsx code splitting
6. **ProductDetailsPage split** — 4-5 sub-component
7. **ImageWithFallback extraction** — shared component
8. **Modal a11y** — focus trap, ARIA, escape key
9. **Password recovery API** — ForgotPassword, EnterOTP, ResetPassword
10. **Search debounce** — ItemsPage, CRUD pages

### Prioritet 3 (Yaxşılaşdırma)

11. **Generic CrudPage pattern** — reduce duplication
12. **Query key factory** — type-safe keys
13. **Role-based access control** — if business requires
14. **Test infrastructure** — Vitest + RTL
15. **ErrorBoundary** — global crash protection
16. **Mobile responsive sidebar** — hamburger menu
17. **i18n completion** — auth pages English → AZ

---

## Security riskləri

| Risk | Severity | Təsvir | Tövsiyə |
|------|----------|--------|---------|
| Token in localStorage | 🔴 Yüksək | XSS → token theft | httpOnly cookie (backend change) |
| API response console.log | 🔴 Yüksək | Sensitive data in console | Remove in production |
| No CSRF protection | 🟡 Orta | SPA + Bearer token — CSRF less relevant | Document decision |
| Hardcoded API URL | 🟡 Orta | Wrong env deployment | Environment variables |
| No Content Security Policy | 🟡 Orta | XSS mitigation | CSP headers |
| No input sanitization | 🟡 Orta | React auto-escapes, but rich text? | Validate on backend |
| Profile image external URL | 🟢 Aşağı | randomuser.me hardcoded | Use user avatar API |
| Remember Me checkbox | 🟢 Aşağı | Misleading UX | Remove or implement |
| No rate limiting (frontend) | 🟢 Aşağı | Login brute force | Backend rate limit |
| Forgot password no API | 🟡 Orta | Incomplete security flow | Complete implementation |

---

## TypeScript keyfiyyəti

| Aspekt | Vəziyyət |
|--------|----------|
| Strict mode | ✅ Enabled |
| `any` usage | ⚠️ Geniş istifadə (API responses, errors) |
| Type imports | ✅ `import type` istifadə olunur |
| API types | ✅ Domain types defined in api files |
| Unused vars | ✅ noUnusedLocals enabled |

**Tövsiyə:** `(data as any)` pattern-lərini generic typed helper-lərlə əvəz et.

---

## Code organization scorecard

| Aspekt | Score (1-5) | Qeyd |
|--------|-------------|------|
| Folder structure | 4 | Yaxşı organized |
| Component reusability | 3 | Commons yaxşı, pages heavy |
| State management | 3 | React Query good, forms inconsistent |
| API layer | 3 | Clean modules, inconsistent unwrap |
| Error handling | 2 | Decentralized, no boundary |
| Testing | 1 | No tests |
| Accessibility | 2 | Basic only |
| Performance | 2 | No code splitting |
| Security | 2 | Token storage concern |
| Documentation | 4 | İndi comprehensive docs var |
| i18n | 3 | AZ primary, partial EN |
| Type safety | 3 | Strict but many `any` |

**Overall: 2.7 / 5** — Functional MVP, production hardening needed.
