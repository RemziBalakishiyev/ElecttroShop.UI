import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../../../components/commons/Input";
import { Button } from "../../../components/commons/Button";
import { useLogin } from "../../../core/hooks/useAuth";
import { useAuthContext } from "../../../core/context/AuthContext";

// Validation Schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Email formatı düzgün deyil")
    .required("Email tələb olunur"),
  password: Yup.string()
    .min(6, "Şifrə ən azı 6 simvol olmalıdır")
    .required("Şifrə tələb olunur"),
  rememberMe: Yup.boolean(),
});

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  
  // Create login mutation with navigation callback
  const loginMutation = useLogin(() => {
    console.log("Login successful, navigating to home...");
    navigate("/", { replace: true });
  });

  // Redirect to home when authenticated (fallback)
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
    rememberMe: false,
  };

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      // Navigation will happen automatically via onSuccessCallback in useLogin hook
    } catch (error: any) {
      // Error handling is done in the mutation
      console.error("Login error:", error);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory</h1>
        </div>

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            Welcome 👋
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Please login here</p>
        </div>

        {/* Error Message */}
        {loginMutation.isError && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3">
            <p className="text-sm text-error">
              {(loginMutation.error as any)?.error?.message ||
                "Giriş zamanı xəta baş verdi"}
            </p>
          </div>
        )}

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form className="space-y-4">
              <div>
                <Field
                  as={Input}
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="example@mail.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && errors.email ? errors.email : undefined}
                />
              </div>

              <div>
                <Field
                  as={Input}
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.password && errors.password ? errors.password : undefined
                  }
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Field
                    type="checkbox"
                    name="rememberMe"
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2"
                  />
                  <span className="text-neutral-600">Remember Me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary-500 hover:text-primary-600 hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full mt-4 py-3"
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
};

