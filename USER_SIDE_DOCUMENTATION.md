# User Side Project Documentation

This document serves as a blueprint for building the User-facing side of the Electronics Store application. It outlines the recommended folder structure, technology stack, API integration points, and component architecture.

## 1. Technology Stack

The project should be built using modern web technologies to ensure performance, scalability, and a premium user experience.

### Core Framework & Language
- **React 19**: The latest version of the library for building user interfaces.
- **TypeScript**: For type safety and better developer experience.
- **Vite**: Next-generation frontend tooling for fast builds and hot module replacement.

### Styling & UI
- **TailwindCSS v4**: Utility-first CSS framework for rapid UI development.
- **Lucide React**: Beautiful, consistent icons.
- **Framer Motion** (Optional but Recommended): For smooth animations and transitions to achieve a "premium" feel.

### State Management & Data Fetching
- **React Query (@tanstack/react-query)**: For powerful asynchronous state management, caching, and data synchronization.
- **Context API**: For global UI state (e.g., Theme, Shopping Cart, Auth State).

### Forms & Validation
- **Formik**: For building forms.
- **Yup**: For schema-based form validation.

### Routing
- **React Router DOM**: For client-side routing.

### HTTP Client
- **Axios**: For making HTTP requests to the backend API.

---

## 2. Folder Structure

A feature-based folder structure is recommended for scalability.

```
src/
├── assets/              # Static assets (images, fonts, global styles)
├── components/          # Shared/Common components
│   ├── common/          # Generic UI components (Button, Input, Modal, etc.)
│   ├── layout/          # Layout components (Header, Footer, MainLayout)
│   └── ui/              # (Optional) Complex UI elements (Carousels, etc.)
├── config/              # Configuration files (API endpoints, constants)
├── context/             # Global React Context providers (AuthContext, CartContext)
├── features/            # Feature-specific modules
│   ├── auth/            # Authentication feature (Login, Register)
│   │   ├── components/
│   │   └── hooks/
│   ├── cart/            # Shopping Cart feature
│   │   ├── components/
│   │   └── hooks/
│   ├── checkout/        # Checkout process
│   │   ├── components/
│   │   └── hooks/
│   ├── products/        # Product browsing and details
│   │   ├── components/  # (ProductCard, ProductList, Filters)
│   │   └── hooks/       # (useProducts, useProductDetail)
│   └── home/            # Home page specific components
├── hooks/               # Shared custom hooks (useDebounce, useLocalStorage)
├── lib/                 # Utility libraries configuration (axios setup, queryClient)
├── pages/               # Page components (mapped to routes)
│   ├── HomePage.tsx
│   ├── ProductListPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── services/            # API service definitions
│   ├── api.ts           # Base axios instance
│   ├── auth.service.ts
│   └── product.service.ts
├── types/               # TypeScript type definitions
│   ├── product.types.ts
│   ├── auth.types.ts
│   └── cart.types.ts
├── utils/               # Helper functions (currency formatting, date formatting)
├── App.tsx
└── main.tsx
```

---

## 3. API Documentation

The application will communicate with the backend API. Below are the key endpoints and data models based on the Admin project analysis.

**Base URL**: `[Your Backend API URL]` (e.g., `https://api.electronics-store.com/api`)

### Authentication (`/Auth`)
- **POST** `/Auth/login`: Authenticate user.
    - Body: `{ email, password }`
    - Response: `{ accessToken, refreshToken, user: { id, email, name } }`
- **POST** `/Auth/refresh-token`: Refresh expired access token.
    - Body: `{ refreshToken }`
- **POST** `/Auth/register` (Suggested): Register new user.
    - Body: `{ email, password, confirmPassword, firstName, lastName }`

### Products (`/Products`)
- **GET** `/Products`: Get paginated list of products with filters.
    - Query Params:
        - `page`: Page number (default 1)
        - `pageSize`: Items per page (default 20)
        - `searchTerm`: Search by name or description
        - `categoryId`: Filter by category
        - `brandId`: Filter by brand
        - `minPrice`, `maxPrice`: Price range
- **GET** `/Products/{id}`: Get detailed product information.
- **GET** `/Products/search`: Dedicated search endpoint (if distinct from list).

### Categories & Brands (Inferred)
- **GET** `/Categories`: Get list of product categories for navigation/filtering.
- **GET** `/Brands`: Get list of brands for filtering.

### Data Models (TypeScript Interfaces)

**Product**
```typescript
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  finalDiscountPercent?: number | null;
  finalPrice?: number | null; // Price after discount
  currency: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  stock: number;
  imageUrl: string | null;
  // ... other fields
}
```

---

## 4. Component Structure

Key components to implement for the user interface.

### Layout Components
- **Header**: Contains Logo, Search Bar, Navigation Links (Categories), Cart Icon (with badge), User Menu (Login/Profile).
- **Footer**: Links to pages, social media, newsletter signup.
- **MainLayout**: Wrapper for pages, includes Header and Footer.

### Common Components (`src/components/common`)
- **Button**: Reusable button with variants (primary, secondary, outline, ghost).
- **Input**: Text input with label and error message support.
- **Card**: Container with shadow/border for products or content.
- **Modal**: Generic modal for popups (e.g., Quick View).
- **Badge**: For status or discount tags.
- **Spinner/Skeleton**: Loading states.

### Feature Components

#### Product Features (`src/features/products`)
- **ProductCard**: Displays product thumbnail, name, price, discount, and "Add to Cart" button.
- **ProductList**: Grid layout for displaying ProductCards.
- **ProductFilters**: Sidebar or top bar for filtering by Category, Brand, Price.
- **ProductSort**: Dropdown to sort by Price (Low/High), Newest, etc.
- **ProductDetail**: Full page view with gallery, detailed description, specs, and related products.

#### Cart Features (`src/features/cart`)
- **CartDrawer**: Slide-out panel showing quick cart summary.
- **CartItem**: Row in cart showing product info, quantity selector, and remove button.
- **CartSummary**: Shows subtotal, tax, shipping, and "Checkout" button.

#### Checkout Features (`src/features/checkout`)
- **CheckoutForm**: Multi-step or single page form for Shipping Address, Payment Method.
- **OrderSummary**: Read-only view of cart items during checkout.

#### Auth Features (`src/features/auth`)
- **LoginForm**: Email/Password fields.
- **RegisterForm**: Registration fields.

---

## 5. Design & UX Guidelines (Premium Feel)
- **Color Palette**: Use a primary brand color but rely heavily on whitespace and neutral grays for a clean look.
- **Typography**: Use modern sans-serif fonts (e.g., Inter, Roboto, Plus Jakarta Sans).
- **Feedback**: Show toast notifications for actions (e.g., "Added to Cart").
- **Empty States**: Design friendly empty states for Cart, Search Results, etc.
- **Responsive**: Ensure perfect rendering on Mobile, Tablet, and Desktop.
