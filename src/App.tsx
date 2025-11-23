import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { ItemsPage } from "./pages/ItemsPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { BrandsPage } from "./pages/BrandsPage";
import { DiscountsPage } from "./pages/DiscountsPage";
import { ProtectedRoute } from "./core/components/ProtectedRoute";
import { PublicRoute } from "./core/components/PublicRoute";
import {
  LoginPage,
  ForgotPasswordPage,
  EnterOTPPage,
  ResetPasswordPage,
} from "./modules/auth/pages";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/enter-otp"
        element={
          <PublicRoute>
            <EnterOTPPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ItemsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductDetailsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CategoriesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/brands"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BrandsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discounts"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DiscountsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
