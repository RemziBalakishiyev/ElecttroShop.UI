# Routing Sənədi

## Router konfiqurasiyası

Routing **React Router DOM v7** ilə `src/App.tsx` faylında konfiqurasiya olunub. `BrowserRouter` `main.tsx`-də wrap edir.

```tsx
// main.tsx
<BrowserRouter>
  <AppProviders>
    <App />
  </AppProviders>
</BrowserRouter>
```

## Bütün route-lar

| Path | Tip | Layout | Səhifə | Qorunma |
|------|-----|--------|--------|---------|
| `/login` | Public | — (AuthLayout daxilində) | `LoginPage` | `PublicRoute` |
| `/forgot-password` | Public | AuthLayout | `ForgotPasswordPage` | `PublicRoute` |
| `/enter-otp` | Public | AuthLayout | `EnterOTPPage` | `PublicRoute` |
| `/reset-password` | Public | AuthLayout | `ResetPasswordPage` | `PublicRoute` |
| `/` | Protected | `MainLayout` | `DashboardPage` | `ProtectedRoute` |
| `/products` | Protected | `MainLayout` | `ItemsPage` | `ProtectedRoute` |
| `/products/:id` | Protected | `MainLayout` | `ProductDetailsPage` | `ProtectedRoute` |
| `/categories` | Protected | `MainLayout` | `CategoriesPage` | `ProtectedRoute` |
| `/categories/:categoryId/attributes` | Protected | `MainLayout` | `CategoryAttributesPage` | `ProtectedRoute` |
| `/brands` | Protected | `MainLayout` | `BrandsPage` | `ProtectedRoute` |
| `/discounts` | Protected | `MainLayout` | `DiscountsPage` | `ProtectedRoute` |
| `*` (catch-all) | Fallback | — | `Navigate → /` | — |

## Public route-lar

Public route-lar `PublicRoute` wrapper ilə qorunur:

```tsx
// src/core/components/PublicRoute.tsx
if (isAuthenticated) {
  return <Navigate to="/" replace />;
}
return <>{children}</>;
```

**Davranış:** Autentifikasiya olunmuş istifadəçi `/login` və ya digər auth səhifələrinə getməyə çalışsa, avtomatik `/`-ə yönləndirilir.

| Route | Status |
|-------|--------|
| `/login` | ✅ Tam inteqrasiya (API) |
| `/forgot-password` | ⚠️ UI hazırdır, API yoxdur (TODO) |
| `/enter-otp` | ⚠️ UI hazırdır, API yoxdur |
| `/reset-password` | ⚠️ UI hazırdır, API yoxdur |

## Protected route-lar

Protected route-lar `ProtectedRoute` wrapper ilə qorunur:

```tsx
// src/core/components/ProtectedRoute.tsx
if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}
return <>{children}</>;
```

**Autentifikasiya yoxlaması:** `AuthContext.isAuthenticated` — `accessToken` və `user` localStorage-dan oxunur.

## Role-based route-lar

**Yoxdur.** `UserRole` (Admin=1, Agent=2) tipi mövcuddur, lakin route səviyyəsində heç bir role check tətbiq olunmayıb. Bütün autentifikasiya olunmuş istifadəçilər bütün protected route-lara daxil ola bilir.

Rol yalnız `Header`-da göstərilir:

```tsx
{user?.role === 1 ? t('roles.admin') : t('roles.agent')}
```

## Layout əlaqəsi

```
Public routes:
  LoginPage / ForgotPasswordPage / ... → AuthLayout (split-screen)

Protected routes:
  ProtectedRoute → MainLayout → Page
                      ├── Sidebar (nav)
                      ├── Header (search, profile, logout)
                      └── <main>{children}</main>
```

**Qeyd:** `MainLayout` hər protected route-da ayrıca wrap olunur (nested layout route pattern istifadə olunmur):

```tsx
<Route path="/products" element={
  <ProtectedRoute>
    <MainLayout>
      <ItemsPage />
    </MainLayout>
  </ProtectedRoute>
} />
```

## Sidebar naviqasiya

| Sidebar label (i18n key) | Path | Active match |
|--------------------------|------|--------------|
| `sidebar.dashboard` | `/` | Exact |
| `sidebar.items` | `/products` | `startsWith('/products')` |
| `sidebar.categories` | `/categories` | `startsWith('/categories')` |
| `sidebar.brands` | `/brands` | Exact |
| `sidebar.discounts` | `/discounts` | Exact |

## Redirect və fallback

| Ssenari | Davranış |
|---------|----------|
| Naməlum URL (`*`) | `Navigate to="/" replace` |
| Protected route, auth yox | `Navigate to="/login" replace` |
| Public route, auth var | `Navigate to="/" replace` |
| Login uğurlu | `navigate("/", { replace: true })` |
| Logout | `navigate("/login", { replace: true })` |
| Token refresh uğursuz (401) | `window.location.href = "/login"` |
| Məhsul silindi (ProductDetails) | `navigate("/")` |

## Programmatic navigation istifadəsi

| Səhifə | Navigate target | Trigger |
|--------|-----------------|---------|
| `ItemsPage` | `/products/:id` | View/Eye düyməsi |
| `CategoriesPage` | `/categories/:id/attributes` | Settings düyməsi |
| `CategoryAttributesPage` | `/categories` | Back düyməsi |
| `ProductDetailsPage` | `/products` | Back düyməsi |
| `PromotionalBrands` | `/products/:id` | Kart klik |

## Route parametrləri

| Param | Tip | İstifadə olunduğu səhifə |
|-------|-----|--------------------------|
| `:id` | string (UUID) | `ProductDetailsPage` — `useParams<{ id: string }>()` |
| `:categoryId` | string (UUID) | `CategoryAttributesPage` — `useParams<{ categoryId: string }>()` |

## Tövsiyə olunan təkmilləşdirmələr

1. **Nested routes** — `MainLayout` + `ProtectedRoute` bir parent route altında birləşdirilsin
2. **Lazy loading** — səhifələr `React.lazy()` ilə yüklənsin
3. **Role-based guard** — `AdminRoute` komponenti əlavə edilsin (lazım olarsa)
4. **Breadcrumb** — dərin route-lar üçün (`/categories/:id/attributes`)
