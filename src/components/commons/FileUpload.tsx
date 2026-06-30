import React, { useRef } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "../../utils/cn";
import { useTheme } from "../../core/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface FileUploadProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (file: File | null) => void;
  onChangeMultiple?: (files: File[]) => void;
  error?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  required,
  placeholder = "Choose file",
  accept,
  multiple = false,
  onChange,
  onChangeMultiple,
  error,
  className,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (multiple && files && files.length > 0) {
      const fileArray = Array.from(files);
      setFileName(t('common.files_selected', { count: fileArray.length }));
      onChangeMultiple?.(fileArray);
    } else if (!multiple) {
      const file = files?.[0] || null;
      setFileName(file?.name || "");
      onChange?.(file);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className={cn(
          "text-sm font-medium",
          theme === "light" ? "text-neutral-700" : "text-neutral-300"
        )}>
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative border rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:border-primary-400",
          "focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400",
          theme === "light"
            ? "border-neutral-300 bg-white"
            : "border-neutral-700 bg-neutral-800",
          error && "border-error"
        )}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Paperclip size={16} className={theme === "light" ? "text-neutral-400" : "text-neutral-500"} />
          <span className={cn(
            "flex-1",
            fileName
              ? theme === "light" ? "text-neutral-900" : "text-white"
              : theme === "light" ? "text-neutral-400" : "text-neutral-500"
          )}>
            {fileName || placeholder}
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {error && <p className="text-xs text-error mt-0.5">{error}</p>}
    </div>
  );
};



