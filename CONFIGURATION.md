# Environment və Configuration Sənədi

## Environment faylları

Repo-da 3 env faylı var: `.env` (default/local), `.env.development`, `.env.example`. `.env.production` yoxdur — Render-də deploy zamanı environment variable-lar birbaşa Render dashboard-da təyin olunur (bax: `BUILD_AND_DEPLOYMENT.md`).

| Fayl | İstifadə | Git-ə commit olunur? |
|------|----------|----------------------|
| `.env` | Local dev default | Bəli (real secret deyil, local backend URL-idir) |
| `.env.development` | `npm run dev` zamanı | Bəli |
| `.env.example` | Şablon — production dəyərləri nümunəsi | Bəli |

## API konfiqurasiyası

**Fayl:** `src/core/config/api.config.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL as string | undefined;

if (!API_BASE_URL && import.meta.env.PROD) {
  throw new Error("VITE_API_BASE_URL is required in production");
}

export const apiBaseUrl = API_BASE_URL ?? "";

const origin =
  ASSET_BASE_URL ?? (API_BASE_URL ? API_BASE_URL.replace(/\/api\/?$/, "") : "");

export const API_CONFIG = {
  BASE_URL: origin,
} as const;

export const getApiUrl = (endpoint: string): string => `${apiBaseUrl}${endpoint}`;
```

| Parametr | Mənbə | Təsvir |
|----------|-------|--------|
| `apiBaseUrl` | `VITE_API_BASE_URL` | Axios baseURL (`/api` daxil) — `apiClient.ts` bunu istifadə edir |
| `API_CONFIG.BASE_URL` | `VITE_ASSET_BASE_URL`, yoxdursa `VITE_API_BASE_URL`-dən `/api` çıxarılaraq derive olunur | Asset/image origin — `src/utils/imageUrl.ts` bunu istifadə edir |

**Qəsdən hardcoded fallback yoxdur.** Production-da `VITE_API_BASE_URL` yoxdursa, modul import zamanı throw edir — səhv/köhnə URL-in sükutla bundle-a düşməsinin qarşısını almaq üçün. Development-də isə `.env`/`.env.development` həmişə commit olunub, ona görə əməli olaraq fallback-a ehtiyac yoxdur.

---

## Faktiki environment variables

```env
# .env, .env.development (local dev — real .NET backend portu)
VITE_API_BASE_URL=https://localhost:44312/api
VITE_ASSET_BASE_URL=https://localhost:44312

# .env.example (production şablonu)
VITE_API_BASE_URL=https://api.smartal.net/api
VITE_ASSET_BASE_URL=https://api.smartal.net
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
| API URL | `.env`/`.env.development` → `https://localhost:44312` | Render env vars → `https://api.smartal.net` |
| Source maps | Vite default (enabled) | Generated |
| Console logs | API response log active | **Risk** — silinməlidir |
| Build output | — | `dist/` folder |
| Environment vars | `.env`, `.env.development` (commit olunub) | Render dashboard-da təyin olunur |

---

## Git ignore

**Fayl:** `.gitignore`

Standart Node/Vite ignore (node_modules, dist, .env variants). `.env` faylları git-ə daxil olmur.

---

## Konfiqurasiya checklist (production üçün)

- [x] `.env.development` / `.env.example` yaradılıb
- [x] `API_CONFIG.BASE_URL` və `apiBaseUrl` env variable-dan oxunur, hardcoded fallback yoxdur
- [ ] HTTPS sertifikat (localhost dev üçün)
- [ ] Proxy setup (dev CORS problemi üçün)
- [ ] Production console.log-ları sil/disable et
- [x] Render dashboard-da `VITE_API_BASE_URL` / `VITE_ASSET_BASE_URL` environment variable konfiqurasiya olunub (bax: `BUILD_AND_DEPLOYMENT.md`)
