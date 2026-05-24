# Testing Sənədi

## Ümumi vəziyyət

Layihədə **automated test infrastrukturu mövcud deyil**. Unit, integration və e2e test faylları tapılmadı.

| Test növü | Status |
|-----------|--------|
| Unit tests | ❌ Yoxdur |
| Integration tests | ❌ Yoxdur |
| E2E tests | ❌ Yoxdur |
| Visual regression | ❌ Yoxdur |
| Test CI pipeline | ❌ Yoxdur |

---

## Test framework

**Quraşdırılmayıb.** `package.json`-da test-related dependency yoxdur:

- Vitest — yox
- Jest — yox
- React Testing Library — yox
- Cypress / Playwright — yox
- MSW (Mock Service Worker) — yox

---

## Mövcud keyfiyyət yoxlaması

Yalnız ESLint mövcuddur:

```bash
npm run lint
```

**Fayl:** `eslint.config.js`

| Plugin | Məqsəd |
|--------|--------|
| `@eslint/js` | Base rules |
| `typescript-eslint` | TypeScript lint |
| `eslint-plugin-react-hooks` | Hooks rules |
| `eslint-plugin-react-refresh` | HMR compatibility |

**Qeyd:** `npm run lint` test əvəzinə statik analizdir — runtime behavior yoxlamır.

---

## Test script-ləri

| Script | Komanda | Status |
|--------|---------|--------|
| `test` | — | ❌ Təyin olunmayıb |
| `test:watch` | — | ❌ |
| `test:coverage` | — | ❌ |
| `lint` | `eslint .` | ✅ |

---

## Test coverage

**Coverage: 0%** — heç bir test yazılmayıb.

---

## Test çatışmazlıqları (prioritetli)

### 🔴 Kritik (business logic)

| Area | Nə test edilməli |
|------|------------------|
| Auth flow | Login success/fail, token storage, logout |
| ProtectedRoute | Auth/no-auth redirect |
| apiClient interceptor | 401 refresh, token retry |
| `unwrapApiData` | Response normalization |
| `tokenStorage` | get/set/clear operations |

### 🟡 Vacib (UI + integration)

| Area | Nə test edilməli |
|------|------------------|
| CRUD pages | Table render, pagination, modal open/close |
| AddItemModal | Form validation, submit |
| FilterModal | Filter apply/reset |
| Toast | Show/dismiss notifications |
| LoginPage | Formik validation (email, password) |

### 🟢 Arzuolunan (e2e)

| Flow | Tool tövsiyəsi |
|------|----------------|
| Login → Dashboard | Playwright |
| Product CRUD | Playwright |
| Category + Attributes | Playwright |
| Discount CRUD | Playwright |

---

## Tövsiyə olunan test setup

### 1. Vitest + React Testing Library

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```json
// package.json
"scripts": {
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

### 2. MSW (API mocking)

```bash
npm install -D msw
```

API modullarını mock edərək component test-ləri yazmaq.

### 3. Playwright (e2e)

```bash
npm install -D @playwright/test
```

---

## Test yazma prioritet planı

```
Phase 1: Utility unit tests
  → apiResponse.ts, tokenStorage.ts, cn.ts, parseApiError (future)

Phase 2: Hook tests
  → useLogin, useAuthContext

Phase 3: Component tests
  → Button, Input, Table, Modal, Pagination

Phase 4: Integration tests
  → LoginPage, ItemsPage (with MSW)

Phase 5: E2E tests
  → Critical user flows (Playwright)
```

---

## Manual test checklist

Automated test olmadığından manual test vacibdir:

- [ ] Login valid/invalid credentials
- [ ] Token refresh (expire token manually)
- [ ] Logout + redirect
- [ ] Product CRUD (create, edit, delete)
- [ ] Product images upload
- [ ] Product variants
- [ ] Banner/Featured toggle
- [ ] Category CRUD + attributes
- [ ] Brand CRUD (promotional)
- [ ] Discount CRUD (3 types)
- [ ] Dashboard data load
- [ ] Filter + search + pagination
- [ ] Dark/Light theme switch
- [ ] Responsive layout (mobile/tablet)
- [ ] Forgot password flow (UI only)
