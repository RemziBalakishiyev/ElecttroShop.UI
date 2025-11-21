import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../../components/commons/Button";
import { AuthLayout } from "../components/AuthLayout";
import { ChevronLeft } from "lucide-react";

export const EnterOTPPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Only process if pasted data is 4 digits
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[3]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    console.log("Verifying OTP:", fullOtp);
    // TODO: API çağırışı əlavə et
    // After successful OTP verification, navigate to reset-password
    navigate("/reset-password");
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="font-medium">Back</span>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Enter OTP
          </h1>
          <p className="text-sm text-neutral-600">
            We have share a code of your registered email address{" "}
            <span className="font-medium text-neutral-900">
              mathew.west@ienetworksolutions.com
            </span>
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input Fields */}
          <div className="flex justify-between gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-16 h-16 text-center text-2xl font-bold text-neutral-900 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-all"
                required
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button variant="primary" className="w-full py-3" type="submit">
            Verify
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};
