# UI/UX və Design System Sənədi

## UI library-ləri

| Library | Rol | Qeyd |
|---------|-----|------|
| **Tailwind CSS 4** | Əsas styling | Utility-first |
| **Lucide React** | İkonlar | Sidebar, actions, status |
| **Recharts** | Qrafiklər | Dashboard revenue chart |
| **Custom components** | UI kit | `components/commons/` |

Xarici component library (MUI, Ant Design, Chakra) **istifadə olunmur**.

---

## Rəng sistemi

### Primary (Brand)

| Token | Hex | İstifadə |
|-------|-----|----------|
| `primary-50` | `#e6f0fa` | Hover bg, sidebar bg |
| `primary-100` | `#bfdbfe` | Border |
| `primary-400` | `#3b82f6` | **Əsas action rəngi** — buttons, active nav |
| `primary-500` | `#2563eb` | Hover |
| `primary-600` | `#1d4ed8` | Accent |

### Neutral

`neutral-50` → `neutral-900` — text, border, background hierarchy

### Feedback

| Token | Hex | İstifadə |
|-------|-----|----------|
| `success` | `#22c55e` | Toast success, status |
| `error` | `#ef4444` | Toast error, validation |
| `warning` | `#f59e0b` | Toast warning |
| `info` | `#3b82f6` | Toast info |

### Background

| Token | Hex | İstifadə |
|-------|-----|----------|
| `background-light` | `#ffffff` | Light mode cards |
| `background-sidebar` | `#e6f0fa` | Sidebar, auth left panel |
| `background-dark` | `#0f172a` | Dark mode base |

**Mənbə:** `src/index.css` (`@theme`) və `src/core/config/theme.ts`

---

## Typography

| Element | Class | Font |
|---------|-------|------|
| Page title | `text-2xl font-bold` | Inter |
| Section title | `text-lg font-bold` | Inter |
| Body | `text-sm` | Inter |
| Table header | `text-xs font-semibold uppercase tracking-wider` | Inter |
| Label | `text-sm font-medium` | Inter |

**Font family:** `'Inter', ui-sans-serif, system-ui, sans-serif`

---

## Spacing

Tailwind default spacing scale + theme object:

```typescript
// theme.ts
spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px" }
```

Layout spacing:
- Main content padding: `p-6`
- Card padding: `p-6`
- Modal padding: `p-6`
- Gap between sections: `space-y-6` / `space-y-8`

---

## Border radius

| Token | Dəyər | İstifadə |
|-------|-------|----------|
| `rounded-lg` | 8px | Buttons, inputs, cards |
| `rounded-xl` | 12px | Cards, modals |
| `rounded-full` | 9999px | Avatar, badges, notification dot |

---

## Layout pattern-ləri

### Admin layout (MainLayout)

```
┌──────────┬────────────────────────────────────┐
│          │  Header (h-16)                     │
│ Sidebar  ├────────────────────────────────────┤
│ (w-64)   │                                    │
│          │  Main content (p-6, overflow-y)    │
│          │                                    │
│ Theme    │                                    │
│ switch   │                                    │
└──────────┴────────────────────────────────────┘
```

### Auth layout (AuthLayout)

```
┌─────────────────┬─────────────────┐
│                 │                 │
│  Brand panel    │   Form area     │
│  (md:w-1/2)     │   (max-w-md)    │
│  bg-sidebar     │                 │
│                 │                 │
└─────────────────┴─────────────────┘
```

### CRUD səhifə layout

```
Title + Action button (flex justify-between)
  ↓
Search bar + Filter button
  ↓
Table card (rounded-xl border shadow-sm)
  ↓
Pagination (border-t)
```

### Dashboard layout

```
Title
  ↓
4-column stat grid (responsive: 1→2→4)
  ↓
Promotional brands (2-column)
  ↓
Chart + Recent orders (2/3) | Recent products (1/3)
```

---

## Dark/Light theme

**ThemeContext** ilə idarə olunur:

| Element | Light | Dark |
|---------|-------|------|
| Page bg | `bg-neutral-50` | `bg-neutral-950` |
| Card bg | `bg-white` | `bg-neutral-800` |
| Text primary | `text-neutral-900` | `text-white` |
| Text secondary | `text-neutral-500` | `text-neutral-400` |
| Border | `border-neutral-200` | `border-neutral-700` |
| Sidebar bg | `bg-background-sidebar` | `bg-neutral-900` |

**Switcher:** Sidebar altında Sun/Moon buttons

**Qeyd:** `@theme` dark variant tam istifadə olunmur — komponentlərdə manual `theme === "light" ? ... : ...` pattern dominantdır.

---

## Responsive design

| Breakpoint | Davranış |
|------------|----------|
| Default (mobile) | Single column grids |
| `md:` (768px) | Auth layout split, 2-col grids |
| `lg:` (1024px) | 4-col stat grid, 3-col dashboard split |

**Mobil sidebar:** Sidebar həmişə görünür (`w-64`) — **mobile hamburger menu yoxdur**.

**Responsive gap:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

---

## UI element istifadə qaydaları

### Modal

- Backdrop: `bg-black/40 backdrop-blur-sm`
- z-index: `z-50` (Modal), `z-[60]` (ConfirmationModal)
- Bağlama: X düyməsi (backdrop click **yox**)
- Width: default `max-w-lg`, AddItemModal daha geniş

### Toast

- Position: ToastContainer (fixed, top-right)
- Duration: 3000ms default
- Animation: `toast-slide-in` keyframe
- Types: success, error, info, warning

### Table

- Selectable rows: checkbox column
- Hover: `hover:bg-neutral-50`
- Selected: `bg-primary-50`
- Empty state: centered "no items" message
- Loading: centered spinner text

### Button variants

| Variant | İstifadə |
|---------|----------|
| `primary` | Əsas action (Save, Add, Login) |
| `secondary` | Secondary action |
| `outline` | Cancel, neutral action |
| `danger` | Delete confirm |

### Status badges (Dashboard)

```typescript
Paid: "bg-green-50 text-green-700"
Processing: "bg-blue-50 text-blue-700"
Pending: "bg-yellow-50 text-yellow-700"
```

**Qeyd:** Dark mode-da status badge-lər light-only rənglər istifadə edir.

---

## i18n

- **Default dil:** Azərbaycan (`az`)
- **Fayl:** `src/locales/az/translation.json`
- **Usage:** `const { t } = useTranslation()`
- **Auth səhifələri:** Partial English (Login "Welcome", Forgot Password)

---

## UI inconsistency və improvement yerləri

| Problem | Təsvir | Tövsiyə |
|---------|--------|---------|
| Mixed languages | Auth EN, admin AZ | Full i18n coverage |
| Dark mode partial | Status badges, Pagination light-only | `dark:` variants |
| Header search non-functional | Input var, logic yox | Implement or remove |
| Header notification dummy | Bell + red dot, no action | Implement or remove |
| Profile avatar hardcoded | randomuser.me URL | User avatar from API |
| Table sort UI only | Sortable icon, no logic | Implement or remove icon |
| Modal no backdrop close | UX friction | Add optional backdrop close |
| No mobile nav | Sidebar always visible | Hamburger + drawer |
| Chart hardcoded EN | "Revenue Overview" | i18n keys |
| Inconsistent card shadows | Some `shadow-sm`, some none | Design token standardization |
