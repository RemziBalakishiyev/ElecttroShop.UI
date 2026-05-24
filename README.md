# TV Store Admin Panel

**tvstore-admin** — Electronics Number One / TV Store e-ticarət platformasının **admin idarəetmə panelidir**. Mağaza operatorları və administratorlar bu panel vasitəsilə məhsullar, kateqoriyalar, brendlər, endirimlər və dashboard statistikalarını idarə edirlər.

## Məqsəd

Frontend layihəsi aşağıdakı biznes funksiyalarını təmin edir:

- İnventar (məhsul) idarəetməsi — CRUD, şəkil, variant, banner/featured
- Kateqoriya və atribut idarəetməsi
- Brend idarəetməsi (promotional brendlər daxil)
- Endirim idarəetməsi (məhsul/brend/kateqoriya səviyyəsində)
- Dashboard — statistika, qrafik, son sifarişlər və məhsullar
- Autentifikasiya — login, token refresh, parol bərpası axınları (qismən)

## İstifadəçi rolları

Backend `UserRole` enum-u frontend-də təyin olunub:

| Rol | Dəyər | Təsvir |
|-----|-------|--------|
| Admin | `1` | Administrator |
| Agent | `2` | Agent |

**Qeyd:** Rollar hazırda yalnız `Header`-da göstərilir. Route və ya UI element səviyyəsində role-based access control (RBAC) **tətbiq olunmayıb** — bütün autentifikasiya olunmuş istifadəçilər eyni səhifələrə daxil ola bilir.

## Əsas modullar

| Modul | Route | Təsvir |
|-------|-------|--------|
| Dashboard | `/` | Statistika, qrafik, promosional brendlər |
| Məhsullar | `/products`, `/products/:id` | Siyahı və detallı səhifə |
| Kateqoriyalar | `/categories` | Kateqoriya CRUD |
| Kateqoriya atributları | `/categories/:categoryId/attributes` | Atribut və dəyər idarəetməsi |
| Brendlər | `/brands` | Brend CRUD |
| Endirimlər | `/discounts` | Endirim CRUD |
| Auth | `/login`, `/forgot-password`, ... | Giriş və parol bərpası |

## Backend əlaqəsi

- **HTTP client:** Axios (`src/core/api/apiClient.ts`)
- **Base URL:** `https://localhost:44312/api` (`src/core/config/api.config.ts`)
- **Auth:** JWT Bearer token (access + refresh)
- **Response format:** `{ isSuccess, value, error }` wrapper (bəzi endpoint-lər birbaşa data qaytarır)

## Texnologiya stack

| Kateqoriya | Texnologiya |
|------------|-------------|
| Framework | React 19.2 |
| Dil | TypeScript 5.9 |
| Build | Vite 7.1 |
| Styling | Tailwind CSS 4.1 |
| Routing | React Router DOM 7.9 |
| Server state | TanStack React Query 5.62 |
| Global state | React Context API |
| Form | Formik 2.4 + Yup 1.4 |
| HTTP | Axios 1.7 |
| Chart | Recharts 3.4 |
| i18n | i18next (yalnız `az` locale) |
| İkonlar | Lucide React |

## Sürətli başlanğıc

```bash
npm install
npm run dev
```

Brauzer: `http://localhost:5173`

## Sənədləşdirmə indeksi

| Sənəd | Mövzu |
|-------|-------|
| [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) | Arxitektura və folder strukturu |
| [ROUTING.md](./ROUTING.md) | Route-lar və qorunma mexanizmi |
| [PAGES_AND_SCREENS.md](./PAGES_AND_SCREENS.md) | Səhifələr və funksionallıq |
| [COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md) | Komponent sistemi |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | State idarəetməsi |
| [API_INTEGRATION.md](./API_INTEGRATION.md) | API inteqrasiyası |
| [AUTHENTICATION_AUTHORIZATION_FRONTEND.md](./AUTHENTICATION_AUTHORIZATION_FRONTEND.md) | Auth flow |
| [FORMS_AND_VALIDATION.md](./FORMS_AND_VALIDATION.md) | Form və validasiya |
| [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) | UI/UX qaydaları |
| [STYLING.md](./STYLING.md) | Styling yanaşması |
| [CONFIGURATION.md](./CONFIGURATION.md) | Konfiqurasiya |
| [BUILD_AND_DEPLOYMENT.md](./BUILD_AND_DEPLOYMENT.md) | Build və deploy |
| [PERFORMANCE_REVIEW.md](./PERFORMANCE_REVIEW.md) | Performans analizi |
| [ERROR_HANDLING_AND_LOGGING.md](./ERROR_HANDLING_AND_LOGGING.md) | Xəta idarəetməsi |
| [TESTING.md](./TESTING.md) | Test vəziyyəti |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | Accessibility |
| [CODE_QUALITY_REVIEW.md](./CODE_QUALITY_REVIEW.md) | Kod keyfiyyəti |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Developer quick reference |

## Əlavə mövcud sənədlər

- `API_REQUIREMENTS.md` — Backend API tələbləri
- `src/core/README.md` — Auth API inteqrasiyası (qısa)
- `USER_SIDE_DOCUMENTATION.md` — İstifadəçi tərəfi sənədləri

---

**Status:** Layihə aktiv inkişaf mərhələsindədir. Production istifadəsi üçün auth parol bərpası axınları, environment konfiqurasiyası və test coverage tamamlanmalıdır.
