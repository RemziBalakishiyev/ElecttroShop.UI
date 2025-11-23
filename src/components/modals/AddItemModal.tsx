import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { FileUpload } from "../commons/FileUpload";
import { Textarea } from "../commons/Textarea";
import { categoriesApi } from "../../core/api/categories.api";
import { brandsApi } from "../../core/api/brands.api";
import type { Product } from "../../core/api/products.api";
import { API_CONFIG } from "../../core/config/api.config";
import { useTranslation } from "react-i18next";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  initialData?: Product | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  open,
  onClose,
  onAdd,
  initialData,
}) => {
  const { t } = useTranslation();
  // Fetch dynamic options
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories({ pageSize: 100 }),
    enabled: open,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => brandsApi.getBrands({ pageSize: 100 }),
    enabled: open,
  });

  const [formData, setFormData] = useState({
    // Left Column
    type: "",
    image: null as File | null,
    price: "",
    currency: "AZN",
    description: "",

    // Right Column
    itemName: "",
    itemNumber: "", // SKU
    amount: "", // Stock
    category: "",
    manufacturer: "", // Brand
  });

  // Populate form when initialData changes (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: "", // Not in Product type, maybe category?
        image: null, // Can't pre-fill file input
        price: String(initialData.price),
        currency: initialData.currency,
        description: initialData.description || "",
        itemName: initialData.name,
        itemNumber: initialData.sku,
        amount: String(initialData.stock),
        category: initialData.categoryId,
        manufacturer: initialData.brandId,
      });
    } else {
      // Reset form
      setFormData({
        type: "",
        image: null,
        price: "",
        currency: "AZN",
        description: "",
        itemName: "",
        itemNumber: "",
        amount: "",
        category: "",
        manufacturer: "",
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    // Don't close here, let parent handle it (e.g. after async success)
  };

  const categoryOptions = categories?.value?.map((c: any) => ({ label: c.name, value: c.id })) || [];
  const brandOptions = brands?.value?.map((b: any) => ({ label: b.name, value: b.id })) || [];

  const currencyOptions = [
    { label: "AZN (₼)", value: "AZN" },
    { label: "USD ($)", value: "USD" },
    { label: "EUR (€)", value: "EUR" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl relative w-full max-w-5xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">
            {initialData ? t('modals.add_product.title_edit') : t('modals.add_product.title_add')}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {initialData?.imageUrl && !formData.image && (
                <div className="relative w-full h-48 mb-2 rounded-lg overflow-hidden border border-neutral-200">
                  <img
                    src={initialData.imageUrl.startsWith("http") ? initialData.imageUrl : `${API_CONFIG.BASE_URL}${initialData.imageUrl}`}
                    alt="Current product"
                    className="w-full h-full object-contain bg-neutral-50"
                  />
                </div>
              )}

              <FileUpload
                label={t('modals.add_product.image')}
                accept="image/*"
                onChange={(file) => setFormData({ ...formData, image: file })}
              />

              <Input
                label={t('modals.add_product.price')}
                required
                type="number"
                placeholder={t('modals.add_product.price_placeholder')}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />

              <Select
                label={t('modals.add_product.currency')}
                required
                options={currencyOptions}
                placeholder={t('modals.add_product.currency_placeholder')}
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              />

              <Textarea
                label={t('modals.add_product.description')}
                placeholder={t('modals.add_product.description_placeholder')}
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Input
                label={t('modals.add_product.name')}
                required
                placeholder={t('modals.add_product.name_placeholder')}
                value={formData.itemName}
                onChange={(e) =>
                  setFormData({ ...formData, itemName: e.target.value })
                }
              />

              <Input
                label={t('modals.add_product.sku')}
                required
                placeholder={t('modals.add_product.sku_placeholder')}
                value={formData.itemNumber}
                onChange={(e) =>
                  setFormData({ ...formData, itemNumber: e.target.value })
                }
              />

              <Input
                label={t('modals.add_product.stock')}
                required
                type="number"
                placeholder={t('modals.add_product.stock_placeholder')}
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />

              <Select
                label={t('modals.add_product.category')}
                required
                options={categoryOptions}
                placeholder={t('modals.add_product.category_placeholder')}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />

              <Select
                label={t('modals.add_product.brand')}
                required
                options={brandOptions}
                placeholder={t('modals.add_product.brand_placeholder')}
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
            <Button variant="outline" onClick={onClose} className="px-8" type="button">
              {t('modals.add_product.cancel')}
            </Button>
            <Button variant="primary" type="submit" className="px-8">
              {initialData ? t('modals.add_product.update') : t('modals.add_product.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};



