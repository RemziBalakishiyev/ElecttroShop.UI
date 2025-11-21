import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../../../components/commons/Input";
import { Button } from "../../../components/commons/Button";
import { AuthLayout } from "../components/AuthLayout";
import { ChevronLeft } from "lucide-react";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Send OTP to:", email);
    // TODO: API çağırışı əlavə et
    // After successful OTP send, navigate to enter-otp
    navigate("/enter-otp");
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="font-medium">Back</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Forgot Password
          </h1>
          <p className="text-sm text-neutral-600">
            Enter your registered email address. we'll send you a code to reset
            your password.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="mathew.west@ienetworksolutions.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button variant="primary" className="w-full py-3" type="submit">
            Send OTP
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};



