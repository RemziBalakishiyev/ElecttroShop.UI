# Build və Deployment Sənədi

## Package manager

Layihə **npm** istifadə edir (`package-lock.json` mövcuddur).

```bash
npm install    # Dependencies quraşdır
```

Yarn/pnpm lock faylları **yoxdur**.

---

## npm script-ləri

**Fayl:** `package.json`

| Script | Komanda | Təsvir |
|--------|---------|--------|
| `dev` | `vite` | Development server (HMR) |
| `build` | `tsc -b && vite build` | TypeScript check + production build |
| `lint` | `eslint .` | ESLint yoxlama |
| `preview` | `vite preview` | Production build preview |

### Development

```bash
npm run dev
# → http://localhost:5173 (Vite default port)
```

### Production build

```bash
npm run build
# 1. tsc -b     → TypeScript compile check
# 2. vite build → dist/ folder generate
```

### Build preview

```bash
npm run build
npm run preview
# Local production preview
```

### Lint

```bash
npm run lint
```

---

## Build prosesi

```
Source (src/)
    ↓
TypeScript compile check (tsc -b)
    ↓
Vite bundling
    ├── @vitejs/plugin-react (JSX transform)
    ├── @tailwindcss/vite (CSS processing)
    └── Tree shaking + minification
    ↓
Output: dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...
```

### Build output

- **Folder:** `dist/`
- **Format:** Static files (SPA)
- **Hosting:** Any static file server (Nginx, Azure Static Web Apps, Vercel, Netlify, S3+CloudFront)

---

## Dependencies

### Production

| Package | Versiya | Ölçü təsiri |
|---------|---------|-------------|
| react + react-dom | 19.2 | Core |
| react-router-dom | 7.9 | Routing |
| @tanstack/react-query | 5.62 | Server state |
| axios | 1.7 | HTTP |
| formik + yup | 2.4 + 1.4 | Forms |
| i18next + react-i18next | 25.6 + 16.3 | i18n |
| recharts | 3.4 | Charts (bundle size) |
| lucide-react | 0.552 | Icons (tree-shakeable) |

### Development

| Package | Versiya |
|---------|---------|
| vite | 7.1 |
| typescript | 5.9 |
| tailwindcss | 4.1 |
| eslint | 9.36 |

---

## Deployment

**Repo-da CI/CD pipeline konfiqurasiyası yoxdur** (GitHub Actions, Dockerfile və s. tapılmadı).

### Render Static Site (aktiv deployment)

Admin panel Render-də Static Site kimi deploy olunur:

| Parametr | Dəyər |
|----------|-------|
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

**Environment Variables (Render dashboard-da):**

```
VITE_API_BASE_URL=https://api.smartal.net/api
VITE_ASSET_BASE_URL=https://api.smartal.net
```

- `VITE_API_BASE_URL` — bütün `/api/...` çağırışları üçün (`apiClient.ts`, `api.config.ts`).
- `VITE_ASSET_BASE_URL` — product image URL-ləri üçün (`src/utils/imageUrl.ts`). Backend Cloudinary-dən tam URL qaytardıqda bu dəyər istifadə olunmur (Cloudinary URL-i olduğu kimi göstərilir); yalnız köhnə/local storage `/api/images/{id}` tipli relative path-lər üçün lazımdır.

**Qeyd:** `src/core/config/api.config.ts`-də bu iki env var üçün hardcoded fallback URL saxlanılmır — əgər production-da environment variable set edilməyibsə, build zamanı `VITE_API_BASE_URL` üçün throw baş verir (bax: yuxarıdakı fayl). Bu, səhv/köhnə backend URL-in sükutla bundle-a düşməsinin qarşısını alır.

SPA fallback routing (aşağıda göstərilən) Render Static Site konfiqurasiyasında da `Rewrite Rule: /* → /index.html` kimi əlavə edilməlidir.

### Tövsiyə olunan deployment addımları (generic hosting)

#### Static hosting (generic)

```bash
npm ci
npm run build
# dist/ folder-i hosting-ə deploy et
```

#### SPA routing

Server-side fallback konfiqurasiya lazımdır — bütün route-lar `index.html`-ə yönləndirilməlidir:

```nginx
# Nginx nümunəsi
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Environment variables

Build zamanı inject:
```bash
VITE_API_BASE_URL=https://api.production.com npm run build
```

---

## Production build diqqət nöqtələri

| Mövzu | Təsvir | Action |
|-------|--------|--------|
| API URL | `VITE_API_BASE_URL` / `VITE_ASSET_BASE_URL` env var ilə idarə olunur, hardcoded fallback yoxdur | ✅ Həll edilib |
| Console logs | apiClient response log | Remove/disable |
| HTTPS | Backend HTTPS tələb | SSL sertifikat |
| CORS | Production domain whitelist | Backend config |
| Token security | localStorage | httpOnly cookie alternativ |
| Source maps | Vite default | Production-da disable optional |
| Bundle size | No code splitting | Lazy load pages |
| Cache headers | Static assets | CDN cache policy |

---

## Node.js tələbi

- **Minimum:** Node.js 18+
- **Type:** ES Modules (`"type": "module"` in package.json)

---

## Deployment checklist

- [ ] Environment variables konfiqurasiya et
- [ ] `npm run build` uğurla keçir
- [ ] `npm run preview` ilə test et
- [ ] SPA fallback routing konfiqurasiya et
- [ ] HTTPS setup
- [ ] API CORS production domain
- [ ] Console.log-ları production build-dən sil
- [ ] Error monitoring (Sentry və s.) — optional
