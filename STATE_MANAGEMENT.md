# State Management Sənədi

## Ümumi yanaşma

Layihədə **3 növ state** istifadə olunur:

| State növü | Alət | Məqsəd |
|------------|------|--------|
| **Server state** | TanStack React Query | API data, cache, mutations |
| **Global client state** | React Context | Auth, Theme, Toast |
| **Local component state** | `useState`, `useEffect` | Form, modal, pagination, filter |

Redux, Zustand, Jotai və ya digər global state library **istifadə olunmur**.

---

## Provider hierarchy

```tsx
// src/core/providers/AppProviders.tsx
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  </ThemeProvider>
</QueryClientProvider>
```

### QueryClient default options

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Global state (Context)

### AuthContext

**Fayl:** `src/core/context/AuthContext.tsx`

| State/Method | Tip | Təsvir |
|--------------|-----|--------|
| `authState` | `AuthState` | user, tokens, isAuthenticated |
| `setAuthState` | `Dispatch<SetStateAction<AuthState>>` | State yeniləmə |
| `logout` | `() => void` | Token clear + state reset |
| `isAuthenticated` | `boolean` | Shortcut |
| `user` | `User \| null` | Shortcut |

**Init:** localStorage-dan oxunur (`tokenStorage`)

**Side effect:** Hər 60 saniyədə token expiration yoxlanılır

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
}
```

**Hook:** `useAuthContext()`

---

### ThemeContext

**Fayl:** `src/core/context/ThemeContext.tsx`

| State/Method | Tip | Təsvir |
|--------------|-----|--------|
| `theme` | `"light" \| "dark"` | Cari tema |
| `setTheme` | `(theme) => void` | Tema dəyiş |
| `toggleTheme` | `() => void` | Toggle |

**Persist:** `localStorage.setItem("theme", theme)`

**DOM effect:** `document.documentElement.classList.add/remove("dark")`

**Hook:** `useTheme()`

---

### ToastContext

**Fayl:** `src/core/providers/ToastContext.tsx`

| Method | Təsvir |
|--------|--------|
| `success(message, duration?)` | Yaşıl toast |
| `error(message, duration?)` | Qırmızı toast |
| `info(message, duration?)` | Mavi toast |
| `warning(message, duration?)` | Sarı toast |
| `addToast(type, message, duration?)` | Generic |

**Hook:** `useToast()`

---

## Server state (React Query)

### Query key-lər

| Query Key | Səhifə/Komponent | API |
|-----------|------------------|-----|
| `["dashboard"]` | DashboardPage | `getDashboardData` |
| `["dashboardChart", period]` | DashboardChart | `getDashboardChart` |
| `["promotional-brands"]` | PromotionalBrands | `getPromotionalBrands` |
| `["products", page, pageSize, searchTerm, filters]` | ItemsPage | `getProducts` |
| `["product", id]` | ProductDetailsPage | `getProductById` |
| `["categories", page, pageSize, searchTerm]` | CategoriesPage | `getCategories` |
| `["category", categoryId]` | CategoryAttributesPage | `getCategoryById` |
| `["category-attributes", categoryId]` | CategoryAttributesPage | `getCategoryAttributes` |
| `["brands", page, pageSize, searchTerm]` | BrandsPage | `getBrands` |
| `["discounts", page, pageSize, ...]` | DiscountsPage | `getDiscounts` |
| `["products", "all"]` | DiscountsPage (form) | `getProducts` |
| `["brands", "all"]` | DiscountsPage (form) | `getBrands` |
| `["categories", "all"]` | DiscountsPage (form) | `getCategories` |
| `["categories-lookup"]` | FilterModal | `getLookup` |
| `["brands-lookup"]` | FilterModal | `getLookup` |

### Mutation pattern

Tipik mutation lifecycle:

```typescript
const deleteMutation = useMutation({
  mutationFn: (id: string) => productsApi.deleteProduct(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success(t('products.delete_success'));
    // modal/state cleanup
  },
  onError: (err) => {
    toast.error(t('products.delete_error'));
  },
});
```

### Auth mutations

**Fayl:** `src/core/hooks/useAuth.ts`

| Hook | Mutation | onSuccess |
|------|----------|-----------|
| `useLogin(callback?)` | `authApi.login` | Token save, auth state update, invalidateQueries, navigate |
| `useRefreshToken()` | `authApi.refreshToken` | Token update |

---

## Local state nümunələri

### CRUD səhifə state pattern

```typescript
// Tipik state-lər (ItemsPage, CategoriesPage, ...)
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [searchTerm, setSearchTerm] = useState("");
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<T | null>(null);
const [deleteId, setDeleteId] = useState<string | null>(null);
```

### Form state

| Səhifə | Yanaşma |
|--------|---------|
| LoginPage | Formik (`initialValues`, `validationSchema`) |
| CategoriesPage, BrandsPage, DiscountsPage | Native `useState` form object |
| AddItemModal | Native `useState` (mürəkkəb nested state) |

---

## Cache idarəetməsi

| Mexanizm | Harada | Təsvir |
|----------|--------|--------|
| `invalidateQueries` | Mutation onSuccess | Siyahıları yeniləyir |
| `staleTime: 1 hour` | FilterModal lookup | Kateqoriya/brend lookup cache |
| `enabled: condition` | Conditional queries | Modal açıq olanda fetch |
| `refetchOnWindowFocus: false` | Global default | Focus-da refetch yox |

**Qeyd:** Optimistic update **istifadə olunmur**.

---

## Loading state

| Səviyyə | Pattern |
|---------|---------|
| Query loading | `isLoading` → spinner və ya Table `isLoading` prop |
| Mutation loading | `isPending` → Button `loading` prop, modal `isLoading` |
| Page loading | Full-page spinner (Dashboard, ProductDetails) |

---

## Error state

| Səviyyə | Pattern |
|---------|---------|
| Query error | `isError` → error message UI |
| Mutation error | `onError` → `toast.error()` |
| Login error | Inline error div + `loginMutation.isError` |

**Global error boundary yoxdur.**

---

## State flow diaqramı (Login)

```
LoginPage form submit
    ↓
useLogin.mutateAsync(credentials)
    ↓
authApi.login → apiClient.post
    ↓
onSuccess: tokenStorage.set* + setAuthState
    ↓
navigate("/", { replace: true })
    ↓
ProtectedRoute: isAuthenticated = true → MainLayout render
```

---

## State flow diaqramı (CRUD)

```
Page mount → useQuery fetch
    ↓
User action (create/edit/delete)
    ↓
useMutation → API call
    ↓
onSuccess → invalidateQueries + toast + close modal
    ↓
useQuery auto-refetch → UI update
```

---

## Problemlər və tövsiyələr

| Problem | Təsvir | Tövsiyə |
|---------|--------|---------|
| Response unwrap inconsistency | `(data as any)?.value \|\| data` hər yerdə təkrarlanır | `unwrapApiData` universal istifadə |
| Auth expiration | Expired token zamanı refresh avtomatik deyil (yalnız 401 interceptor) | Proaktiv refresh |
| Form state duplication | Eyni CRUD form pattern 4 səhifədə | Custom `useCrudForm` hook |
| Query key inconsistency | Bəzi yerlərdə string literal | Centralized query key factory |
