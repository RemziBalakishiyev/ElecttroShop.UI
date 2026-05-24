# Styling Sənədi

## Styling yanaşması

Layihə **Tailwind CSS v4** utility-first yanaşması ilə styled olunub. Styled Components, CSS Modules, SCSS **istifadə olunmur**.

### Stack

| Texnologiya | Versiya | Rol |
|-------------|---------|-----|
| Tailwind CSS | 4.1.16 | Utility classes |
| @tailwindcss/vite | 4.1.16 | Vite plugin |
| Custom CSS | minimal | Keyframes, @theme tokens |

### Konfiqurasiya

```typescript
// vite.config.ts
plugins: [react(), tailwindcss()]
```

Tailwind `@import "tailwindcss"` ilə `src/index.css`-də import olunur (ayrıca `tailwind.config.js` **yoxdur** — v4 `@theme` block istifadə edir).

---

## Global style-lar

### index.css

**Fayl:** `src/index.css`

```css
@import "tailwindcss";

@theme {
  /* Brand, neutral, background, feedback colors */
  /* Font family */
}

@keyframes slideIn { ... }
.toast-slide-in { animation: slideIn 0.3s ease-out forwards; }
```

**Məzmun:**
- CSS custom properties (design tokens)
- Toast animation keyframe

### App.css

**Fayl:** `src/App.css` — mövcuddur, lakin minimal/legacy. Əsas styling `index.css` və komponent class-larındadır.

### index.html

Google Fonts Inter import **dəqiqləşdirilməlidir** — `@theme`-də Inter reference var, lakin font link index.html-də yoxlanmalıdır.

---

## Theme faylları

| Fayl | Məqsəd |
|------|--------|
| `src/index.css` | Tailwind `@theme` tokens (CSS variables) |
| `src/core/config/theme.ts` | JS theme object (colors, fonts, spacing, shadow, borderRadius) |
| `src/core/context/ThemeContext.tsx` | Runtime light/dark switching |
| `src/utils/themeUtils.ts` | Theme helper utilities |
| `src/utils/cn.ts` | Class name merge utility |

### cn() utility

```typescript
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
```

Conditional class merging üçün istifadə olunur:
```tsx
className={cn("base-class", condition && "conditional-class", className)}
```

---

## Class naming qaydaları

| Pattern | Nümunə | Qeyd |
|---------|--------|------|
| Tailwind utilities | `flex items-center gap-3` | Dominant pattern |
| Semantic colors | `bg-primary-400`, `text-neutral-500` | Theme tokens |
| State variants | `hover:bg-primary-500` | Interactive states |
| Theme conditional | `theme === "light" ? "bg-white" : "bg-neutral-800"` | Manual dark mode |
| Component-scoped | Yoxdur | BEM/CSS Modules istifadə olunmur |

---

## Style organization

```
Styling layers:
1. @theme tokens (index.css)     → Global design tokens
2. theme.ts (JS object)          → Programmatic reference (az istifadə)
3. Component inline classes      → Tailwind utilities per component
4. ThemeContext conditional      → Light/dark overrides
```

**Pattern:** Hər komponent öz Tailwind class-larını inline yazar. Shared style abstraction yoxdur (styled wrapper components minimaldır).

---

## Komponent styling nümunələri

### Button

```typescript
const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg ...";
const variants = {
  primary: "bg-primary-400 text-white hover:bg-primary-500 ...",
  // ...
};
```

### Input (theme-aware)

```typescript
className={cn(
  "border rounded-lg px-3 py-2 text-sm ...",
  theme === "light"
    ? "border-neutral-300 bg-white text-neutral-900"
    : "border-neutral-700 bg-neutral-800 text-white",
  error && "border-error"
)}
```

### Card pattern (pages)

```tsx
className={cn(
  "rounded-xl border shadow-sm",
  theme === "light" ? "bg-white border-neutral-200" : "bg-neutral-800 border-neutral-700"
)}
```

---

## Təkrarlanan style problemləri

| Problem | Təsvir | Tövsiyə |
|---------|--------|---------|
| Theme conditional duplication | Hər komponentdə eyni light/dark if-else | CSS variables + `dark:` prefix |
| Card styling copy-paste | 10+ yerdə eyni card classes | `<Card>` wrapper component |
| Pagination light-only | `bg-white border-neutral-200` hardcoded | ThemeContext integration |
| theme.ts underused | JS theme object az istifadə olunur | CSS variables single source |
| index.css vs theme.ts duplication | Eyni rənglər 2 yerdə | Single source of truth |
| Status badge colors | Light-only, dark mode-da zəif contrast | Dark variants |

---

## Animation

| Animation | Fayl | İstifadə |
|-----------|------|----------|
| `slideIn` | index.css | Toast entrance |
| `animate-spin` | Tailwind built-in | Loading spinners |
| `animate-pulse` | Tailwind built-in | Skeleton loading (PromotionalBrands) |
| `animate-in fade-in` | Tailwind (?) | DashboardPage entrance |
| `transition-colors duration-300` | Tailwind | Theme switch |
| `group-hover:scale-110` | Tailwind | Product image hover |

---

## Path alias

`@/` alias vite.config.ts-də təyin olunub, lakin styling-də istifadə olunmur.

---

## Tövsiyələr

1. **Tailwind dark mode strategy** — `darkMode: 'class'` + `dark:` prefix (manual if-else əvəzinə)
2. **Shared layout components** — `<Card>`, `<PageHeader>`, `<SearchBar>`
3. **CSS variables** — theme.ts-ni CSS variables-a consolidate et
4. **Remove App.css** — istifadə olunmursa sil
5. **Inter font** — index.html-ə Google Fonts link əlavə et
