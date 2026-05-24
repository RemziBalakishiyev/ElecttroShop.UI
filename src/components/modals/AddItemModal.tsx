import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Plus, Trash2, ImagePlus, Package, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { FileUpload } from "../commons/FileUpload";
import { Textarea } from "../commons/Textarea";
import { categoriesApi } from "../../core/api/categories.api";
import type { CategoryAttribute } from "../../core/api/categories.api";
import { brandsApi } from "../../core/api/brands.api";
import { productsApi } from "../../core/api/products.api";
import type {
  Product,
  ProductVariant,
  CreateProductVariantRequest,
} from "../../core/api/products.api";
import { API_CONFIG } from "../../core/config/api.config";
import { useTranslation } from "react-i18next";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  initialData?: Product | null;
}

interface ExistingImagePreview {
  id?: string;
  imageId?: string;
  url: string;
  isPrimary?: boolean;
}

type EditFormVariant = CreateProductVariantRequest & {
  id?: string;
  isActive?: boolean;
};

const buildProductImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) return `${API_CONFIG.BASE_URL}${url}`;
  return `${API_CONFIG.BASE_URL}/api/images/${url}`;
};

const getProductExistingImages = (product: Product): ExistingImagePreview[] => {
  const result: ExistingImagePreview[] = [];
  const seenIds = new Set<string>();

  const addImage = (
    url: string | null | undefined,
    meta?: Pick<ExistingImagePreview, "id" | "imageId" | "isPrimary">
  ) => {
    if (meta?.imageId && seenIds.has(meta.imageId)) return;
    const fullUrl = buildProductImageUrl(url);
    if (!fullUrl) return;
    if (meta?.imageId) seenIds.add(meta.imageId);
    result.push({ ...meta, url: fullUrl });
  };

  if (product.images?.length) {
    const sortedImages = [...product.images].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
    for (const img of sortedImages) {
      if (img.imageUrl) {
        addImage(img.imageUrl, {
          id: img.id,
          imageId: img.imageId,
          isPrimary: img.isPrimary,
        });
      } else if (img.imageId) {
        addImage(img.imageId, {
          id: img.id,
          imageId: img.imageId,
          isPrimary: img.isPrimary,
        });
      }
    }
  }

  if (result.length === 0) {
    if (product.imageId) {
      addImage(product.imageId, { imageId: product.imageId, isPrimary: true });
    } else {
      addImage(product.primaryImageUrl, { isPrimary: true });
      addImage(product.imageUrl);
    }
  }

  return result;
};

const mapProductVariantsToForm = (
  variants?: ProductVariant[]
): EditFormVariant[] => {
  if (!variants?.length) return [];
  return variants.map((variant) => ({
    id: variant.id,
    imageId: variant.imageId,
    attributes: { ...(variant.attributes ?? {}) },
    isActive: variant.isActive,
  }));
};

const resolveLookupKey = (
  id: string | undefined | null,
  name: string | undefined | null,
  lookup: { key: string; value: string }[] | undefined
): string => {
  if (id) return id;
  if (name && lookup?.length) {
    const match = lookup.find((item) => item.value === name);
    return match?.key ?? "";
  }
  return "";
};

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
    variants: [] as EditFormVariant[],
  });
  const [existingImages, setExistingImages] = useState<ExistingImagePreview[]>([]);
  const formInitKeyRef = useRef<string | null>(null);

  const { data: fetchedProductData, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", initialData?.id],
    queryFn: () => productsApi.getProductById(initialData!.id),
    enabled: open && !!initialData?.id,
    refetchOnMount: "always",
  });

  const resolvedProduct = useMemo((): Product | null => {
    if (!initialData) return null;
    if (!initialData.id) return initialData;
    if (!fetchedProductData) return null;
    return fetchedProductData;
  }, [initialData, fetchedProductData]);

  // Sync images whenever fresh product data arrives
  useEffect(() => {
    if (!open || !resolvedProduct) return;
    setExistingImages(getProductExistingImages(resolvedProduct));
  }, [open, resolvedProduct]);

  // Populate form once when modal opens (avoid resetting while user edits)
  useEffect(() => {
    if (!open) {
      formInitKeyRef.current = null;
      return;
    }

    if (!categoriesLookup || !brandsLookup) return;
    if (initialData?.id && (isProductLoading || !resolvedProduct)) return;

    const initKey = resolvedProduct?.id ?? "__new__";
    if (formInitKeyRef.current === initKey) return;

    formInitKeyRef.current = initKey;

    if (resolvedProduct) {
      setFormData({
        type: "",
        images: [],
        price: String(resolvedProduct.price),
        currency: resolvedProduct.currency,
        description: resolvedProduct.description || "",
        itemName: resolvedProduct.name,
        itemNumber: resolvedProduct.sku,
        amount: String(resolvedProduct.stock),
        category: resolveLookupKey(
          resolvedProduct.categoryId,
          resolvedProduct.categoryName,
          categoriesLookup
        ),
        manufacturer: resolveLookupKey(
          resolvedProduct.brandId,
          resolvedProduct.brandName,
          brandsLookup
        ),
        variants: mapProductVariantsToForm(resolvedProduct.variants),
      });
    } else if (!initialData) {
      setExistingImages([]);
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
  }, [
    open,
    initialData,
    resolvedProduct,
    categoriesLookup,
    brandsLookup,
    isProductLoading,
  ]);

  // Fetch category attributes when category is selected
  const { data: categoryAttributesData } = useQuery({
    queryKey: ["category-attributes", formData.category],
    queryFn: () => categoriesApi.getCategoryAttributes(formData.category),
    enabled: open && !!formData.category,
  });

  // Process and sort attributes by displayOrder
  const embeddedAttributes: CategoryAttribute[] =
    resolvedProduct?.categoryAttributes ?? [];
  const fetchedList = Array.isArray(categoryAttributesData)
    ? categoryAttributesData
    : [];

  const rawAttributes: CategoryAttribute[] =
    fetchedList.length > 0 ? fetchedList : embeddedAttributes;
  
  const categoryAttributes: CategoryAttribute[] = rawAttributes
    .map(attr => ({
      ...attr,
      // Sort values by displayOrder
      values: [...(attr.values || [])].sort((a, b) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
      ),
    }))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingImageIds = existingImages
      .map((img) => img.imageId)
      .filter((id): id is string => !!id);
    onAdd({ ...formData, existingImageIds });
  };

  const categoryOptions = categoriesLookup?.map((item: { key: string; value: string }) => ({
    label: item.value,
    value: item.key,
  })) || [];
  const brandOptions = brandsLookup?.map((item: { key: string; value: string }) => ({
    label: item.value,
    value: item.key,
  })) || [];

  const currencyOptions = [
    { label: "AZN (₼)", value: "AZN" },
    { label: "USD ($)", value: "USD" },
    { label: "EUR (€)", value: "EUR" },
  ];

  const totalImages = existingImages.length + formData.images.length;
  const isEditMode = !!initialData;
  const isFormLoading =
    isEditMode && !!initialData?.id && (isProductLoading || !resolvedProduct);

  if (!open) return null;

  if (isFormLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <p className="text-sm text-neutral-500">Məhsul məlumatları yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-4xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/80 shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary-50 rounded-xl border border-primary-100">
              <Package size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 leading-tight">
                {isEditMode ? t('modals.add_product.title_edit') : t('modals.add_product.title_add')}
              </h2>
              {isEditMode && initialData?.name && (
                <p className="text-sm text-neutral-500 mt-0.5 truncate max-w-md">
                  {initialData.name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Images */}
            <section className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImagePlus size={16} className="text-primary-600" />
                  <span className="text-sm font-semibold text-neutral-800">
                    {t('modals.add_product.image')}
                  </span>
                  <span className="text-xs font-medium text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded-full">
                    {totalImages}
                  </span>
                </div>
              </div>

              {(existingImages.length > 0 || formData.images.length > 0) && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-3">
                  {existingImages.map((img, idx) => (
                    <div
                      key={img.id || img.imageId || `existing-${idx}`}
                      className="group relative aspect-square rounded-xl border-2 border-neutral-200 bg-white overflow-hidden shadow-sm hover:border-primary-300 transition-colors"
                    >
                      <img
                        src={img.url}
                        alt={`Existing ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-primary-600 text-white px-1.5 py-0.5 rounded">
                          Əsas
                        </span>
                      )}
                    </div>
                  ))}
                  {formData.images.map((img, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="group relative aspect-square rounded-xl border-2 border-dashed border-primary-200 bg-white overflow-hidden shadow-sm"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== idx);
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <FileUpload
                accept="image/*"
                multiple={true}
                placeholder="Şəkillər seçin və ya buraya sürükləyin"
                className="[&>div]:border-dashed [&>div]:bg-white [&>div]:py-3 [&>div]:hover:border-primary-400 [&>div]:hover:bg-primary-50/30"
                onChangeMultiple={(files) => {
                  if (files && files.length > 0) {
                    setFormData((prev) => ({
                      ...prev,
                      images: [...prev.images, ...files],
                    }));
                  }
                }}
              />
            </section>

            {/* Basic info */}
            <section className="rounded-xl border border-neutral-200 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                <Package size={16} className="text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-800">Əsas məlumat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Select
                  label={t('modals.add_product.category')}
                  required
                  options={categoryOptions}
                  placeholder={t('modals.add_product.category_placeholder')}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                      variants: [],
                    }))
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
            </section>

            {/* Price & stock */}
            <section className="rounded-xl border border-neutral-200 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                <Layers size={16} className="text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-800">Qiymət & Stok</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </div>

              <Textarea
                label={t('modals.add_product.description')}
                placeholder={t('modals.add_product.description_placeholder')}
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </section>

            {/* Variants */}
            <section className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-800">Variantlar</span>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {formData.variants.length}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      variants: [
                        ...formData.variants,
                        { attributes: {} },
                      ],
                    });
                  }}
                >
                  Variant əlavə et
                </Button>
              </div>

              {categoryAttributes.length > 0 && (
                <div className="mt-3 mb-1 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-600 mb-2">
                    Kateqoriya atributları
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categoryAttributes.map((attr) => (
                      <span
                        key={attr.id}
                        className="text-xs px-2.5 py-1 bg-white border border-neutral-200 rounded-full text-neutral-700"
                      >
                        {attr.displayName}:{" "}
                        {attr.values
                          .map((v) => v.displayValue || v.value)
                          .join(", ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.variants.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-6 mt-2 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                  Bu məhsulda variant yoxdur. "Variant əlavə et" ilə RAM, Yaddaş və s. kombinasiyaları yarada bilərsiniz.
                </p>
              ) : (
                <div className="space-y-3 mt-4">
                  {formData.variants.map((variant, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-neutral-50/80 border border-neutral-200 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-neutral-800">
                          Variant {idx + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = formData.variants.filter((_, i) => i !== idx);
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {categoryAttributes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      ) : (
                        <p className="text-sm text-neutral-500">
                          Bu kateqoriya üçün atribut mövcud deyil
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50/80 shrink-0">
            <Button variant="outline" onClick={onClose} className="px-6" type="button">
              {t('modals.add_product.cancel')}
            </Button>
            <Button variant="primary" type="submit" className="px-6 min-w-[120px]">
              {isEditMode ? t('modals.add_product.update') : t('modals.add_product.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};



