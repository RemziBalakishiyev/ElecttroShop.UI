# Accessibility (A11y) Sənədi

## Ümumi qiymətləndirmə

Layihədə accessibility **sistemli şəkildə tətbiq olunmayıb**. Bəzi elementlərdə partial a11y var (label, focus ring), lakin WCAG 2.1 standartlarına uyğunluq **zəifdir**.

Formal a11y audit tool (axe, Lighthouse CI) **inteqrasiya olunmayıb**.

---

## Button accessibility

### Button komponenti

**Fayl:** `src/components/commons/Button.tsx`

| Feature | Status |
|---------|--------|
| Native `<button>` | ✅ |
| `disabled` state | ✅ |
| Focus ring | ✅ `focus:ring-2 focus:ring-offset-2` |
| Loading state | ⚠️ Spinner, text hidden — screen reader announce yox |
| `aria-busy` | ❌ |
| Icon-only buttons | ⚠️ Header logout: `title` var, `aria-label` yox |

### Sidebar navigation

```tsx
<button onClick={() => navigate(item.path)}>
  {item.icon}
  {item.label}
</button>
```

| Feature | Status |
|---------|--------|
| Keyboard accessible | ✅ (native button) |
| Active state visual | ✅ |
| `aria-current="page"` | ❌ Active item üçün yox |
| Focus visible | ✅ Browser default + Tailwind |

---

## Input accessibility

### Input komponenti

**Fayl:** `src/components/commons/Input.tsx`

| Feature | Status |
|---------|--------|
| Label association | ⚠️ `<label>` var, lakin `htmlFor` + `id` **yoxdur** |
| Error message | ✅ Text göstərilir |
| `aria-invalid` | ❌ Error zamanı set olunmur |
| `aria-describedby` | ❌ Error message link yox |
| Required indicator | ✅ Visual `*` |
| Placeholder | ✅ |

**Problem:** Label click focus etmir input-u (`htmlFor`/`id` missing).

### Select komponenti

Eyni label problemi — `htmlFor`/`id` association yoxdur.

### Header search input

```tsx
<input type="text" placeholder={t('header.search_placeholder')} />
```

| Feature | Status |
|---------|--------|
| Label | ❌ Yalnız placeholder (insufficient) |
| `aria-label` | ❌ |
| Associated label | ❌ |

---

## Modal accessibility

### Modal komponenti

**Fayl:** `src/components/commons/Modal.tsx`

| Feature | Status |
|---------|--------|
| Focus trap | ❌ |
| Escape key close | ❌ |
| `role="dialog"` | ❌ |
| `aria-modal="true"` | ❌ |
| `aria-labelledby` | ❌ (title var, associate olunmayıb) |
| Focus return on close | ❌ |
| Backdrop click close | ❌ (a11y baxımından neutral) |

### ConfirmationModal

Eyni problemlər + `z-[60]` overlay.

**Risk:** Modal açıq olanda keyboard user background elementlərə tab edə bilər.

---

## Form accessibility

### LoginPage (Formik)

| Feature | Status |
|---------|--------|
| Form labels | ✅ Input label prop |
| Validation errors | ✅ Field-level |
| Error announcement | ❌ `aria-live` region yox |
| Submit on Enter | ✅ Native form behavior |

### CRUD forms (native state)

| Feature | Status |
|---------|--------|
| Required validation | ❌ Frontend validation yox |
| Error association | ⚠️ Toast only (screen reader delay) |
| Fieldset/legend | ❌ Complex forms (AddItemModal) |

---

## Navigation accessibility

### Sidebar

| Feature | Status |
|---------|--------|
| `<nav>` element | ✅ |
| Landmark role | ✅ (implicit nav) |
| Skip to content link | ❌ |
| Keyboard navigation | ✅ (button tab order) |

### Route changes

| Feature | Status |
|---------|--------|
| Focus management on route change | ❌ |
| Page title update | ❌ (document.title static) |
| `aria-live` route announce | ❌ |

---

## Table accessibility

**Fayl:** `src/components/commons/Table.tsx`

| Feature | Status |
|---------|--------|
| Semantic `<table>` | ✅ |
| `<thead>` / `<tbody>` | ✅ |
| Column headers `<th>` | ✅ |
| Row selection checkbox | ⚠️ Label yox ("Select row") |
| Select all checkbox | ⚠️ Label yox |
| Sortable indicator | ⚠️ Visual only, `aria-sort` yox |
| Empty state | ✅ Text message |

---

## Image accessibility

| Pattern | Status |
|---------|--------|
| Product images `alt={name}` | ✅ |
| Profile avatar `alt="profile"` | ⚠️ Generic, user name olmalı |
| Decorative icons | ⚠️ `aria-hidden` yox (Lucide SVG) |
| Image error fallback | ✅ Visual fallback |

---

## Color contrast

| Element | Status |
|---------|--------|
| Primary button (white on primary-400) | ✅ Yaxşı |
| Light mode text | ✅ Generally good |
| Dark mode text | ✅ Generally good |
| Status badges (dark mode) | ❌ Light-only colors, contrast problem |
| Placeholder text | ⚠️ Yoxlanılmalı (neutral-400) |
| Error text (text-error) | ✅ |

---

## Keyboard navigation

| Feature | Status |
|---------|--------|
| Tab order logical | ✅ Generally |
| Focus visible | ✅ Tailwind focus rings (inputs, buttons) |
| Modal focus trap | ❌ |
| Dropdown keyboard | ⚠️ Native select (OK), custom dropdown yox |
| Escape to close modal | ❌ |

---

## A11y problem siyahısı (prioritet)

| Prioritet | Problem | Fix |
|-----------|---------|-----|
| 🔴 | Modal focus trap yox | `focus-trap-react` və ya manual |
| 🔴 | Label-input association yox | `htmlFor` + `id` |
| 🔴 | Modal ARIA attributes yox | `role="dialog"`, `aria-modal` |
| 🟡 | Skip to content link yox | `<a href="#main">` |
| 🟡 | Route change focus | `useEffect` focus main |
| 🟡 | document.title per page | `useEffect` + route |
| 🟡 | Header search no label | `aria-label` |
| 🟡 | Icon decorative | `aria-hidden="true"` on Lucide icons |
| 🟢 | Checkbox labels in table | `aria-label="Select item"` |
| 🟢 | Loading state announce | `aria-busy`, `aria-live` |
| 🟢 | Color contrast audit | Lighthouse/axe run |

---

## Tövsiyə olunan tool-lar

```bash
# Dev dependency
npm install -D @axe-core/react eslint-plugin-jsx-a11y

# Manual
# Chrome DevTools → Lighthouse → Accessibility
# axe DevTools browser extension
```
