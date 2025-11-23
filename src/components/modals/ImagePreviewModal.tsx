import React from "react";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
    open: boolean;
    imageUrl: string | null;
    altText?: string;
    onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    open,
    imageUrl,
    altText = "Preview",
    onClose,
}) => {
    if (!open || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>
                <img
                    src={imageUrl}
                    alt={altText}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};
