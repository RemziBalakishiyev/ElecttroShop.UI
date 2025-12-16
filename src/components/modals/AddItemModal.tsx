import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { FileUpload } from "../commons/FileUpload";
import { Textarea } from "../commons/Textarea";
import { categoriesApi } from "../../core/api/categories.api";
import type { CategoryAttribute } from "../../core/api/categories.api";
import { brandsApi } from "../../core/api/brands.api";
import type { Product, CreateProductVariantRequest } from "../../core/api/products.api";
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

  const [formData, setFormData] = useState({
    // Left Column
    type: "",
    images: [] as File[],
    price: "",
    currency: "AZN",
    description: "",

    // Right Column
    itemName: "",
    itemNumber: "", // SKU
    amount: "", // Stock
    category: "",
    manufacturer: "", // Brand
    
    // Variants
    variants: [] as CreateProductVariantRequest[],
  });

  // Populate form when initialData changes (Edit Mode)
  // Wait for lookup data to be loaded before setting category and brand
  useEffect(() => {
    if (initialData && categoriesLookup && brandsLookup) {
      setFormData({
        type: "", // Not in Product type, maybe category?
        images: [], // Can't pre-fill file input
        price: String(initialData.price),
        currency: initialData.currency,
        description: initialData.description || "",
        itemName: initialData.name,
        itemNumber: initialData.sku,
        amount: String(initialData.stock),
        category: initialData.categoryId || "",
        manufacturer: initialData.brandId || "",
        variants: [],
      });
    } else if (!initialData) {
      // Reset form
      setFormData({
        type: "",
        images: [],
        price: "",
        currency: "AZN",
        description: "",
        itemName: "",
        itemNumber: "",
        amount: "",
        category: "",
        manufacturer: "",
        variants: [],
      });
    }
  }, [initialData, open, categoriesLookup, brandsLookup]);

  // Fetch category attributes when category is selected
  const { data: categoryAttributesData } = useQuery({
    queryKey: ["category-attributes", formData.category],
    queryFn: () => categoriesApi.getCategoryAttributes(formData.category),
    enabled: open && !!formData.category,
  });

  // Process and sort attributes by displayOrder
  const rawAttributes: CategoryAttribute[] = 
    (categoryAttributesData as any)?.value || categoryAttributesData || [];
  
  const categoryAttributes: CategoryAttribute[] = rawAttributes
    .map(attr => ({
      ...attr,
      // Sort values by displayOrder
      values: [...(attr.values || [])].sort((a, b) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
      ),
    }))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    // Don't close here, let parent handle it (e.g. after async success)
  };

  const categoryOptions = categoriesLookup?.map((item: any) => ({ 
    label: item.value, 
    value: item.key 
  })) || [];
  const brandOptions = brandsLookup?.map((item: any) => ({ 
    label: item.value, 
    value: item.key 
  })) || [];

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
              {initialData?.imageUrl && formData.images.length === 0 && (
                <div className="relative w-full h-48 mb-2 rounded-lg overflow-hidden border border-neutral-200">
                  <img
                    src={initialData.imageUrl.startsWith("http") ? initialData.imageUrl : `${API_CONFIG.BASE_URL}${initialData.imageUrl}`}
                    alt="Current product"
                    className="w-full h-full object-contain bg-neutral-50"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  {t('modals.add_product.image')} ({formData.images.length})
                </label>
                <FileUpload
                  accept="image/*"
                  multiple={true}
                  placeholder="Şəkillər seçin"
                  onChangeMultiple={(files) => {
                    if (files && files.length > 0) {
                      setFormData({ ...formData, images: [...formData.images, ...files] });
                    }
                  }}
                />
                {formData.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded border border-neutral-200 overflow-hidden">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== idx);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  // Reset variants when category changes
                  setFormData(prev => ({ ...prev, category: e.target.value, variants: [] }));
                }}
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

          {/* Variants Section */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Variantlar ({formData.variants.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                icon={<Plus size={16} />}
                onClick={() => {
                  setFormData({
                    ...formData,
                    variants: [
                      ...formData.variants,
                      {
                        attributes: {},
                      },
                    ],
                  });
                }}
              >
                Variant əlavə et
              </Button>
            </div>

            {formData.variants.length > 0 && (
              <div className="space-y-4">
                {formData.variants.map((variant, idx) => (
                  <div key={idx} className="p-4 border border-neutral-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-neutral-900">Variant {idx + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = formData.variants.filter((_, i) => i !== idx);
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {/* Category Attributes Dropdowns */}
                      {categoryAttributes.length > 0 ? (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-700">
                            Atributlar
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {categoryAttributes.map((attr) => (
                              <Select
                                key={attr.id}
                                label={attr.displayName}
                                required={attr.isRequired}
                                options={[
                                  { label: "Seçin", value: "" },
                                  ...attr.values.map((val) => ({
                                    label: val.displayValue || val.value,
                                    value: val.value,
                                  })),
                                ]}
                                value={variant.attributes?.[attr.attributeType] || ""}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  const newAttributes = {
                                    ...(variant.attributes || {}),
                                    [attr.attributeType]: e.target.value,
                                  };
                                  // Remove attribute if empty
                                  if (!e.target.value) {
                                    delete newAttributes[attr.attributeType];
                                  }
                                  newVariants[idx] = {
                                    ...variant,
                                    attributes: newAttributes,
                                  };
                                  setFormData({ ...formData, variants: newVariants });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-500">
                          Bu kateqoriya üçün atribut mövcud deyil
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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



