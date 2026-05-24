# Component System Sənədi

## Ümumi baxış

Layihədə **custom UI kit** (`components/commons/`) + **domain komponentləri** (`modals/`, `forms/`, `dashboard/`) strukturu var. Xarici UI kit (MUI, Ant Design və s.) istifadə olunmur.

## Reusable komponentlər (`components/commons/`)

### Button

**Fayl:** `src/components/commons/Button.tsx`

| Prop | Tip | Default | Təsvir |
|------|-----|---------|--------|
| `variant` | `"primary" \| "secondary" \| "outline" \| "danger"` | `"primary"` | Vizual variant |
| `loading` | `boolean` | — | Spinner göstərir, disabled edir |
| `icon` | `ReactNode` | — | Sol tərəfdə ikon |
| `...props` | `ButtonHTMLAttributes` | — | Native button props |

**İstifadə:** Bütün səhifələr, modal-lar, auth səhifələri

---

### Input

**Fayl:** `src/components/commons/Input.tsx`

| Prop | Tip | Təsvir |
|------|-----|--------|
| `label` | `string` | Label mətni |
| `error` | `string` | Xəta mesajı (qırmızı border + text) |
| `required` | `boolean` | Label-da `*` göstərir |
| `...props` | `InputHTMLAttributes` | Native input props |

**Xüsusiyyət:** `useTheme()` ilə dark/light styling

**İstifadə:** Login, Categories, Brands, Discounts, ProductDetails, FilterModal, AddItemModal

---

### Select

**Fayl:** `src/components/commons/Select.tsx`

| Prop | Tip | Təsvir |
|------|-----|--------|
| `label` | `string` | Label |
| `options` | `{ label: string; value: string }[]` | Seçimlər |
| `error` | `string` | Xəta mesajı |
| `placeholder` | `string` | Default: `"Select"` |
| `required` | `boolean` | Required marker |

**İstifadə:** FilterModal, DiscountsPage, AddItemModal, CategoryAttributesPage

---

### Textarea

**Fayl:** `src/components/commons/Textarea.tsx`

**İstifadə:** AddItemModal (məhsul təsviri)

---

### Checkbox

**Fayl:** `src/components/commons/Checkbox.tsx`

**İstifadə:** BrandsPage, DiscountsPage

---

### DateInput

**Fayl:** `src/components/commons/DateInput.tsx`

**İstifadə:** DiscountsPage (startDate, endDate)

---

### FileUpload

**Fayl:** `src/components/commons/FileUpload.tsx`

**İstifadə:** AddItemModal (məhsul şəkilləri)

---

### Modal

**Fayl:** `src/components/commons/Modal.tsx`

| Prop | Tip | Default | Təsvir |
|------|-----|---------|--------|
| `open` | `boolean` | — | Görünürlük |
| `title` | `string` | — | Başlıq |
| `onClose` | `() => void` | — | Bağlama callback |
| `width` | `string` | `"max-w-lg"` | Tailwind width class |

**Qeyd:** Backdrop click ilə bağlanmır; yalnız X düyməsi

**İstifadə:** Categories, Brands, Discounts, ProductDetails

---

### ConfirmationModal

**Fayl:** `src/components/commons/ConfirmationModal.tsx`

| Prop | Tip | Default | Təsvir |
|------|-----|---------|--------|
| `open` | `boolean` | — | Görünürlük |
| `title` | `string` | — | Başlıq |
| `message` | `string` | — | Mesaj |
| `variant` | `"danger" \| "warning" \| "info"` | `"danger"` | İkon rəngi |
| `confirmLabel` | `string` | i18n `common.confirm` | Təsdiq düyməsi |
| `cancelLabel` | `string` | i18n `common.cancel` | Ləğv düyməsi |
| `onConfirm` | `() => void` | — | Təsdiq callback |
| `onCancel` | `() => void` | — | Ləğv callback |
| `isLoading` | `boolean` | `false` | Loading state |

**z-index:** `z-[60]` (Modal-dan yuxarı)

**İstifadə:** Bütün CRUD səhifələri (delete confirm)

---

### SuccessModal

**Fayl:** `src/components/commons/SuccessModal.tsx`

**Status:** Mövcuddur, aktiv istifadə **dəqiqləşdirilməlidir** (CRUD səhifələr Toast istifadə edir)

---

### Table

**Fayl:** `src/components/commons/Table.tsx`

Generic table komponenti:

| Prop | Tip | Təsvir |
|------|-----|--------|
| `columns` | `Column<T>[]` | `{ key, label, sortable?, render? }` |
| `data` | `T[]` | Cədvəl datası |
| `selectable` | `boolean` | Checkbox sütunu |
| `selectedItems` | `Set<string>` | Seçilmiş ID-lər |
| `onSelectItem` | `(id) => void` | Tək seçim |
| `onSelectAll` | `(selected) => void` | Hamısını seç |
| `getItemId` | `(item) => string` | Default: `item.id` |
| `isLoading` | `boolean` | Loading state |

**Qeyd:** `sortable` prop UI göstərir, lakin sort logic **implement olunmayıb**

**İstifadə:** ItemsPage, CategoriesPage, BrandsPage, DiscountsPage

---

### Pagination

**Fayl:** `src/components/commons/Pagination.tsx`

| Prop | Tip | Təsvir |
|------|-----|--------|
| `currentPage` | `number` | Cari səhifə |
| `totalPages` | `number` | Ümumi səhifə |
| `itemsPerPage` | `number` | Səhifə ölçüsü |
| `totalItems` | `number` | Ümumi record |
| `onPageChange` | `(page) => void` | Səhifə dəyişikliyi |
| `onItemsPerPageChange` | `(size) => void` | Ölçü dəyişikliyi |

**Seçimlər:** 10, 25, 50, 100

---

### FilterModal

**Fayl:** `src/components/commons/FilterModal.tsx`

Məhsul filtri: kateqoriya, brend, min/max qiymət. Lookup API-lərdən options yükləyir.

| Prop | Tip |
|------|-----|
| `open`, `onClose`, `onApply` | Modal lifecycle |

**API:** `categoriesApi.getLookup()`, `brandsApi.getLookup()`

**İstifadə:** ItemsPage

---

### Toast / ToastContainer

**Fayllar:** `Toast.tsx`, `ToastContainer.tsx`

Toast provider vasitəsilə istifadə olunur (`useToast()`).

| Tip | Metod |
|-----|-------|
| success | `toast.success(message)` |
| error | `toast.error(message)` |
| info | `toast.info(message)` |
| warning | `toast.warning(message)` |

Default duration: 3000ms

---

## Domain komponentlər

### AddItemModal

**Fayl:** `src/components/modals/AddItemModal.tsx` (~669 sətir)

| Prop | Tip | Təsvir |
|------|-----|--------|
| `open` | `boolean` | Modal görünürlüyü |
| `onClose` | `() => void` | Bağlama |
| `onAdd` | `(data) => void` | Submit callback |
| `initialData` | `Product \| null` | Edit mode data |

**Daxili funksionallıq:**
- Kateqoriya/brend select (lookup API)
- Kateqoriya atributları (dynamic fields)
- Çoxlu şəkil upload/preview
- Variant idarəetməsi
- Create və edit mode

**İstifadə:** ItemsPage, ProductDetailsPage

---

### ImagePreviewModal

**Fayl:** `src/components/modals/ImagePreviewModal.tsx`

**İstifadə:** ItemsPage

---

### ProductVariantManager

**Fayl:** `src/components/forms/ProductVariantManager.tsx`

Variant CRUD UI bloku.

---

### ProductImageManager

**Fayl:** `src/components/forms/ProductImageManager.tsx`

Şəkil idarəetmə bloku.

---

### CategoryAttributeForm

**Fayl:** `src/components/forms/CategoryAttributeForm.tsx`

Kateqoriya atribut form bloku.

---

### DashboardChart

**Fayl:** `src/components/dashboard/DashboardChart.tsx`

Recharts AreaChart — revenue overview, period toggle.

---

### PromotionalBrands

**Fayl:** `src/components/dashboard/PromotionalBrands.tsx`

Promosional brend kartları — max 2 kart, product detail-ə navigate.

---

## Layout komponentləri

| Komponent | Fayl | Məqsəd |
|-----------|------|--------|
| `MainLayout` | `layouts/MainLayout.tsx` | Sidebar + Header + main |
| `Sidebar` | `layouts/Sidebar.tsx` | Nav + theme switcher |
| `Header` | `layouts/Header.tsx` | Search, notification, profile, logout |
| `AuthLayout` | `modules/auth/components/AuthLayout.tsx` | Split-screen auth layout |

---

## Core route komponentləri

| Komponent | Fayl | Məqsəd |
|-----------|------|--------|
| `ProtectedRoute` | `core/components/ProtectedRoute.tsx` | Auth tələb edir |
| `PublicRoute` | `core/components/PublicRoute.tsx` | Auth olmayan istifadəçilər üçün |

---

## UI Kit / Design System

Formal design system package yoxdur. Praktikada:

- **Tailwind utility classes** + `@theme` tokens (`index.css`)
- **Theme object** (`core/config/theme.ts`) — JS-də rəng/spacing referans
- **ThemeContext** — light/dark mode
- **cn()** utility — conditional class merge

---

## Təkrarlanan komponent problemləri

| Problem | Təsvir | Tövsiyə |
|---------|--------|---------|
| `ImageWithFallback` | ItemsPage və ProductDetailsPage-də duplicate | `components/commons/` altına çıxart |
| CRUD səhifə pattern | Categories, Brands, Discounts eyni struktur | Generic `CrudPage` hook/komponent |
| Inline table (Dashboard) | DashboardPage öz table-ını yazaır | `Table` komponentindən istifadə et |
| Modal form pattern | Native state vs Formik qarışıq | Vahid form approach |
| Theme conditional classes | Hər komponentdə `theme === "light" ? ...` | CSS variables və ya `dark:` prefix |

---

## Export barrel faylları

```typescript
// components/commons/index.ts
export { Button, Input, Select, Modal, Table, Pagination, FilterModal,
         SuccessModal, FileUpload, DateInput, Textarea, Checkbox };

// components/modals/index.ts
export { AddItemModal, ImagePreviewModal };

// components/forms/index.ts
export { ProductVariantManager, ProductImageManager, CategoryAttributeForm };
```
