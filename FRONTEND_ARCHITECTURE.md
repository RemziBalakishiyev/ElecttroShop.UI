# Frontend Arxitektura Sənədi

## Ümumi baxış

`tvstore-admin` **React + TypeScript + Vite** əsaslı SPA (Single Page Application)-dır. Arxitektura **layered + page-based** hibrid yanaşmadır: core infrastruktur ayrı layer-də, səhifələr `pages/` altında, auth modulu isə `modules/auth/` altında feature-based təşkil olunub.

```
┌─────────────────────────────────────────────────────────┐
│                      main.tsx                           │
│  BrowserRouter → AppProviders → App (Routes)            │
└─────────────────────────────────────────────────────────┘
         │                    │                │
         ▼                    ▼                ▼
   AppProviders          ProtectedRoute    PublicRoute
   (Query, Theme,        + MainLayout      + AuthLayout
    Toast, Auth)
         │
         ▼
   Pages / Components → API Layer (axios) → Backend
```

## Folder strukturu

```
tvstore-admin/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
└── src/
    ├── main.tsx                 # Entry point
    ├── App.tsx                  # Route konfiqurasiyası
    ├── App.css                  # (minimal/legacy)
    ├── index.css                # Tailwind + theme tokens
    ├── i18n.ts                  # i18next konfiqurasiyası
    │
    ├── pages/                   # Route səhifələri (page-based)
    │   ├── DashboardPage.tsx
    │   ├── ItemsPage.tsx
    │   ├── ProductDetailsPage.tsx
    │   ├── CategoriesPage.tsx
    │   ├── CategoryAttributesPage.tsx
    │   ├── BrandsPage.tsx
    │   └── DiscountsPage.tsx
    │
    ├── modules/                 # Feature modulları
    │   └── auth/
    │       ├── components/AuthLayout.tsx
    │       └── pages/           # Login, ForgotPassword, EnterOTP, ResetPassword
    │
    ├── layouts/                 # Layout komponentləri
    │   ├── MainLayout.tsx       # Sidebar + Header + main content
    │   ├── Sidebar.tsx
    │   └── Header.tsx
    │
    ├── components/
    │   ├── commons/             # Reusable UI kit
    │   ├── modals/              # Xüsusi modal-lar
    │   ├── forms/               # Mürəkkəb form komponentləri
    │   └── dashboard/           # Dashboard widget-ları
    │
    ├── core/                    # Infrastruktur layer
    │   ├── api/                 # API client + domain API modulları
    │   ├── config/              # api.config.ts, theme.ts
    │   ├── context/             # AuthContext, ThemeContext
    │   ├── components/          # ProtectedRoute, PublicRoute
    │   ├── hooks/               # useAuth (login/refresh mutations)
    │   ├── providers/           # AppProviders, ToastContext
    │   ├── types/               # auth.types.ts
    │   └── utils/               # tokenStorage.ts
    │
    ├── utils/                   # Ümumi utility-lər
    │   ├── cn.ts
    │   ├── apiResponse.ts
    │   └── themeUtils.ts
    │
    └── locales/az/translation.json
```

## Framework və library-lər

| Library | Versiya | Rol |
|---------|---------|-----|
| React | 19.2 | UI framework |
| React DOM | 19.2 | DOM render |
| React Router DOM | 7.9 | Client-side routing |
| @tanstack/react-query | 5.62 | Server state, cache, mutations |
| Axios | 1.7 | HTTP client |
| Formik | 2.4 | Form state (auth səhifələrində) |
| Yup | 1.4 | Schema validation |
| Tailwind CSS | 4.1 | Utility-first styling |
| i18next | 25.6 | Lokallaşdırma |
| Recharts | 3.4 | Dashboard qrafikləri |
| Lucide React | 0.552 | İkonlar |

## Layer/module yanaşması

### 1. Presentation Layer
- **Pages** — route ilə birbaşa əlaqəli ekranlar
- **Layouts** — `MainLayout` (admin), `AuthLayout` (auth səhifələri)
- **Components** — reusable UI və domain-specific komponentlər

### 2. Application Layer
- **Context providers** — Auth, Theme, Toast
- **Custom hooks** — `useLogin`, `useRefreshToken`, `useAuthContext`, `useTheme`, `useToast`
- **Route guards** — `ProtectedRoute`, `PublicRoute`

### 3. Data Layer
- **API modulları** — domain-ə görə bölünmüş (`products.api.ts`, `categories.api.ts`, ...)
- **apiClient** — mərkəzi Axios instance, interceptor-lar
- **React Query** — cache, refetch, mutation lifecycle

### 4. Infrastructure Layer
- **Config** — API base URL, theme tokens
- **Utils** — `tokenStorage`, `unwrapApiData`, `cn`

## Komponent təşkili qaydaları

| Qovluq | Məqsəd | Nümunə |
|--------|--------|--------|
| `components/commons/` | Generic, layihə üzrə reusable UI | `Button`, `Input`, `Table` |
| `components/modals/` | Biznes modal-ları | `AddItemModal` |
| `components/forms/` | Mürəkkəb form blokları | `ProductVariantManager` |
| `components/dashboard/` | Dashboard widget-ları | `DashboardChart` |
| `modules/auth/` | Auth feature izolyasiyası | `LoginPage`, `AuthLayout` |
| `pages/` | Route səhifələri | `ItemsPage` |

**Export pattern:** `components/commons/index.ts` barrel export istifadə edir. Modals və forms üçün ayrıca `index.ts` faylları var.

## Shared/common hissələr

| Hissə | Fayl | İstifadə |
|-------|------|----------|
| Class merge | `utils/cn.ts` | Tailwind class birləşdirmə |
| API unwrap | `utils/apiResponse.ts` | `{ value: T }` response normalizasiyası |
| Token storage | `core/utils/tokenStorage.ts` | localStorage wrapper |
| Theme hook | `core/context/ThemeContext.tsx` | Light/dark mode |
| Toast sistemi | `core/providers/ToastContext.tsx` | Global notification |
| i18n | `i18n.ts` + `locales/az/` | Azərbaycan dili |

## Path alias

`vite.config.ts`-də `@` alias `./src`-yə map olunub, lakin kod bazasının əksəriyyəti **relative import** istifadə edir.

```typescript
// vite.config.ts
resolve: {
  alias: { "@": path.resolve(__dirname, "./src") }
}
```

## Feature-based vs page-based

| Yanaşma | Harada | İzah |
|---------|--------|------|
| **Page-based** | `src/pages/` | Əsas CRUD səhifələri birbaşa route-a map olunur |
| **Feature-based** | `src/modules/auth/` | Auth modulu komponent + səhifə + layout ilə izolyasiya olunub |
| **Domain API** | `src/core/api/*.api.ts` | Backend resurslarına görə modul bölünməsi |

**Nəticə:** Layihə tam feature-sliced deyil; auth modulu istisna olmaqla, biznes məntiqi əsasən səhifə komponentlərinin içindədir (`ItemsPage`, `ProductDetailsPage` və s.).

## Provider hierarchy

```tsx
// main.tsx
<BrowserRouter>
  <AppProviders>           // QueryClient → Theme → Toast → Auth
    <App />                // Routes
  </AppProviders>
</BrowserRouter>
```

## TypeScript konfiqurasiyası

- **Strict mode:** aktiv (`strict: true`)
- **Target:** ES2022
- **JSX:** `react-jsx`
- **Module resolution:** bundler

## Arxitektura qeydləri

1. **Biznes məntiqi səhifələrdə cəmlənib** — `ProductDetailsPage.tsx` ~850 sətir; refactor üçün ayrılma tövsiyə olunur.
2. **Global state minimaldır** — yalnız Auth, Theme, Toast Context istifadə olunur.
3. **Server state React Query ilə idarə olunur** — Redux/Zustand yoxdur.
4. **Code splitting yoxdur** — bütün səhifələr `App.tsx`-də statik import olunur.
