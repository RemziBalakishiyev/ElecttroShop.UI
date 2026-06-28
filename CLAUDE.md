# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Type-check then build for production (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

There is no test suite configured in this project.

## Architecture

This is a React 19 + TypeScript admin panel for an electronics TV store, built with Vite and Tailwind CSS v4.

### Layer separation

```
src/
  core/           # Infrastructure (API client, auth, hooks, types, config)
  modules/auth/   # Auth-specific pages and components (login, OTP, reset password)
  pages/          # Route-level page components
  layouts/        # Shell components (MainLayout, Sidebar, Header)
  components/     # Reusable UI (commons/ and forms/ and modals/)
  utils/          # Pure utility/helper functions
  locales/az/     # Azerbaijani i18n strings (only language)
```

### Routing

All routes are in `src/App.tsx`. Auth routes (`/login`, `/forgot-password`, `/enter-otp`, `/reset-password`) are wrapped in `PublicRoute`. All admin routes are wrapped in `ProtectedRoute` + `MainLayout`. The fallback `*` redirects to `/`.

### API layer

- `src/core/api/apiClient.ts` — Axios instance pointed at `https://localhost:44312/api`. All requests go through this instance.
- The request interceptor attaches `Bearer <accessToken>` from `tokenStorage`.
- The response interceptor handles 401 by attempting a refresh token call; on failure it clears tokens and redirects to `/login`.
- Each domain has its own API module: `products.api.ts`, `categories.api.ts`, `brands.api.ts`, `discounts.api.ts`, `images.api.ts`, `dashboard.api.ts`, `auth.api.ts`.
- All API responses follow `ApiResponse<T> { isSuccess, value, error }`. Use `unwrapApiData<T>()` from `src/utils/apiResponse.ts` to extract `value` from wrapped responses.
- Paginated list responses use `PagedApiResponse<T>` which extends the envelope with `page`, `pageSize`, `totalCount`, etc.

### Auth

- Tokens (access, refresh, expiresAt, user) are stored in `localStorage` via `src/core/utils/tokenStorage.ts`.
- Auth state is managed in `AuthContext` (`src/core/context/AuthContext.tsx`). Read it via `useAuthContext()`.
- Login mutations live in `src/core/hooks/useAuth.ts` (`useLogin`, `useRefreshToken`).

### State management

- Server state: TanStack Query (`@tanstack/react-query`). Default config: `retry: 1`, `refetchOnWindowFocus: false`.
- UI/local state: `useState` in page components.
- Global contexts: `AuthContext`, `ThemeContext` (light/dark, persisted to localStorage), `ToastContext`.

### Product save flow

Products have a complex inline-attribute + variant system. The save utilities in `src/utils/productSave.ts` and `src/utils/productAttributes.ts` handle:

- **Inline attributes** — product-level attribute definitions sent inline with the product payload (not via a separate attributes endpoint). Validated for duplicate `attributeType` keys.
- **Variants** — combinations of attribute values. The `AttributeTypeRegistry` (`Map<key, canonicalType>`) ensures case-insensitive deduplication of attribute type names.
- **Concurrency** — `UpdateProductRequest` requires `rowVersion`. Detect `Product.ConcurrencyConflict` / `Entity.ConcurrencyConflict` error codes with `isConcurrencyConflictError()`.
- Entry points: `buildCreateProductPayload()` and `buildUpdateProductPayload()` in `src/utils/productSave.ts`.

### Forms

Formik + Yup are available. Forms in pages (e.g., product add/edit) use `AddItemModal` and `ProductDetailsPage`.

### UI components

Common reusable components are in `src/components/commons/` and exported from `src/components/commons/index.ts`: `Button`, `Input`, `Select`, `Modal`, `Table`, `Pagination`, `FilterModal`, `SuccessModal`, `FileUpload`, `DateInput`, `Textarea`, `Checkbox`. Use these instead of creating new ones.

### i18n

Only Azerbaijani (`az`) is supported. All UI strings go in `src/locales/az/translation.json`. Use `useTranslation()` from `react-i18next` in components.

### Styling

Tailwind CSS v4. Dark mode uses the `dark` class on `<html>`. Use `cn()` from `src/utils/cn.ts` for conditional class merging. Theme colors are defined in `src/core/config/theme.ts`.

## Key conventions from Cursor rules

- Never write API calls directly inside components — put them in `src/core/api/*.api.ts`.
- Don't use `any` in TypeScript without justification.
- Always handle loading, error, and empty states in UI.
- Do not add `console.log` to production code (the existing ones in `apiClient.ts` and `useAuth.ts` are known technical debt).
- When changing category on a product that has active variants, the frontend must validate and prompt the user to reset variants first.
- After each task, note changed files and any risks (responsive breakage, cache invalidation needed, etc.).
