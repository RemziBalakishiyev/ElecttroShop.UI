import React, { useRef } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "../../utils/cn";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string>("");

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (multiple && files && files.length > 0) {
      const fileArray = Array.from(files);
      setFileName(`${fileArray.length} fayl seçildi`);
      onChangeMultiple?.(fileArray);
    } else if (!multiple) {
      const file = files?.[0] || null;
      setFileName(file?.name || "");
      onChange?.(file);
    }
    
    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <div
        onClick={handleClick}
        className={cn(
          "relative border border-neutral-300 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all hover:border-primary-400",
          "focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400",
          error && "border-error"
        )}
      >
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-neutral-400" />
          <span className={cn("flex-1", fileName ? "text-neutral-900" : "text-neutral-400")}>
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



