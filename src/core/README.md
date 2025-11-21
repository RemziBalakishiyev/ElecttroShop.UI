# Auth API Integration

Bu modul React Query və Formik istifadə edərək Auth API inteqrasiyasını təmin edir.

## Struktur

```
src/core/
├── api/
│   ├── apiClient.ts      # Axios instance və interceptors
│   └── auth.api.ts       # Auth API funksiyaları
├── config/
│   └── api.config.ts    # API konfiqurasiyası
├── context/
│   └── AuthContext.tsx  # Auth state management
├── hooks/
│   └── useAuth.ts       # React Query hooks
├── types/
│   └── auth.types.ts     # TypeScript types
├── utils/
│   └── tokenStorage.ts  # Token storage utilities
└── providers/
    └── AppProviders.tsx # React Query və Auth providers
```

## İstifadə

### 1. Login

```tsx
import { useLogin } from "@/core/hooks/useAuth";

const { mutate: login, isPending, isError, error } = useLogin();

login({
  email: "user@example.com",
  password: "password123"
});
```

### 2. Auth Context

```tsx
import { useAuthContext } from "@/core/context/AuthContext";

const { user, isAuthenticated, logout } = useAuthContext();
```

### 3. Protected Routes

```tsx
import { ProtectedRoute } from "@/core/components/ProtectedRoute";

<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

## API Endpoints

- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh-token` - Token yeniləmə

## Token Management

Tokenlar avtomatik olaraq localStorage-da saxlanılır və bütün API çağırışlarında avtomatik əlavə olunur.

Access token müddəti bitdikdə, refresh token avtomatik istifadə olunur.

