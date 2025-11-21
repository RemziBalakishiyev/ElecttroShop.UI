import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../../../components/commons/Input";
import { Button } from "../../../components/commons/Button";
import { AuthLayout } from "../components/AuthLayout";
import { ChevronLeft } from "lucide-react";
import { SuccessModal } from "../../../components/commons/SuccessModal";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // TODO: API çağırışı
    console.log("Password reset:", password);
    
    // Show success modal
    setShowSuccessModal(true);
  };

  const handleBackToLogin = () => {
    setShowSuccessModal(false);
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to="/enter-otp"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="font-medium">Back</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-neutral-600">
            Set the new password for your account so you can login and access
            all features.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button variant="primary" className="w-full py-3" type="submit">
            Update Password
          </Button>
        </form>
      </div>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        title="Password Update Successfully"
        message="Your password has been update successfully"
        buttonText="Back to Login"
        onButtonClick={handleBackToLogin}
        emoji="🎉"
      />
    </AuthLayout>
  );
};



