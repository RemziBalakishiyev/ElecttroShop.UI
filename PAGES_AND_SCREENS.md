# Pages və Screens Sənədi

## Səhifə xülasəsi

| Səhifə | Route | Fayl | Sətir sayı (təxmini) |
|--------|-------|------|----------------------|
| Dashboard | `/` | `DashboardPage.tsx` | ~320 |
| Məhsul siyahısı | `/products` | `ItemsPage.tsx` | ~615 |
| Məhsul detalları | `/products/:id` | `ProductDetailsPage.tsx` | ~849 |
| Kateqoriyalar | `/categories` | `CategoriesPage.tsx` | ~437 |
| Kateqoriya atributları | `/categories/:categoryId/attributes` | `CategoryAttributesPage.tsx` | ~764 |
| Brendlər | `/brands` | `BrandsPage.tsx` | ~391 |
| Endirimlər | `/discounts` | `DiscountsPage.tsx` | ~630 |
| Login | `/login` | `LoginPage.tsx` | ~164 |
| Forgot Password | `/forgot-password` | `ForgotPasswordPage.tsx` | ~65 |
| Enter OTP | `/enter-otp` | `EnterOTPPage.tsx` | — |
| Reset Password | `/reset-password` | `ResetPasswordPage.tsx` | — |

---

## DashboardPage (`/`)

### Məqsəd
Admin panelin əsas səhifəsi — statistika kartları, revenue qrafiki, promosional brendlər, son sifarişlər və yeni məhsullar.

### Komponentlər
- `DashboardChart` — revenue area chart (Recharts)
- `PromotionalBrands` — promosional brend kartları
- Daxili: `StatCard`, `StatusBadge`

### API call-lar
| Query key | API | Funksiya |
|-----------|-----|----------|
| `["dashboard"]` | `dashboardApi.getDashboardData()` | `GET /Dashboard` |
| `["dashboardChart", period]` | `dashboardApi.getDashboardChart(period)` | `GET /Dashboard/chart` |
| `["promotional-brands"]` | `brandsApi.getPromotionalBrands()` | `GET /brands/promotional` |

### UI elementləri
- **Stat cards** — 4 ədəd (revenue, orders, products, customers)
- **Chart** — period toggle (daily/weekly/monthly)
- **Table** — son sifarişlər (inline HTML table)
- **List** — son məhsullar
- **Loading** — spinner
- **Error** — sadə error mesajı

---

## ItemsPage (`/products`)

### Məqsəd
Məhsulların siyahısı, axtarış, filtr, CRUD əməliyyatları, banner/featured idarəetməsi.

### Komponentlər
- `Button`, `Table`, `Pagination`, `FilterModal`
- `AddItemModal` — create/edit modal
- `ConfirmationModal` — silmə təsdiqi
- `ImagePreviewModal` — şəkil preview
- Daxili: `ImageWithFallback`

### API call-lar
| Əməliyyat | API |
|-----------|-----|
| Siyahı | `productsApi.getProducts(params)` — `GET /Products` |
| Silmə | `productsApi.deleteProduct(id)` — `DELETE /Products/:id` |
| Yaratma | `productsApi.createProduct(data)` — `POST /Products` |
| Yeniləmə | `productsApi.updateProduct(id, data)` — `PUT /Products/:id` |
| Banner | `setBanner` / `removeBanner` |
| Featured | `setFeatured` / `removeFeatured` |
| Şəkil | `imagesApi.uploadImage`, `buildProductImageIdsForSave` |

### UI elementləri
- **Search input** — `searchTerm` state
- **Filter modal** — kateqoriya, brend, qiymət aralığı
- **Table** — selectable, custom column render (şəkil, status, actions)
- **Pagination** — page, pageSize
- **Modals** — add/edit, delete confirm, image preview
- **Toast** — uğur/xəta bildirişləri

### Local state
`selectedItems`, `page`, `pageSize`, `searchTerm`, `activeFilters`, modal state-ləri

---

## ProductDetailsPage (`/products/:id`)

### Məqsəd
Tək məhsulun tam detallı görünüşü — məlumat, şəkillər, variantlar, banner/featured, redaktə/silmə.

### Komponentlər
- `Button`, `Input`, `Modal`, `ConfirmationModal`, `AddItemModal`
- Daxili: `ImageWithFallback`

### API call-lar
| Əməliyyat | API |
|-----------|-----|
| Detallar | `productsApi.getProductById(id)` — `GET /Products/:id` |
| Yeniləmə | `productsApi.updateProduct` |
| Silmə | `productsApi.deleteProduct` |
| Primary şəkil | `productsApi.setPrimaryImage` |
| Banner | `setBanner` / `removeBanner` |
| Featured | `setFeatured` / `removeFeatured` |
| Variant CRUD | `createProductVariant`, `updateProductVariant`, `deleteProductVariant` |
| Şəkil upload | `imagesApi.uploadImage`, `buildProductImageIdsForSave` |

### UI elementləri
- **Info cards** — qiymət, stok, SKU, kateqoriya, brend
- **Image gallery** — primary seçimi, preview
- **Variant table** — atribut kombinasiyaları
- **Action buttons** — Edit, Delete, Banner toggle, Featured toggle
- **Modals** — edit (AddItemModal), delete confirm, featured display order

### Xüsusiyyətlər
- `handleSaveProduct` — variant şəkilləri upload, imageIds build, update request
- Banner/featured local state sync (`useEffect`)

---

## CategoriesPage (`/categories`)

### Məqsəd
Kateqoriya CRUD — ad, slug, parent kateqoriya.

### Komponentlər
`Button`, `Table`, `Pagination`, `Input`, `Modal`, `ConfirmationModal`

### API call-lar
| Əməliyyat | API |
|-----------|-----|
| Siyahı | `categoriesApi.getCategories(params)` — `GET /categories` |
| Detallar | `categoriesApi.getCategoryById(id)` — edit zamanı |
| Yaratma | `categoriesApi.createCategory` — `POST /categories` |
| Yeniləmə | `categoriesApi.updateCategory` — `PUT /categories/:id` |
| Silmə | `categoriesApi.deleteCategory` — `DELETE /categories/:id` |

### UI elementləri
- Search, Table (selectable), Pagination
- CRUD Modal (native form state, Formik yox)
- Settings düyməsi → `/categories/:id/attributes`

---

## CategoryAttributesPage (`/categories/:categoryId/attributes`)

### Məqsəd
Seçilmiş kateqoriya üçün atribut və atribut dəyərlərinin idarəetməsi.

### Komponentlər
`Button`, `Input`, `Select`, `Modal`, `ConfirmationModal`

### API call-lar
| Əməliyyat | API |
|-----------|-----|
| Kateqoriya info | `categoriesApi.getCategoryById(categoryId)` |
| Atribut siyahısı | `categoriesApi.getCategoryAttributes(categoryId)` |
| Atribut CRUD | `createCategoryAttribute`, `updateCategoryAttribute`, `deleteCategoryAttribute` |
| Dəyər CRUD | `addAttributeValue`, `updateAttributeValue`, `deleteAttributeValue` |

### UI elementləri
- Back navigation
- Atribut kartları (accordion-style)
- 2 modal: atribut form, dəyər form
- Delete confirmation modals

---

## BrandsPage (`/brands`)

### Məqsəd
Brend CRUD — ad, promotional flag, display order.

### Komponentlər
`Button`, `Table`, `Pagination`, `Input`, `Checkbox`, `Modal`, `ConfirmationModal`

### API call-lar
| Əməliyyat | API |
|-----------|-----|
| Siyahı | `brandsApi.getBrands(params)` — `GET /brands` |
| Yaratma | `brandsApi.createBrand` — `POST /brands` |
| Yeniləmə | `brandsApi.updateBrand` — `PUT /brands/:id` |
| Silmə | `brandsApi.deleteBrand` — `DELETE /brands/:id` |

### UI elementləri
- Search, Table, Pagination
- Modal form: name, isPromotional, displayOrder

---

## DiscountsPage (`/discounts`)

### Məqsəd
Endirim CRUD — tip (Product/Brand/Category), hədəf, faiz, tarix aralığı.

### Komponentlər
`Button`, `Table`, `Pagination`, `Input`, `Select`, `DateInput`, `Checkbox`, `Modal`, `ConfirmationModal`

### API call-lar
| Əməliyyat | API |
|-----------|-----|
| Siyahı | `discountsApi.getDiscounts(params)` — `GET /discounts` |
| Yaratma | `discountsApi.createDiscount` — `POST /discounts` |
| Yeniləmə | `discountsApi.updateDiscount` — `PUT /discounts/:id` |
| Silmə | `discountsApi.deleteDiscount` — `DELETE /discounts/:id` |
| Lookup (form) | `productsApi.getProducts`, `brandsApi.getBrands`, `categoriesApi.getCategories` |

### UI elementləri
- Type filter, active filter
- Dynamic select (tipə görə product/brand/category)
- Date inputs (start/end)
- Table + Pagination

---

## Auth səhifələri

### LoginPage (`/login`)
- **Form:** Formik + Yup
- **API:** `authApi.login` via `useLogin` hook
- **Komponentlər:** `AuthLayout`, `Input`, `Button`
- **Redirect:** uğurdan sonra `/`

### ForgotPasswordPage
- **Status:** ⚠️ API inteqrasiyası yoxdur (`TODO: API çağırışı əlavə et`)
- **Flow:** email daxil et → `/enter-otp`

### EnterOTPPage
- **Status:** ⚠️ API inteqrasiyası yoxdur
- **Flow:** OTP daxil et → `/reset-password`

### ResetPasswordPage
- **Status:** ⚠️ API inteqrasiyası yoxdur
- **Flow:** yeni parol → `/login`

---

## Ümumi səhifə pattern-ləri

Bütün CRUD səhifələri eyni strukturu paylaşır:

```
Header (title + add button)
  ↓
Search bar
  ↓
Table (selectable, actions column)
  ↓
Pagination
  ↓
Modal (create/edit) + ConfirmationModal (delete)
```

**State pattern:** Local `useState` + React Query `useQuery`/`useMutation` + `useToast` feedback.
