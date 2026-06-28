# Master UI QA Report

## Executive Summary
- **Overall verdict:** PARTIAL — Core flows work but multiple validation gaps and API mismatches exist
- **Admin status:** PARTIAL — Login, navigation, lists, and detail pages work; forms lack required-field validation
- **User status:** PARTIAL — Home/listing/detail/cart work; 2 missing API endpoints, price formatting bug, footer link bug
- **Critical blockers:** FE-001 (product form bypasses validation → API 400), FE-002/003 (category/brand same), FE-012 (user home calls wrong `/banners` endpoint → 404)
- **Total issues:** 19
- **Frontend issues:** 16
- **Backend issues:** 0
- **Contract/API issues:** 1
- **Data/environment issues:** 1
- **Unknown / needs investigation:** 1

---

## Environment
- **Admin URL:** http://localhost:5173
- **User URL:** http://localhost:5174
- **Backend URL:** https://localhost:44312/api
- **Browser:** Chromium (Playwright MCP)
- **Date:** 2026-06-27
- **Test users:** admin@electroshop.az / Admin123! (Admin role)

---

## Test Coverage Matrix

| Area | Case | Result | Owner if failed | Notes |
|---|---|---|---|---|
| Admin / Auth | Login page loads | PASS | — | Page renders; redirects authenticated user away |
| Admin / Auth | Login empty submit | PASS | — | Shows AZ error messages, no API call |
| Admin / Auth | Login invalid email | PASS | — | "Email formatı düzgün deyil" |
| Admin / Auth | Login short password | PASS | — | "Şifrə ən azı 6 simvol olmalıdır" |
| Admin / Auth | Successful login | PASS | — | POST /api/auth/login → 200 |
| Admin / Auth | Logout | PASS | — | Session cleared, redirect to /login |
| Admin / Auth | Login page i18n | FAIL | Frontend | "Welcome", "Email Address", "Password", "Login" in English |
| Admin / Dashboard | Page loads | PASS | — | All 4 stats cards visible |
| Admin / Dashboard | API calls | PASS | — | /Dashboard, /brands/promotional, /Dashboard/chart → 200 |
| Admin / Dashboard | "Revenue Overview" i18n | FAIL | Frontend | English text in AZ-only app |
| Admin / Dashboard | Chart period buttons | FAIL | Frontend | "Daily", "Weekly", "Monthly" in English |
| Admin / Sidebar | Navigation | PASS | — | All 6 links work correctly |
| Admin / Theme | Dark/light toggle | PASS | — | `.dark` class added/removed on `<html>` |
| Admin / Products | List loads | PASS | — | GET /api/Products?page=1&pageSize=10 → 200 |
| Admin / Products | Search | PASS | — | &searchTerm= param sent correctly → 200 |
| Admin / Products | Pagination | PASS | — | Controls disabled correctly (single page) |
| Admin / Products | "Statuslar" i18n | FAIL | Frontend | "Featured", "Banner" labels in English |
| Admin / Products | Add form: empty submit | FAIL | Frontend | No required-field validation; POST /api/Products → 400 |
| Admin / Products | Add form: /categories//attributes | FAIL | Frontend | 404 — empty categoryId leaked to API |
| Admin / Products | Add form: "Choose File" | FAIL | Frontend | Native file input label in English |
| Admin / Products | Add form: "Select" dropdowns | FAIL | Frontend | Default option "Select" in English |
| Admin / Product Detail | Page loads | PASS | — | GET /api/Products/{id} → 200 |
| Admin / Product Detail | "Featured" button i18n | FAIL | Frontend | "Featured olaraq təyin et" — partially English |
| Admin / Product Detail | Date format | FAIL | Frontend | Shows "2026 M06 27" — "M" prefix on month |
| Admin / Categories | List loads | PASS | — | GET /api/categories → 200 |
| Admin / Categories | List vs lookup count | FAIL | Unknown | 2 in list vs 8 in product dropdown |
| Admin / Categories | Add form: empty submit | FAIL | Frontend | No client validation; POST /api/categories → 400 |
| Admin / Brands | List loads | PASS | — | GET /api/brands → 200, 10 brands |
| Admin / Brands | Add form: empty submit | FAIL | Frontend | No client validation; POST /api/brands → 400 |
| Admin / Discounts | List loads | PASS | — | GET /api/discounts → 200 |
| Admin / Discounts | Filters | PASS | — | Type/status filter dropdowns in AZ |
| Admin / Discounts | Add form: empty submit | PARTIAL | Frontend | Blocked but no visible error shown |
| Admin / Discounts | Add form: "Select" / date i18n | FAIL | Frontend | "Select" and "dd/mm/yyyy" in English |
| Admin / Popular Products | Page loads | PASS | — | /api/Products/popular + /api/Products → 200 |
| Admin / Popular Products | 4 slots displayed | PASS | — | Correct products shown |
| Admin / Popular Products | Product descriptions | FAIL | Data/Env | "Təsvir yoxdur" on all; s25 ultra has wrong description |
| User / Home | Page loads | PARTIAL | — | Renders but 2 console errors |
| User / Home | /api/products/banners | FAIL | Frontend | 404 — wrong plural; /api/products/banner → 200 |
| User / Home | /api/products/discounted | FAIL | API Contract | 404 — endpoint does not exist on backend |
| User / Home | Price format | FAIL | Frontend | "AZN1924.9923" — no space, 4 decimals |
| User / Home | Popular products price | FAIL | Frontend | Shows "Qiymət sorğu ilə" instead of actual price |
| User / Home | "Discounts up to -50%" | FAIL | Frontend | English heading |
| User / Products | Listing loads | PASS | — | All API calls → 200, no errors |
| User / Product Detail | Page loads | PASS | — | GET /api/products/{id} → 200 |
| User / Product Detail | Breadcrumb | PASS | — | Category/brand correctly shown |
| User / Login | Page in AZ | PASS | — | All labels in Azerbaijani |
| User / Login | Empty submit validation | PASS | — | AZ messages shown, no API call |
| User / Login | Footer links | FAIL | Frontend | All footer links resolve to current page URL |
| User / Cart | Page loads | PASS | — | No errors, renders correctly |

---

## Frontend Problems

### FE-001 — Product Add Form: No Required-Field Validation Before API Submit
- **Severity:** Critical
- **Page:** /products (AddItemModal)
- **Action:** Open "Məhsul əlavə et" → click "Əlavə et" with all fields empty
- **Expected:** Client-side validation blocks submit and shows errors for required fields (name, SKU, price, category, brand, stock)
- **Actual:** `validateProductFormForSave()` only validates inline attributes/variants/category-change — skips basic required fields entirely. Form submits empty values to API → `POST /api/Products → 400`. No field-level error UI shown.
- **Evidence:**
  - Console: `[ERROR] Failed to load resource: the server responded with a status of 400 () @ https://localhost:44312/api/Products`
  - Network: `[POST] https://localhost:44312/api/Products => [400]`
- **Why this is Frontend:** Frontend sent invalid (empty-field) request without prior validation. Backend correctly rejected it.
- **Probable files/components:**
  - `src/utils/productSave.ts:45` — `validateProductFormForSave()` — missing basic field checks
  - `src/components/modals/AddItemModal.tsx:339` — `handleSubmit()`
- **Suggested frontend fix:** Add at the top of `validateProductFormForSave()`:
  ```ts
  if (!formData.itemName?.trim()) return { valid: false, message: 'Məhsul adı tələb olunur' };
  if (!formData.category) return { valid: false, message: 'Kateqoriya seçilməlidir' };
  if (!formData.manufacturer) return { valid: false, message: 'Brend seçilməlidir' };
  if (!formData.price || Number(formData.price) <= 0) return { valid: false, message: 'Düzgün qiymət daxil edin' };
  if (formData.amount === '' || Number(formData.amount) < 0) return { valid: false, message: 'Stok miqdarı daxil edin' };
  ```
- **Retest steps:** Open add product modal → click submit with empty fields → validation toast appears, no API call made.

---

### FE-002 — Category Add Form: No Client-Side Validation Before API Submit
- **Severity:** Major
- **Page:** /categories
- **Action:** Click "Kateqoriya əlavə et" → click "Yarat" with empty name
- **Expected:** "Kateqoriya Adı" required field validated before API call
- **Actual:** `POST /api/categories → 400`. `console.error: Failed to save category`.
- **Evidence:**
  - Console: `[ERROR] 400 @ /api/categories`, `[ERROR] Failed to save category: {...} @ CategoriesPage.tsx:63`
  - Network: `[POST] https://localhost:44312/api/categories => [400]`
- **Why this is Frontend:** No validation guard before mutation call.
- **Probable files/components:** `src/pages/CategoriesPage.tsx` — form submit handler (~line 56-74)
- **Suggested frontend fix:** `if (!formData.name.trim()) { toast.error('Kateqoriya adı tələb olunur'); return; }` before mutation.
- **Retest steps:** Open category add modal → submit empty → error shown, no API call.

---

### FE-003 — Brand Add Form: No Client-Side Validation Before API Submit
- **Severity:** Major
- **Page:** /brands
- **Action:** Click "Brend əlavə et" → click "Yarat" with empty name
- **Expected:** "Brend Adı" required field validated before API call
- **Actual:** `POST /api/brands → 400`. `console.error: Failed to save brand`.
- **Evidence:**
  - Console: `[ERROR] 400 @ /api/brands`, `[ERROR] Failed to save brand: {...} @ BrandsPage.tsx:62`
  - Network: `[POST] https://localhost:44312/api/brands => [400]`
- **Why this is Frontend:** Same pattern as FE-002.
- **Probable files/components:** `src/pages/BrandsPage.tsx` — form submit handler
- **Suggested frontend fix:** `if (!formData.name.trim()) { toast.error('Brend adı tələb olunur'); return; }` before mutation.
- **Retest steps:** Open brand add modal → submit empty → error shown, no API call.

---

### FE-004 — Admin Login Page: All UI Text in English
- **Severity:** Minor
- **Page:** /login (Admin, http://localhost:5173/login)
- **Action:** Navigate to login page after logout
- **Expected:** All text in Azerbaijani (consistent with rest of admin)
- **Actual:** Heading "Welcome 👋", subtitle "Please login here", field labels "Email Address" / "Password" / "Remember Me", submit button "Login" — all in English.
- **Evidence:** Login page snapshot — all listed UI strings in English.
- **Why this is Frontend:** Hardcoded English strings in the auth component; i18n keys not used.
- **Probable files/components:** `src/modules/auth/pages/LoginPage.tsx`
- **Suggested frontend fix:** Use `useTranslation()` and replace with `t()` calls. Add AZ translations to `src/locales/az/translation.json`: `auth.welcome = "Xoş gəlmisiniz 👋"`, `auth.subtitle = "Hesabınıza daxil olun"`, `auth.email = "E-poçt ünvanı"`, `auth.password = "Şifrə"`, `auth.remember_me = "Məni xatırla"`, `auth.login = "Daxil ol"`.
- **Retest steps:** Log out → navigate to /login → all text in Azerbaijani.

---

### FE-005 — Add Product Modal: "Choose File" and "Select" Options in English
- **Severity:** Minor
- **Page:** /products (AddItemModal)
- **Action:** Open "Məhsul əlavə et"
- **Expected:** File upload and dropdown placeholder text in Azerbaijani
- **Actual:** File upload button shows native "Choose File". Category, Brand, Currency dropdowns show "Select" as default placeholder option.
- **Evidence:** Snapshot shows `button "Choose File"`, `option "Select" [selected]` in multiple dropdowns.
- **Why this is Frontend:** Native `<input type="file">` label not overridden; "Select" placeholder hardcoded in English.
- **Probable files/components:** `src/components/commons/FileUpload.tsx`, `src/components/commons/Select.tsx`
- **Suggested frontend fix:** In FileUpload: wrap native input in a `<label>` with translated text "Fayl seçin". In Select: use `t('common.select_placeholder')` = "Seçin" for the default/empty option.
- **Retest steps:** Open add product modal → file upload and all dropdowns show Azerbaijani text.

---

### FE-006 — Dashboard Chart: "Revenue Overview" / Period Buttons in English
- **Severity:** Minor
- **Page:** / (Dashboard)
- **Action:** View dashboard
- **Expected:** Chart section fully in Azerbaijani
- **Actual:** `heading "Revenue Overview"`, `button "Daily"`, `button "Weekly"`, `button "Monthly"` all in English.
- **Evidence:** Dashboard snapshot shows these exact English strings.
- **Why this is Frontend:** Hardcoded English strings in the chart component.
- **Probable files/components:** `src/components/dashboard/DashboardChart.tsx`
- **Suggested frontend fix:** Replace with `t('dashboard.revenue_overview')` = "Gəlir İcmalı", `t('dashboard.daily')` = "Günlük", `t('dashboard.weekly')` = "Həftəlik", `t('dashboard.monthly')` = "Aylıq".
- **Retest steps:** Dashboard chart heading and period buttons should display Azerbaijani text.

---

### FE-007 — Products Table: "Featured" and "Banner" Status Labels in English
- **Severity:** Minor
- **Page:** /products
- **Action:** View products table "Statuslar" column
- **Expected:** All status badges in Azerbaijani
- **Actual:** Badges show "Featured (1)", "Featured (2)", "Banner" in English. Only "Məşhur" is translated.
- **Evidence:** Products table snapshot: `text: Featured (2)`, `text: Banner` in Statuslar cells.
- **Why this is Frontend:** Status label strings hardcoded in English in the table cell renderer.
- **Probable files/components:** `src/pages/ItemsPage.tsx` — Statuslar column cell renderer
- **Suggested frontend fix:** Map status values to AZ: `"featured"` → `"Seçilmiş"`, `"banner"` → `"Reklam Banneri"` via i18n.
- **Retest steps:** Products list → Statuslar column shows only Azerbaijani labels.

---

### FE-008 — Product Detail: "Featured olaraq təyin et" Button Partially English
- **Severity:** Minor
- **Page:** /products/{id}
- **Action:** View product detail page action buttons
- **Expected:** "Seçilmiş olaraq təyin et" (fully Azerbaijani)
- **Actual:** "Featured olaraq təyin et" — "Featured" is English
- **Evidence:** Snapshot: `button "Featured olaraq təyin et"`.
- **Why this is Frontend:** Button label uses English word "Featured" instead of AZ equivalent.
- **Probable files/components:** `src/pages/ProductDetailsPage.tsx`
- **Suggested frontend fix:** Replace with `t('products.set_as_featured')` = "Seçilmiş olaraq təyin et".
- **Retest steps:** Product detail → action buttons fully in Azerbaijani.

---

### FE-009 — Product Detail: Date Shows "2026 M06 27" (Malformed Format)
- **Severity:** Minor
- **Page:** /products/{id}
- **Action:** View "Əlavə edilib" date field
- **Expected:** Clean date format: "27.06.2026" or "27 İyun 2026"
- **Actual:** "2026 M06 27" — "M" prefix appears before the month number
- **Evidence:** Snapshot: `paragraph "2026 M06 27"`.
- **Why this is Frontend:** i18n date format pattern contains literal "M" character (e.g. format string `"yyyy MMM dd"` not correctly matched to `az-AZ` locale, causing "M" to be rendered literally).
- **Probable files/components:** `src/pages/ProductDetailsPage.tsx` — date display logic
- **Suggested frontend fix:** `new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(createdAt))` — or use a consistent date utility already in the project.
- **Retest steps:** Product detail "Əlavə edilib" date shows clean format (e.g. 27.06.2026).

---

### FE-010 — Discount Form: "Select" Placeholder in English + Silent Validation Failure
- **Severity:** Minor
- **Page:** /discounts
- **Action:** Open discount add form
- **Expected:** Default type option in Azerbaijani; on blocked submit show user-visible error
- **Actual:** Default "Tip" dropdown option shows "Select" (English). Empty submit is blocked (no API call), but no toast or field highlight is shown to the user — silent failure.
- **Evidence:** Discount form snapshot: `option "Select" [selected]`. After submit click, no error UI visible in snapshot, no network call made.
- **Why this is Frontend:** "Select" placeholder hardcoded in English; error feedback path missing when validation blocks.
- **Probable files/components:** `src/pages/DiscountsPage.tsx`
- **Suggested frontend fix:** Translate "Select" → "Seçin". Add `toast.error(t('discounts.type_required'))` in the blocked submit path. Date placeholder "dd/mm/yyyy" → "gg/aa/iiii".
- **Retest steps:** Open discount add → default shows "Seçin" → submit empty → visible error message appears.

---

### FE-011 — AddItemModal: Category Attributes Query Fires With Empty Category ID (→ 404)
- **Severity:** Major
- **Page:** /products (AddItemModal)
- **Action:** Open add product modal, submit empty form
- **Expected:** `useQuery` with `enabled: open && !!formData.category` should NOT fire when category is empty
- **Actual:** `GET /api/categories//attributes → 404` still fires (double-slash URL: empty categoryId in path)
- **Evidence:**
  - Console: `[ERROR] Failed to load resource: the server responded with a status of 404 () @ https://localhost:44312/api/categories//attributes`
  - Network: `[GET] https://localhost:44312/api/categories//attributes => [404]`
- **Why this is Frontend:** Either a TanStack Query race condition fires before `enabled` evaluates, or a stale query with a prior key triggers a refetch. Defensive guard missing inside `queryFn`.
- **Probable files/components:** `src/components/modals/AddItemModal.tsx:271-275`
- **Suggested frontend fix:**
  ```ts
  queryFn: () => {
    if (!formData.category) return Promise.resolve([]);
    return categoriesApi.getCategoryAttributes(formData.category);
  },
  ```
- **Retest steps:** Open add product modal without selecting category → network tab shows NO request to `/api/categories//attributes`.

---

### FE-012 — User Home: `/api/products/banners` Wrong Plural URL (→ 404)
- **Severity:** Critical
- **Page:** http://localhost:5174/ (User frontend home)
- **Action:** Load user home page
- **Expected:** Banner/hero slider loads from `/api/products/banner` (which returns 200)
- **Actual:** User frontend calls `/api/products/banners` (plural) → 404. The correct singular endpoint `/api/products/banner` works and returns 200.
- **Evidence:**
  - Console: `[ERROR] Failed to load resource: the server responded with a status of 404 () @ https://localhost:44312/api/products/banners`
  - Network: `[GET] /api/products/banners => [404]` and `[GET] /api/products/banner => [200]` (both fired on same page load)
- **Why this is Frontend:** User frontend API module uses wrong pluralized URL string `/products/banners` instead of `/products/banner`.
- **Probable files/components:** User frontend products API module — banner fetch function
- **Suggested frontend fix:** Change endpoint URL from `/products/banners` to `/products/banner`.
- **Retest steps:** Reload user home → no 404 in network; hero slider populates correctly.

---

### FE-013 — User Home: Price Formatted as "AZN1924.9923" (No Space, 4 Decimals)
- **Severity:** Major
- **Page:** http://localhost:5174/ (User home — discounts section + product cards)
- **Action:** View home page
- **Expected:** "1,924.99 AZN" (2 decimal places, correct currency position)
- **Actual:** "AZN1924.9923" in discounts banner (currency prefix, no space, 4 decimals). "1,924.992 AZN" in product cards (3 decimals).
- **Evidence:** Snapshot: `generic "AZN1924.9923"`, `generic "1,924.992 AZN"`.
- **Why this is Frontend:** Price not rounded to 2 decimal places before display. Currency concatenated before amount without space (e.g. `` `${currency}${price}` `` pattern).
- **Probable files/components:** User frontend — discount banner component, product card component, price formatter utility
- **Suggested frontend fix:** Use `price.toFixed(2)` before display. Format as `{amount} AZN` (amount first, then currency code with space).
- **Retest steps:** Home page discount and product card prices show exactly 2 decimal places with correct format.

---

### FE-014 — User Home: Popular Products Show "Qiymət sorğu ilə" Instead of Price
- **Severity:** Minor
- **Page:** http://localhost:5174/ (User home — Məşhur Məhsullar section)
- **Action:** View popular products section
- **Expected:** Each popular product shows its actual price (e.g. "2,899.99 AZN")
- **Actual:** All 4 popular products show "Qiymət sorğu ilə" (Price on request). These same products show correct prices in the "Yeni Gəlmələr" section on the same page.
- **Evidence:** Snapshot: `paragraph "Qiymət sorğu ilə"` for all 4 popular product cards.
- **Why this is Frontend:** The popular products display component falls back to "Qiymət sorğu ilə" when the price field is null/undefined. Either the `/api/products/popular` response doesn't include a `price` field, or the component uses the wrong field name.
- **Probable files/components:** User frontend — popular products section component; `/api/products/popular` response field mapping
- **Suggested frontend fix:** Inspect the `/api/products/popular` response shape and ensure `price` field is correctly mapped. If `price` is in the response but under a different key, fix the accessor. If missing from response, the user frontend API for popular products may need to include it.
- **Retest steps:** Popular products section on user home shows actual prices for each product.

---

### FE-015 — User Frontend Footer Links Resolve to Current Page URL
- **Severity:** Minor
- **Page:** All pages on http://localhost:5174
- **Action:** View footer "Xidmətlər" and "Alıcıya kömək" link sections
- **Expected:** Footer links navigate to dedicated pages or show as `#` placeholders consistently
- **Actual:** All 12 footer links in those sections resolve to the current page URL. On `/` → all point to `/`. On `/login` → all point to `/login`. On `/cart` → all to `/cart`.
- **Evidence:** Login page footer snapshot: all "Xidmətlər" and "Alıcıya kömək" links have `/url: /login`. Home page: all have `/url: /`.
- **Why this is Frontend:** Footer link `href` attributes are empty (`href=""`) or use a relative path that inherits the current URL.
- **Probable files/components:** User frontend — Footer component
- **Suggested frontend fix:** Replace `href=""` with `href="#"` for placeholder links, or provide actual absolute paths. Never use empty href.
- **Retest steps:** Footer links on home, login, and cart pages all point to the same consistent URL (not the current page).

---

### FE-016 — User Home: "Discounts up to -50%" Heading in English
- **Severity:** Minor
- **Page:** http://localhost:5174/
- **Action:** View home page discounts section
- **Expected:** Heading in Azerbaijani
- **Actual:** `heading "Discounts up to -50%"` displayed in English
- **Evidence:** User home snapshot: `heading "Discounts up to -50%"`.
- **Why this is Frontend:** Hardcoded English string in the discounts promo section.
- **Probable files/components:** User frontend — home page discounts/promo section component
- **Suggested frontend fix:** Replace with `t('home.discount_heading')` = "50%-ə qədər endirim".
- **Retest steps:** User home discount section heading in Azerbaijani.

---

## Backend Problems

*No backend issues identified. All backend endpoints that received valid, well-formed frontend requests returned correct HTTP 200 responses.*

---

## Contract/API Mismatch

### API-001 — `GET /api/products/discounted` Endpoint Does Not Exist (→ 404)
- **Severity:** Major
- **Endpoint:** `GET https://localhost:44312/api/products/discounted`
- **Swagger/OpenAPI says:** Not verified during this test session
- **Frontend expects:** A list of discounted products from `/api/products/discounted`
- **Backend returns:** 404 Not Found
- **Problem:** User frontend calls this endpoint on home page load for the discounts section. Backend has no such route. The discounts promotional section silently fails.
- **Who should fix:** Requires coordination. Either Backend implements `GET /api/products/discounted`, or Frontend switches to use an existing filter (e.g. `GET /api/products?hasDiscount=true`) if one exists.
- **Suggested action:** (1) Check if backend `/api/products` supports a discount filter param. If yes, frontend should use that. (2) If not, backend must implement the endpoint or document the intended contract. Currently this is a broken integration with no error handling visible to the user.

---

## Data / Environment Problems

### ENV-001 — Samsung Galaxy s25 ultra Has Wrong Description (Apple iPhone Data)
- **Severity:** Minor
- **Problem:** Product "Samsung Galaxy s25 ultra" (ID: fc419330) has its description set to "Apple iPhone 15 Pro Max 256GB Titanium Blue" — completely wrong product data.
- **Evidence:** Visible in Admin dashboard "Yeni Məhsullar" section, user home hero slider (`paragraph "Apple iPhone 15 Pro Max 256GB Titanium Blue"` under "Samsung Galaxy s25 ultra"), and popular products admin page.
- **Required setup:** Update this product's description via admin edit to reflect Samsung Galaxy s25 ultra specifications.
- **Owner:** Data/seed data — developer must correct this test record in the database.

---

## Unknown / Needs Investigation

### INV-001 — Categories List Shows 2 Records But Product Form Dropdown Has 8
- **Severity:** Minor
- **What was observed:** `GET /api/categories?page=1&pageSize=10 → 200` returns `totalCount: 2` (only "Elektronika" and "Məişət Texnikası"). But `GET /api/categories/lookup → 200` returns 8 items used in the product add/edit form dropdown (Aksessuarlar, Elektronika, Kompyuterlər, Məişət Texnikası, Mətbəx Texnikası, Smartfonlar, Təmizləmə Texnikası, and 1 more). Both return 200 with different counts.
- **Why ownership is unclear:** Could be (a) backend `/api/categories` filters root-only categories by default (`parentId IS NULL`), (b) the lookup endpoint flattens the entire hierarchy, (c) a backend pagination/filter bug, or (d) different data sources.
- **What to check in frontend:** `src/pages/CategoriesPage.tsx` — verify no `parentId` filter is sent in the `getCategories()` call. Currently confirmed: `getCategories({ page, pageSize, searchTerm })` — no parentId param sent.
- **What to check in backend:** Does the `GET /api/categories` handler apply a hidden default filter (`WHERE ParentId IS NULL`)? Does the `GET /api/categories/lookup` handler return all categories regardless of hierarchy?
- **Suggested investigation prompt:** In the backend Categories controller, check if `GetCategories` applies `parentId = null` by default. If so, determine whether the admin categories page should also show sub-categories and add an `includeChildren` toggle or remove the default filter.

---

## Passed Cases

**Admin Frontend (23 passed):**
1. Login page renders (redirects authenticated user correctly)
2. Login empty submit validation (AZ error messages, no API call)
3. Login invalid email format validation
4. Login short password validation
5. Successful login (POST /api/auth/login → 200, redirect to dashboard)
6. Logout (session cleared, redirect to /login)
7. Dashboard loads with all 4 stats cards
8. GET /api/Dashboard → 200
9. GET /api/brands/promotional → 200
10. GET /api/Dashboard/chart → 200
11. Sidebar navigation to all 6 sections
12. Dark/light mode toggle (`.dark` class applied correctly)
13. Products list GET /api/Products → 200
14. Products search with &searchTerm= → 200
15. Products pagination controls (disabled correctly)
16. Product detail GET /api/Products/{id} → 200
17. Product detail breadcrumb correct
18. Categories list GET /api/categories → 200
19. Brands list GET /api/brands → 200 (10 brands)
20. Discounts list GET /api/discounts → 200
21. Discount form empty submit correctly blocked without API call
22. Popular Products GET /api/Products/popular + GET /api/Products → 200
23. Popular Products 4 slots displayed

**User Frontend (9 passed):**
24. Products listing page — no errors, all API → 200
25. Product detail — GET /api/products/{id} → 200
26. Product detail breadcrumb with category/brand links
27. Login page fully in Azerbaijani
28. Login empty submit — AZ validation messages, no API call
29. Cart page loads without errors
30. Home page "Yeni Gəlmələr" and featured sections load
31. Product listing all 3 API calls → 200
32. Cart "Sifarişi tamamla" checkout link visible

---

## Not Tested

| Area | Reason |
|---|---|
| Admin: Product edit flow | Skipped — would mutate existing product data; same AddItemModal (FE-001 applies) |
| Admin: Category edit | Skipped — would mutate real data |
| Admin: Brand edit | Skipped — would mutate real data |
| Admin: Discount edit | Skipped — would mutate real data |
| Admin: Category Attributes page | Not navigated — deferred to next pass |
| Admin: Filter modal on Products | "Filtr" button visible but modal not opened |
| Admin: Header global search | Search box visible; submit/behavior not tested |
| Admin: Notification bell | No notification component found in header |
| Admin: Expired/invalid token behavior | Requires manual token manipulation |
| Admin: Pagination > 1 page | Only 5 products in DB — cannot test multi-page |
| User: Register page | No test credentials provided for new user registration |
| User: Checkout flow | Irreversible action — not tested per test rules |
| User: Profile page | Requires authenticated user session |
| User: Wishlist page | Requires authenticated user session |
| User: Order history | Requires authenticated user session |
| User: Search submit behavior | Searchbox visible but submit interaction not tested |
| User: Product filter/sort | Filter sidebar visible but interactions not tested |
| User: Responsive/mobile layout | Desktop viewport only; no responsive test done |

---

## Ready-to-copy Claude Frontend Fix Prompt

```
You are fixing confirmed frontend bugs in a React 19 + TypeScript + Tailwind admin panel (tvstore-admin, src/) and a user-facing storefront (separate project at port 5174). Fix ONLY the issues listed. Do not refactor unrelated code.

=== ADMIN FRONTEND (src/) ===

FIX 1 [CRITICAL] src/utils/productSave.ts — validateProductFormForSave() (line ~45)
Add required-field validation BEFORE the existing inline-attribute/variant checks:
  if (!formData.itemName?.trim()) return { valid: false, message: 'Məhsul adı tələb olunur' };
  if (!formData.category) return { valid: false, message: 'Kateqoriya seçilməlidir' };
  if (!formData.manufacturer) return { valid: false, message: 'Brend seçilməlidir' };
  if (!formData.price || Number(formData.price) <= 0) return { valid: false, message: 'Düzgün qiymət daxil edin' };
  if (formData.amount === '' || Number(formData.amount) < 0) return { valid: false, message: 'Stok miqdarı daxil edin' };

FIX 2 [MAJOR] src/components/modals/AddItemModal.tsx — categoryAttributes useQuery (line ~271)
Add guard in queryFn to prevent empty categoryId in URL:
  queryFn: () => {
    if (!formData.category) return Promise.resolve([]);
    return categoriesApi.getCategoryAttributes(formData.category);
  },

FIX 3 [MAJOR] src/pages/CategoriesPage.tsx — form submit handler
Add before mutation call: if (!formData.name.trim()) { toast.error(t('categories.name_required')); return; }
Add to src/locales/az/translation.json: "categories": { "name_required": "Kateqoriya adı tələb olunur" }

FIX 4 [MAJOR] src/pages/BrandsPage.tsx — form submit handler
Add before mutation call: if (!formData.name.trim()) { toast.error(t('brands.name_required')); return; }
Add to src/locales/az/translation.json: "brands": { "name_required": "Brend adı tələb olunur" }

FIX 5 [MINOR] src/modules/auth/pages/LoginPage.tsx
Use useTranslation() and replace all hardcoded English strings:
  "Welcome 👋" → t('auth.welcome')       = "Xoş gəlmisiniz 👋"
  "Please login here" → t('auth.subtitle') = "Hesabınıza daxil olun"
  "Email Address" → t('auth.email')       = "E-poçt ünvanı"
  "Password" → t('auth.password')          = "Şifrə"
  "Remember Me" → t('auth.remember_me')   = "Məni xatırla"
  "Login" button → t('auth.login')        = "Daxil ol"

FIX 6 [MINOR] src/components/commons/FileUpload.tsx
Override native "Choose File" label. Wrap the <input type="file"> in a visually hidden div and add a styled button with text "Fayl seçin" using t('common.choose_file').

FIX 7 [MINOR] src/components/commons/Select.tsx
Translate default placeholder option from "Select" to t('common.select_placeholder') = "Seçin".

FIX 8 [MINOR] src/components/dashboard/DashboardChart.tsx
Replace hardcoded English strings:
  "Revenue Overview" → t('dashboard.revenue_overview') = "Gəlir İcmalı"
  "Daily" → t('dashboard.daily') = "Günlük"
  "Weekly" → t('dashboard.weekly') = "Həftəlik"
  "Monthly" → t('dashboard.monthly') = "Aylıq"

FIX 9 [MINOR] src/pages/ItemsPage.tsx — Statuslar column cell renderer
Map English status strings to AZ:
  "featured" / "Featured" → "Seçilmiş"
  "banner" / "Banner" → "Reklam Banneri"

FIX 10 [MINOR] src/pages/ProductDetailsPage.tsx
  a) Change "Featured olaraq təyin et" → t('products.set_as_featured') = "Seçilmiş olaraq təyin et"
  b) Fix date format: replace current date display with:
     new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(product.createdAt))

FIX 11 [MINOR] src/pages/DiscountsPage.tsx
  a) Translate "Select" placeholder in Tip dropdown → "Seçin"
  b) Date input placeholders "dd/mm/yyyy" → "gg/aa/iiii"
  c) Add visible toast.error() in the blocked-submit path so users see why submission failed

=== USER FRONTEND ===

FIX 12 [CRITICAL] User frontend products API module
Change banner endpoint URL from "/products/banners" to "/products/banner" (remove trailing 's').

FIX 13 [MAJOR] User frontend — price formatting (all components showing prices)
  a) Always round to 2 decimal places: Number(price).toFixed(2)
  b) Format: "{amount} AZN" — amount first, then currency code with a space. Do NOT prefix "AZN" before the number.

FIX 14 [MINOR] User frontend — popular products section component
Verify the /api/products/popular response includes a price field. Fix the field accessor so price renders correctly instead of falling back to "Qiymət sorğu ilə".

FIX 15 [MINOR] User frontend — Footer component
Replace all href="" (empty) on "Xidmətlər" and "Alıcıya kömək" list links with href="#" (or proper absolute paths). Never use empty href as it resolves to the current page URL.

FIX 16 [MINOR] User frontend — home page discounts section
Replace "Discounts up to -50%" with Azerbaijani: "50%-ə qədər endirim".
```

---

## Ready-to-copy Cursor Backend Fix Prompt

```
No confirmed backend bugs were found in this QA session. All backend endpoints that received valid, well-formed requests returned HTTP 200 with correct data.

ACTION REQUIRED — investigate and implement:

1. GET /api/products/discounted returns 404 (endpoint missing).
   The user frontend home page calls this endpoint for its discounts promotional section.
   Either:
   a) Implement GET /api/products/discounted → returns products that have an active discount
      (join Products with Discounts where isActive=true AND startDate <= now AND endDate >= now)
   b) OR confirm that the frontend should instead use GET /api/products with a query param 
      (e.g. ?hasDiscount=true) and document the intended contract so the frontend team can update.

2. Investigate GET /api/categories count discrepancy:
   - GET /api/categories?page=1&pageSize=10 returns totalCount=2
   - GET /api/categories/lookup returns 8 items
   Check whether the list endpoint applies a hidden filter (e.g. WHERE ParentId IS NULL).
   If so, determine if this is correct behavior or a bug, and document it.
```

---

## Ready-to-copy Investigation Prompt

```
Investigate the following ambiguous issue found during QA testing:

ISSUE: Categories list endpoint vs lookup endpoint count mismatch

Context:
- Admin app at http://localhost:5173
- Backend at https://localhost:44312/api

Observed:
- GET /api/categories?page=1&pageSize=10 → 200 → returns 2 records total (totalCount: 2): "Elektronika", "Məişət Texnikası"
- GET /api/categories/lookup → 200 → returns 8 items: Aksessuarlar, Elektronika, Kompyuterlər, Məişət Texnikası, Mətbəx Texnikası, Smartfonlar, Təmizləmə Texnikası + 1 more

Frontend CategoriesPage.tsx sends: getCategories({ page: 1, pageSize: 10, searchTerm: undefined }) — NO parentId filter.

Please investigate:

Backend side:
1. Open the Categories controller and GetCategoriesQuery/Handler. Does it apply WHERE ParentId IS NULL by default?
2. Open the GetCategoriesLookup handler. Does it return ALL categories regardless of hierarchy?
3. If the list endpoint silently filters root-only categories: is this intentional? Should it?
4. If it's a bug: remove the hidden filter so all categories appear in the admin list.

Frontend side (if backend confirms root-only filter is intentional):
1. The admin categories page should add an expandable tree or "show sub-categories" toggle.
2. Or add a note in the UI: "Yalnız ana kateqoriyalar göstərilir" (Only root categories shown).
```

---

## Final Verdict

**PARTIAL**

Core infrastructure is solid: authentication, routing, API connectivity, all CRUD list pages, dark mode, and navigation work correctly with clean 200 responses. However, **3 critical frontend gaps** block production readiness: (1) product/category/brand add forms bypass client validation and hit the backend with empty data producing 400 errors; (2) the user frontend calls a wrong `/banners` URL producing a 404 on every home page load; (3) prices are displayed with malformed currency format and incorrect decimal precision on the user frontend. Additionally, **12+ i18n violations** exist where English text appears in an Azerbaijani-only application, and 1 unimplemented API endpoint (`/api/products/discounted`) causes a silent failure on the user home page.
