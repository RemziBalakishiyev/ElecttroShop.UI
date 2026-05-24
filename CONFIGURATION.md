# Environment və Configuration Sənədi

## Environment faylları

**Repo-da `.env` faylı yoxdur** (`.env`, `.env.local`, `.env.development` və s. tapılmadı).

README-də `.env` nümunəsi göstərilir, lakin faktiki implementasiya **hardcoded config** istifadə edir.

---

## API konfiqurasiyası

**Fayl:** `src/core/config/api.config.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: "https://localhost:44312",
  API_PREFIX: "/api",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REFRESH_TOKEN: "/auth/refresh-token",
    },
  },
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`;
};
```

| Parametr | Dəyər | Təsvir |
|----------|-------|--------|
| `BASE_URL` | `https://localhost:44312` | Backend server URL |
| `API_PREFIX` | `/api` | API route prefix |
| Full base | `https://localhost:44312/api` | Axios baseURL |

**Problem:** Environment-ə görə dəyişmir. Production/staging/dev üçün ayrı URL **konfiqurasiya olunmayıb**.

---

## Tövsiyə olunan environment variables

```env
# .env.development
VITE_API_BASE_URL=https://localhost:44312
VITE_API_PREFIX=/api

# .env.production
VITE_API_BASE_URL=https://api.tvstore.az
VITE_API_PREFIX=/api
```

### Vite-də istifadə

```typescript
// api.config.ts (tövsiyə)
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://localhost:44312",
  API_PREFIX: import.meta.env.VITE_API_PREFIX || "/api",
};
```

**Qeyd:** Vite yalnız `VITE_` prefix-li variable-ları client-ə expose edir.

---

## Theme konfiqurasiyası

**Fayl:** `src/core/config/theme.ts`

JS object — rəng, font, spacing, shadow, borderRadius. Runtime-da dəyişmir.

**Runtime theme:** `ThemeContext` + `localStorage("theme")` — `"light"` | `"dark"`

---

## i18n konfiqurasiyası

**Fayl:** `src/i18n.ts`

| Parametr | Dəyər |
|----------|-------|
| Default language | `az` |
| Fallback | `az` |
| Resources | `./locales/az/translation.json` |
| Detection | `i18next-browser-languagedetector` |

---

## TypeScript konfiqurasiyası

| Fayl | Məqsəd |
|------|--------|
| `tsconfig.json` | Root references |
| `tsconfig.app.json` | App source (`src/`) — strict mode |
| `tsconfig.node.json` | Vite config |

**Key settings (tsconfig.app.json):**
- `strict: true`
- `target: ES2022`
- `jsx: react-jsx`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

---

## Vite konfiqurasiyası

**Fayl:** `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
```

| Parametr | Dəyər | Təsvir |
|----------|-------|--------|
| Dev server port | 5173 (default) | Vite default |
| Path alias | `@` → `./src` | Import shortcut |
| Dedupe | react, react-dom | Duplicate prevention |

**Qeyd:** Proxy konfiqurasiyası **yoxdur** — API birbaşa `BASE_URL`-ə sorğu göndərir (CORS backend-dən həll olunmalıdır).

---

## ESLint konfiqurasiyası

**Fayl:** `eslint.config.js`

- ESLint 9 flat config
- TypeScript ESLint
- React Hooks plugin
- React Refresh plugin

---

## React Query konfiqurasiyası

**Fayl:** `src/core/providers/AppProviders.tsx`

```typescript
defaultOptions: {
  queries: {
    retry: 1,
    refetchOnWindowFocus: false,
  },
}
```

---

## Development vs Production fərqləri

| Aspekt | Development | Production |
|--------|-------------|------------|
| API URL | Hardcoded localhost | **Eyni** (problem!) |
| Source maps | Vite default (enabled) | Generated |
| Console logs | API response log active | **Risk** — silinməlidir |
| Build output | — | `dist/` folder |
| Environment vars | Yoxdur | Yoxdur |

---

## Git ignore

**Fayl:** `.gitignore`

Standart Node/Vite ignore (node_modules, dist, .env variants). `.env` faylları git-ə daxil olmur.

---

## Konfiqurasiya checklist (production üçün)

- [ ] `.env.development` / `.env.production` yarat
- [ ] `API_CONFIG.BASE_URL`-i env variable-a keçir
- [ ] HTTPS sertifikat (localhost dev üçün)
- [ ] Proxy setup (dev CORS problemi üçün)
- [ ] Production console.log-ları sil/disable et
- [ ] CI/CD environment secrets konfiqurasiya et
