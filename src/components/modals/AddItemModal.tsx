import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, ImagePlus, Package, Layers, Wand2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ImageEnhancementModal } from "./ImageEnhancementModal";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { FileUpload } from "../commons/FileUpload";
import { Textarea } from "../commons/Textarea";
import { ConfirmationModal } from "../commons/ConfirmationModal";
import { categoriesApi } from "../../core/api/categories.api";
import type { CategoryAttribute } from "../../core/api/categories.api";
import { brandsApi } from "../../core/api/brands.api";
import { productsApi } from "../../core/api/products.api";
import type {
  Product,
  ProductVariant,
  InlineProductAttribute,
} from "../../core/api/products.api";
import { ProductInlineAttributesSection } from "../forms/ProductInlineAttributesSection";
import { ProductVariantMatrixSection } from "../forms/ProductVariantMatrixSection";
import { useTranslation } from "react-i18next";
import type { ProductFormSubmitData } from "../../utils/productSave";
import { validateProductFormForSave } from "../../utils/productSave";
import { getImageUrl } from "../../utils/imageUrl";
import {
  buildAttributeTypeRegistry,
  buildEffectiveAttributes,
  mapCategoryAttributesToInline,
  type FormVariantRow,
} from "../../utils/productAttributes";
import { useToast } from "../../core/providers/ToastContext";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: ProductFormSubmitData) => void | Promise<void>;
  initialData?: Product | null;
}

interface ExistingImagePreview {
  id?: string;
  imageId?: string;
  url: string;
  isPrimary?: boolean;
}

interface ProductFormState {
  type: string;
  images: File[];
  price: string;
  currency: string;
  description: string;
  itemName: string;
  itemNumber: string;
  amount: string;
  category: string;
  manufacturer: string;
  inlineAttributes: InlineProductAttribute[];
  variants: FormVariantRow[];
  rowVersion?: number;
  originalCategoryId: string;
}

const getProductExistingImages = (product: Product): ExistingImagePreview[] => {
  const result: ExistingImagePreview[] = [];
  const seenIds = new Set<string>();

  const addImage = (
    url: string | null | undefined,
    meta?: Pick<ExistingImagePreview, "id" | "imageId" | "isPrimary">
  ) => {
    if (!url?.trim()) return;
    if (meta?.imageId && seenIds.has(meta.imageId)) return;
    if (meta?.imageId) seenIds.add(meta.imageId);
    result.push({ ...meta, url: getImageUrl(url) });
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
): FormVariantRow[] => {
  if (!variants?.length) return [];
  return variants.map((variant) => ({
    id: variant.id,
    imageId: variant.imageId,
    attributes: { ...(variant.attributes ?? {}) },
    isActive: variant.isActive,
    _localKey: variant.id,
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

const emptyForm = (): ProductFormState => ({
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
  inlineAttributes: [],
  variants: [],
  originalCategoryId: "",
});

export const AddItemModal: React.FC<AddItemModalProps> = ({
  open,
  onClose,
  onAdd,
  initialData,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const { data: categoriesLookup } = useQuery({
    queryKey: ["categories-lookup-all"],
    queryFn: async () => {
      const response = await categoriesApi.getLookup({ includeAll: true });
      const lookupData = (response as { value?: { items?: unknown[] } }).value || response;
      return (lookupData as { items?: { key: string; value: string }[] })?.items || [];
    },
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });

  const { data: brandsLookup } = useQuery({
    queryKey: ["brands-lookup"],
    queryFn: async () => {
      const response = await brandsApi.getLookup();
      const lookupData = (response as { value?: { items?: unknown[] } }).value || response;
      return (lookupData as { items?: { key: string; value: string }[] })?.items || [];
    },
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });

  const [formData, setFormData] = useState<ProductFormState>(emptyForm());
  const [existingImages, setExistingImages] = useState<ExistingImagePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [categoryChangeOpen, setCategoryChangeOpen] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [enhancingImageIndex, setEnhancingImageIndex] = useState<number | null>(null);
  const formInitKeyRef = useRef<string | null>(null);
  const attributeRegistryRef = useRef(buildAttributeTypeRegistry([], []));

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

  useEffect(() => {
    if (!open || !resolvedProduct) return;
    setExistingImages(getProductExistingImages(resolvedProduct));
  }, [open, resolvedProduct]);

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
      const categoryId = resolveLookupKey(
        resolvedProduct.categoryId,
        resolvedProduct.categoryName,
        categoriesLookup
      );
      setFormData({
        type: "",
        images: [],
        price: String(resolvedProduct.price),
        currency: resolvedProduct.currency,
        description: resolvedProduct.description || "",
        itemName: resolvedProduct.name,
        itemNumber: resolvedProduct.sku,
        amount: String(resolvedProduct.stock),
        category: categoryId,
        manufacturer: resolveLookupKey(
          resolvedProduct.brandId,
          resolvedProduct.brandName,
          brandsLookup
        ),
        inlineAttributes: mapCategoryAttributesToInline(
          resolvedProduct.categoryAttributes ?? []
        ),
        variants: mapProductVariantsToForm(resolvedProduct.variants),
        rowVersion: resolvedProduct.rowVersion,
        originalCategoryId: categoryId,
      });
    } else if (!initialData) {
      setExistingImages([]);
      setFormData(emptyForm());
    }
  }, [
    open,
    initialData,
    resolvedProduct,
    categoriesLookup,
    brandsLookup,
    isProductLoading,
  ]);

  const { data: categoryAttributesData } = useQuery({
    queryKey: ["category-attributes", formData.category],
    queryFn: () => categoriesApi.getCategoryAttributes(formData.category),
    enabled: open && !!formData.category,
  });

  const embeddedAttributes: CategoryAttribute[] =
    resolvedProduct?.categoryAttributes ?? [];
  const fetchedList = Array.isArray(categoryAttributesData)
    ? categoryAttributesData
    : [];

  const categoryAttributes: CategoryAttribute[] = (
    fetchedList.length > 0 ? fetchedList : embeddedAttributes
  )
    .map((attr) => ({
      ...attr,
      values: [...(attr.values || [])].sort(
        (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
      ),
    }))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  attributeRegistryRef.current = buildAttributeTypeRegistry(
    categoryAttributes,
    formData.inlineAttributes
  );

  const effectiveAttributes = useMemo(
    () =>
      buildEffectiveAttributes(categoryAttributes, formData.inlineAttributes),
    [categoryAttributes, formData.inlineAttributes]
  );

  const applyCategoryChange = (newCategoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category: newCategoryId,
      variants: [],
      inlineAttributes: [],
    }));
    setCategoryChangeOpen(false);
    setPendingCategoryId(null);
  };

  const handleCategorySelect = (newCategoryId: string) => {
    if (newCategoryId === formData.category) return;

    const hasActiveVariants = formData.variants.some((v) => v.isActive !== false);
    const categoryChanged =
      !!formData.originalCategoryId &&
      formData.originalCategoryId !== newCategoryId;

    if (hasActiveVariants && (categoryChanged || formData.variants.length > 0)) {
      setPendingCategoryId(newCategoryId);
      setCategoryChangeOpen(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      category: newCategoryId,
      ...(prev.originalCategoryId !== newCategoryId
        ? { variants: [], inlineAttributes: [] }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateProductFormForSave(
      {
        ...formData,
        originalCategoryId: formData.originalCategoryId || formData.category,
      },
      categoryAttributes
    );
    if (!validation.valid) {
      toast.error(validation.message || "Formada xəta var");
      return;
    }

    if (initialData?.id && formData.rowVersion === undefined) {
      toast.error("Məhsul versiyası (rowVersion) tapılmadı. Səhifəni yeniləyin.");
      return;
    }

    const existingImageIds = existingImages
      .map((img) => img.imageId)
      .filter((id): id is string => !!id);

    setSubmitting(true);
    try {
      await onAdd({
        itemName: formData.itemName,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        itemNumber: formData.itemNumber,
        category: formData.category,
        manufacturer: formData.manufacturer,
        amount: formData.amount,
        images: formData.images,
        existingImageIds,
        inlineAttributes: formData.inlineAttributes,
        variants: formData.variants,
        rowVersion: formData.rowVersion,
        originalCategoryId: formData.originalCategoryId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions =
    categoriesLookup?.map((item: { key: string; value: string }) => ({
      label: item.value,
      value: item.key,
    })) || [];
  const brandOptions =
    brandsLookup?.map((item: { key: string; value: string }) => ({
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
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-3 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          <p className="text-sm text-neutral-500">Məhsul məlumatları yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl relative w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/80 shrink-0">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary-50 rounded-xl border border-primary-100">
                <Package size={20} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 leading-tight">
                  {isEditMode
                    ? t("modals.add_product.title_edit")
                    : t("modals.add_product.title_add")}
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

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <section className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus size={16} className="text-primary-600" />
                    <span className="text-sm font-semibold text-neutral-800">
                      {t("modals.add_product.image")}
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
                        className="group relative aspect-square rounded-xl border-2 border-neutral-200 bg-white overflow-hidden shadow-sm"
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
                        {/* AI enhance button */}
                        <button
                          type="button"
                          onClick={() => setEnhancingImageIndex(idx)}
                          className="absolute bottom-1.5 left-1.5 p-1 bg-violet-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="AI ilə yaxşılaşdır"
                        >
                          <Wand2 size={12} />
                        </button>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== idx),
                            });
                          }}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <FileUpload
                  accept="image/*"
                  multiple
                  placeholder="Şəkillər seçin və ya buraya sürükləyin"
                  onChangeMultiple={(files) => {
                    if (files?.length) {
                      setFormData((prev) => ({
                        ...prev,
                        images: [...prev.images, ...files],
                      }));
                    }
                  }}
                />
              </section>

              <section className="rounded-xl border border-neutral-200 p-4 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                  <Package size={16} className="text-neutral-500" />
                  <span className="text-sm font-semibold text-neutral-800">
                    Əsas məlumat
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t("modals.add_product.name")}
                    required
                    value={formData.itemName}
                    onChange={(e) =>
                      setFormData({ ...formData, itemName: e.target.value })
                    }
                  />
                  <Input
                    label={t("modals.add_product.sku")}
                    required
                    value={formData.itemNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, itemNumber: e.target.value })
                    }
                    disabled={isEditMode}
                  />
                  <Select
                    label={t("modals.add_product.category")}
                    required
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                  />
                  <Select
                    label={t("modals.add_product.brand")}
                    required
                    options={brandOptions}
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 p-4 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-neutral-100">
                  <Layers size={16} className="text-neutral-500" />
                  <span className="text-sm font-semibold text-neutral-800">
                    Qiymət & Stok
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label={t("modals.add_product.price")}
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <Select
                    label={t("modals.add_product.currency")}
                    required
                    options={currencyOptions}
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                  />
                  <Input
                    label={t("modals.add_product.stock")}
                    required
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
                <Textarea
                  label={t("modals.add_product.description")}
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </section>

              {formData.category && (
                <>
                  <ProductInlineAttributesSection
                    inlineAttributes={formData.inlineAttributes}
                    onChange={(inlineAttributes) =>
                      setFormData((prev) => ({ ...prev, inlineAttributes }))
                    }
                    categoryAttributes={categoryAttributes}
                    registry={attributeRegistryRef.current}
                  />
                  <ProductVariantMatrixSection
                    variants={formData.variants}
                    onChange={(variants) =>
                      setFormData((prev) => ({ ...prev, variants }))
                    }
                    effectiveAttributes={effectiveAttributes}
                    registry={attributeRegistryRef.current}
                  />
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50/80 shrink-0">
              <Button variant="outline" onClick={onClose} type="button">
                {t("modals.add_product.cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="min-w-[120px]"
                disabled={submitting}
              >
                {submitting
                  ? "..."
                  : isEditMode
                    ? t("modals.add_product.update")
                    : t("modals.add_product.add")}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        open={categoryChangeOpen}
        title="Kateqoriya dəyişikliyi"
        message="Kateqoriya dəyişdikdə mövcud variantlar və inline atributlar silinəcək. Variant kombinasiyalarını yeni kateqoriya üçün yenidən təyin etməlisiniz."
        variant="warning"
        confirmLabel="Davam et"
        onConfirm={() => {
          if (pendingCategoryId) applyCategoryChange(pendingCategoryId);
        }}
        onCancel={() => {
          setCategoryChangeOpen(false);
          setPendingCategoryId(null);
        }}
      />

      {/* AI Image Enhancement Modal */}
      {enhancingImageIndex !== null && formData.images[enhancingImageIndex] && (
        <ImageEnhancementModal
          open
          file={formData.images[enhancingImageIndex]}
          onApply={(enhancedFile) => {
            const updated = [...formData.images];
            updated[enhancingImageIndex] = enhancedFile;
            setFormData((prev) => ({ ...prev, images: updated }));
            setEnhancingImageIndex(null);
          }}
          onCancel={() => setEnhancingImageIndex(null)}
        />
      )}
    </>
  );
};
