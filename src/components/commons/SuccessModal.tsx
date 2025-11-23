import React from "react";
import { Button } from "./Button";
import { useTranslation } from "react-i18next";

interface SuccessModalProps {
  open: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick: () => void;
  emoji?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  open,
  title,
  message,
  buttonText,
  onButtonClick,
  emoji = "🎉",
}) => {
  const { t } = useTranslation();
  const finalButtonText = buttonText || t('common.continue');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Emoji */}
        <div className="text-6xl">{emoji}</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>

        {/* Message */}
        <p className="text-neutral-600">{message}</p>

        {/* Button */}
        <Button
          variant="primary"
          className="w-full py-3"
          onClick={onButtonClick}
        >
          {finalButtonText}
        </Button>
      </div>
    </div>
  );
};



