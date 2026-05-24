# Authentication və Authorization Frontend Flow

## Ümumi baxış

Layihə **JWT-based authentication** istifadə edir: access token + refresh token. Authorization (RBAC) frontend-də **minimal səviyyədədir** — yalnız auth guard var, role-based UI/route restriction yoxdur.

---

## Login flow

```
┌─────────────┐     POST /auth/login      ┌─────────────┐
│  LoginPage  │ ─────────────────────────►│   Backend   │
│  (Formik)   │ ◄─────────────────────────│             │
└─────────────┘   accessToken, refreshToken, user
       │
       ▼
useLogin.onSuccess
       │
       ├── tokenStorage.setAccessToken()
       ├── tokenStorage.setRefreshToken()
       ├── tokenStorage.setExpiresAt()
       ├── tokenStorage.setUser()
       ├── setAuthState({ isAuthenticated: true, ... })
       └── navigate("/", { replace: true })
```

### LoginPage implementasiyası

**Fayl:** `src/modules/auth/pages/LoginPage.tsx`

- **Form:** Formik + Yup validation
- **Hook:** `useLogin(onSuccessCallback)`
- **Error display:** Inline error div (`loginMutation.isError`)
- **Loading:** Button `loading={loginMutation.isPending}`
- **Remember Me:** Checkbox var, lakin **funksional deyil** (token persist logic yoxdur)

### useLogin hook

**Fayl:** `src/core/hooks/useAuth.ts`

Response structure flexibility:
```typescript
// Wrapped: { isSuccess, value: { accessToken, ... } }
// Direct: { accessToken, refreshToken, ... }
```

Hər iki format handle olunur.

---

## Logout flow

```
Header → handleLogout()
    │
    ├── logout() → tokenStorage.clearAll() + authState reset
    └── navigate("/login", { replace: true })
```

**Qeyd:** Backend logout endpoint **çağırılmır** (token invalidate server-side yoxdur).

---

## Token storage

**Fayl:** `src/core/utils/tokenStorage.ts`

| Key (localStorage) | Məzmun |
|--------------------|--------|
| `accessToken` | JWT access token |
| `refreshToken` | JWT refresh token |
| `expiresAt` | Token bitmə vaxtı (ISO string) |
| `user` | JSON serialized User object |

### Methods

```typescript
tokenStorage.getAccessToken() / setAccessToken()
tokenStorage.getRefreshToken() / setRefreshToken()
tokenStorage.getExpiresAt() / setExpiresAt()
tokenStorage.getUser() / setUser()
tokenStorage.clearAll()
```

---

## Refresh token məntiqi

### 1. Axios response interceptor (401)

**Fayl:** `src/core/api/apiClient.ts`

- 401 alınanda `_retry` flag ilə bir dəfə refresh cəhdi
- Uğurlu → yeni token-lar save → original request retry
- Uğursuz → clearAll + `window.location.href = "/login"`

### 2. AuthContext expiration check

**Fayl:** `src/core/context/AuthContext.tsx`

- Hər 60 saniyədə `expiresAt` yoxlanılır
- Expired + refresh token yox → logout state
- **Qeyd:** Expired + refresh token var → **proaktiv refresh edilmir** (yalnız 401-də)

### 3. useRefreshToken hook

Manual refresh üçün mövcuddur, lakin aktiv istifadə **dəqiqləşdirilməlidir**.

---

## Session yoxlanması

### ProtectedRoute

```typescript
const { isAuthenticated } = useAuthContext();
if (!isAuthenticated) return <Navigate to="/login" replace />;
```

### isAuthenticated hesablanması

```typescript
isAuthenticated: !!accessToken && !!user
```

App mount zamanı localStorage-dan init olunur — səhifə refresh-dən sonra session qorunur.

### PublicRoute

Autentifikasiya olunmuş istifadəçini `/`-ə redirect edir.

---

## User model

**Fayl:** `src/core/types/auth.types.ts`

```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;      // Admin = 1, Agent = 2
  isActive: boolean;
  createdAt: string;
}
```

---

## Authorization (RBAC)

### Mövcud vəziyyət

| Feature | Status |
|---------|--------|
| Route guard (auth) | ✅ `ProtectedRoute` |
| Role-based routes | ❌ Yoxdur |
| Role-based UI visibility | ❌ Yalnız Header-da rol göstərilir |
| Permission-based actions | ❌ Yoxdur |

### Header-da rol göstərilməsi

```tsx
{user?.role === 1 ? t('roles.admin') : t('roles.agent')}
```

### Tövsiyə olunan RBAC implementasiyası

```typescript
// Nümunə (hazırda yoxdur)
const AdminRoute = ({ children }) => {
  const { user } = useAuthContext();
  if (user?.role !== UserRole.Admin) return <Navigate to="/" />;
  return children;
};
```

---

## Parol bərpası axını

| Addım | Route | API | Status |
|-------|-------|-----|--------|
| 1. Email daxil et | `/forgot-password` | — | ⚠️ TODO |
| 2. OTP daxil et | `/enter-otp` | — | ⚠️ TODO |
| 3. Yeni parol | `/reset-password` | — | ⚠️ TODO |
| 4. Login | `/login` | ✅ | Hazır |

**ForgotPasswordPage** kodu:
```typescript
// TODO: API çağırışı əlavə et
navigate("/enter-otp");
```

Backend endpoint-ləri **dəqiqləşdirilməlidir** (`API_REQUIREMENTS.md`-ə baxın).

---

## Auth flow diaqramı (tam)

```
                    ┌──────────────────┐
                    │   App mount      │
                    └────────┬─────────┘
                             │
                    localStorage oxu
                             │
              ┌──────────────┴──────────────┐
              │                             │
        token + user var              token/user yox
              │                             │
              ▼                             ▼
      isAuthenticated=true          isAuthenticated=false
              │                             │
              ▼                             ▼
      ProtectedRoute OK            ProtectedRoute → /login
              │
              ▼
      API request + Bearer token
              │
      ┌───────┴───────┐
      │               │
    200 OK          401
      │               │
      ▼               ▼
   Response      Refresh token
                      │
              ┌───────┴───────┐
              │               │
           Success         Fail
              │               │
         Retry request    /login redirect
```

---

## Security riskləri

| Risk | Təsvir | Severity |
|------|--------|----------|
| localStorage tokens | XSS ilə token oğurlana bilər | Orta-Yüksək |
| console.log responses | Token/data leak debug-da | Orta |
| No logout API | Token server-side invalidate olunmur | Aşağı |
| Hardcoded API URL | Environment separation yoxdur | Aşağı |
| Remember Me non-functional | UX misleading | Aşağı |
