import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./Button";
import { Select } from "./Select";
import { Input } from "./Input";
import { X } from "lucide-react";
import { categoriesApi } from "../../core/api/categories.api";
import { brandsApi } from "../../core/api/brands.api";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: {
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Fetch dynamic options using lookup APIs
  const { data: categoriesLookup } = useQuery({
    queryKey: ["categories-lookup"],
    queryFn: async () => {
      const response = await categoriesApi.getLookup();
      // Response structure: { value: { items: [...] } } or { items: [...] }
      const lookupData = (response as any)?.value || response;
      return lookupData?.items || [];
    },
    enabled: open,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });

  const { data: brandsLookup } = useQuery({
    queryKey: ["brands-lookup"],
    queryFn: async () => {
      const response = await brandsApi.getLookup();
      // Response structure: { value: { items: [...] } } or { items: [...] }
      const lookupData = (response as any)?.value || response;
      return lookupData?.items || [];
    },
    enabled: open,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });

  if (!open) return null;

  const handleApply = () => {
    onApply({
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setCategoryId("");
    setBrandId("");
    setMinPrice("");
    setMaxPrice("");
  };

  const categoryOptions = categoriesLookup?.map((item: any) => ({ 
    label: item.value, 
    value: item.key 
  })) || [];
  const brandOptions = brandsLookup?.map((item: any) => ({ 
    label: item.value, 
    value: item.key 
  })) || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={cn(
        "rounded-xl shadow-2xl p-6 relative w-full max-w-md",
        theme === "light" ? "bg-white" : "bg-neutral-800"
      )}>
        {/* Close Button */}
        <button
          className={cn(
            "absolute top-4 right-4 transition-colors",
            theme === "light"
              ? "text-neutral-400 hover:text-neutral-600"
              : "text-neutral-500 hover:text-neutral-300"
          )}
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className={cn(
          "text-xl font-bold mb-6",
          theme === "light" ? "text-neutral-900" : "text-white"
        )}>{t('modals.filter.title')}</h2>

        <div className="space-y-6">
          {/* Category */}
          <div>
            <h3 className={cn(
              "text-sm font-bold mb-3",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>{t('modals.filter.category')}</h3>
            <Select
              options={categoryOptions}
              placeholder={t('modals.filter.category_placeholder')}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div>
            <h3 className={cn(
              "text-sm font-bold mb-3",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>{t('modals.filter.brand')}</h3>
            <Select
              options={brandOptions}
              placeholder={t('modals.filter.brand_placeholder')}
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            />
          </div>

          {/* Price Range */}
          <div>
            <h3 className={cn(
              "text-sm font-bold mb-3",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>{t('modals.filter.price_range')}</h3>
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder={t('modals.filter.min')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                type="number"
                placeholder={t('modals.filter.max')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={cn(
          "flex justify-end gap-3 mt-8 pt-6 border-t",
          theme === "light" ? "border-neutral-200" : "border-neutral-700"
        )}>
          <Button variant="outline" onClick={handleReset} className="px-6">
            {t('modals.filter.reset')}
          </Button>
          <Button variant="primary" onClick={handleApply} className="px-6">
            {t('modals.filter.apply')}
          </Button>
        </div>
      </div>
    </div>
  );
};

