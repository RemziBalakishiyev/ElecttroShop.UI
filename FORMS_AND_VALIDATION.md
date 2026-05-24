# Forms və Validation Sənədi

## Ümumi yanaşma

Layihədə **iki form yanaşması** paralel istifadə olunur:

| Yanaşma | Harada | Alət |
|---------|--------|------|
| **Formik + Yup** | Auth (Login) | Structured form library |
| **Native useState** | CRUD səhifələri, modals | Manual state management |

React Hook Form **istifadə olunmur**.

---

## Formik + Yup (Login)

**Fayl:** `src/modules/auth/pages/LoginPage.tsx`

### Validation schema

```typescript
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Email formatı düzgün deyil")
    .required("Email tələb olunur"),
  password: Yup.string()
    .min(6, "Şifrə ən azı 6 simvol olmalıdır")
    .required("Şifrə tələb olunur"),
  rememberMe: Yup.boolean(),
});
```

### Form values

```typescript
interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}
```

### Error göstərilməsi

```tsx
<Field
  as={Input}
  name="email"
  error={touched.email && errors.email ? errors.email : undefined}
/>
```

- Field-level: `Input` komponentinin `error` prop-u
- Form-level: `loginMutation.isError` → API error div

### Submit/Loading

```tsx
<Button
  type="submit"
  loading={loginMutation.isPending}
  disabled={loginMutation.isPending}
>
```

---

## Native form state (CRUD səhifələri)

### CategoriesPage

```typescript
const [formData, setFormData] = useState({
  name: "",
  slug: "",
  parentId: "",
});

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  saveMutation.mutate(formData);
};
```

**Validation:** Frontend validation **yoxdur** — birbaşa API-yə göndərilir.

### BrandsPage

```typescript
const [formData, setFormData] = useState({
  name: "",
  isPromotional: false,
  displayOrder: 1,
});
```

Submit zamanı conditional logic:
```typescript
displayOrder: formData.isPromotional ? formData.displayOrder : null
```

### DiscountsPage

```typescript
const [formData, setFormData] = useState({
  type: "" as DiscountType | "",
  productId: "", brandId: "", categoryId: "",
  percent: "", startDate: "", endDate: "",
  isActive: true,
});
```

**Dynamic fields:** `type`-a görə product/brand/category select göstərilir.

**Validation:** Frontend validation **yoxdur**.

### CategoryAttributesPage

İki ayrı form state:
- `attributeForm` — name, displayName, attributeType, isRequired, displayOrder
- `valueForm` — value, displayValue, displayOrder, colorCode

---

## AddItemModal (mürəkkəb form)

**Fayl:** `src/components/modals/AddItemModal.tsx`

Native `useState` ilə idarə olunan mürəkkəb form:

| Field qrupu | State | Təsvir |
|-------------|-------|--------|
| Əsas məlumat | `formData` object | name, description, price, sku, stock, ... |
| Kateqoriya/Brend | select state | lookup API-dən |
| Şəkillər | `existingImages`, `newFiles` | preview + upload |
| Variantlar | `variants[]` | atribut kombinasiyaları + şəkil |
| Kateqoriya atributları | dynamic fields | category attributes API |

**Validation:** Modal daxilində manual check (required field-lər), Yup/Formik yox.

**Submit flow:**
1. Parent səhifənin `onAdd` callback-i çağırılır
2. Parent (ItemsPage/ProductDetailsPage) API mutation icra edir
3. Şəkil upload `buildProductImageIdsForSave` helper ilə

---

## Form komponentləri

| Komponent | Form element | Xüsusiyyətlər |
|-----------|-------------|---------------|
| `Input` | `<input>` | label, error, required, theme-aware |
| `Select` | `<select>` | options array, placeholder |
| `Textarea` | `<textarea>` | label, error |
| `Checkbox` | `<input type="checkbox">` | label |
| `DateInput` | date input | label, error |
| `FileUpload` | file input | drag/drop, preview |

---

## Error message göstərilməsi

| Səviyyə | Pattern | Nümunə |
|---------|---------|--------|
| Field validation | Input `error` prop | Yup error string |
| API validation | Toast error | `toast.error(t('...'))` |
| API error object | `(error as any)?.error?.message` | Login, mutations |
| Inline API error | Conditional div | LoginPage error box |

### API error structure

```typescript
{
  isSuccess: false,
  error: { code: "...", message: "...", type: "Validation" | "Failure" }
}
```

**Problem:** Error parsing inconsistent:
```typescript
// Pattern 1
error.response?.data?.message
// Pattern 2
error?.error?.message
// Pattern 3
(err) => toast.error(t('generic_key'))
```

---

## Submit/Loading/Disabled state-lər

| Pattern | Harada |
|---------|--------|
| `mutation.isPending` → Button `loading` | Login, CRUD modals |
| `mutation.isPending` → Button `disabled` | ConfirmationModal |
| `saveMutation.isPending` | Modal submit buttons |
| Form disable on submit | LoginPage (`disabled={loginMutation.isPending}`) |

---

## Validation qaydaları xülasəsi

| Form | Frontend validation | Backend validation |
|------|--------------------|--------------------|
| Login | ✅ Yup (email, password min 6) | ✅ API error |
| Categories | ❌ | ✅ API error → toast |
| Brands | ❌ | ✅ API error → toast |
| Discounts | ❌ | ✅ API error → toast |
| Category Attributes | ❌ | ✅ API error → toast |
| AddItemModal | ⚠️ Partial manual | ✅ API error → toast |
| Forgot/Reset Password | ❌ | ❌ API yoxdur |

---

## Tövsiyələr

1. **Vahid validation layer** — bütün formlar üçün Yup schema
2. **Vahid error parser** — `parseApiError(error): string` utility
3. **Formik everywhere** və ya **React Hook Form + Zod** migration
4. **Required field indicators** — bütün formlarda `required` prop istifadəsi
5. **Dirty form warning** — modal bağlanarkən unsaved changes alert
