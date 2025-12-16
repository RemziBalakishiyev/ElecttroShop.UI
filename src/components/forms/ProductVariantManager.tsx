import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../commons/Button';
import { Select } from '../commons/Select';
import { FileUpload } from '../commons/FileUpload';
import { productsApi } from '../../core/api/products.api';
import { categoriesApi } from '../../core/api/categories.api';
import { imagesApi } from '../../core/api/images.api';
import type { ProductVariant, CreateProductVariantRequest } from '../../core/api/products.api';
import type { CategoryAttribute } from '../../core/api/categories.api';
import { useToast } from '../../core/providers/ToastContext';
import { cn } from '../../utils/cn';
import { useTheme } from '../../core/context/ThemeContext';
import { API_CONFIG } from '../../core/config/api.config';

interface ProductVariantManagerProps {
  productId: string;
  categoryId: string;
  variants?: ProductVariant[];
  onUpdate?: () => void;
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  productId,
  categoryId,
  variants = [],
  onUpdate,
}) => {
  const { theme } = useTheme();
  const toast = useToast();

  const [variantList, setVariantList] = useState<ProductVariant[]>(variants);
  const [isCreating, setIsCreating] = useState(false);
  const [editingVariant, setEditingVariant] = useState<(ProductVariant & { imageFile?: File }) | null>(null);

  const [newVariant, setNewVariant] = useState<CreateProductVariantRequest & { imageFile?: File | null }>({
    attributes: {},
    imageId: null,
    imageFile: null,
  });

  useEffect(() => {
    setVariantList(variants);
  }, [variants]);

  // Fetch category attributes
  const { data: categoryAttributesData } = useQuery({
    queryKey: ['category-attributes', categoryId],
    queryFn: () => categoriesApi.getCategoryAttributes(categoryId),
    enabled: !!categoryId,
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

  const handleAttributeChange = (attributeType: string, value: string) => {
    if (editingVariant) {
      setEditingVariant({
        ...editingVariant,
        attributes: {
          ...editingVariant.attributes,
          [attributeType]: value,
        },
      });
    } else {
      setNewVariant({
        ...newVariant,
        attributes: {
          ...newVariant.attributes,
          [attributeType]: value,
        },
      });
    }
  };

  const handleCreateVariant = async () => {
    // Check if at least one attribute is selected
    if (Object.keys(newVariant.attributes).length === 0) {
      toast.warning('Zəhmət olmasa ən azı bir atribut seçin');
      return;
    }

    setIsCreating(true);
    try {
      let imageId = newVariant.imageId;

      // Upload image if provided
      if (newVariant.imageFile) {
        try {
          const imageResponse = await imagesApi.uploadImage(newVariant.imageFile);
          const uploadedImage = (imageResponse as any).value || imageResponse;
          imageId = uploadedImage?.id;
        } catch (imgErr: any) {
          console.error('Variant şəkli yüklənə bilmədi:', imgErr);
          
          // Handle validation errors
          if (imgErr?.error?.errors && Array.isArray(imgErr.error.errors)) {
            const errorMessages = imgErr.error.errors.map((e: any) => e.message).join(', ');
            toast.error(errorMessages || imgErr.error.message || 'Şəkil yüklənə bilmədi');
          } else if (imgErr?.error?.message) {
            toast.error(imgErr.error.message);
          } else if (imgErr?.message) {
            toast.error(imgErr.message);
          } else {
            toast.error('Şəkil yüklənə bilmədi');
          }
          return;
        }
      }

      const variantData: CreateProductVariantRequest = {
        imageId: imageId || null,
        attributes: newVariant.attributes,
      };

      await productsApi.createProductVariant(productId, variantData);
      toast.success('Variant uğurla yaradıldı');

      // Reset form
      setNewVariant({
        attributes: {},
        imageId: null,
        imageFile: null,
      });

      onUpdate?.();
    } catch (error: any) {
      console.error('Variant yaratma xətası:', error);
      
      // Handle validation errors
      if (error?.error?.errors && Array.isArray(error.error.errors)) {
        // Multiple validation errors
        const errorMessages = error.error.errors.map((e: any) => e.message).join(', ');
        toast.error(errorMessages || error.error.message || 'Variant yaradıla bilmədi');
      } else if (error?.error?.message) {
        // Single error message
        toast.error(error.error.message);
      } else if (error?.message) {
        // Direct error message
        toast.error(error.message);
      } else {
        toast.error('Variant yaradıla bilmədi');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant) return;

    // Check if at least one attribute is selected
    if (Object.keys(editingVariant.attributes).length === 0) {
      toast.warning('Zəhmət olmasa ən azı bir atribut seçin');
      return;
    }

    try {
      let imageId = editingVariant.imageId;

      // Upload image if provided
      if (editingVariant.imageFile) {
        try {
          const imageResponse = await imagesApi.uploadImage(editingVariant.imageFile);
          const uploadedImage = (imageResponse as any).value || imageResponse;
          imageId = uploadedImage?.id;
        } catch (imgErr: any) {
          console.error('Variant şəkli yüklənə bilmədi:', imgErr);
          
          // Handle validation errors
          if (imgErr?.error?.errors && Array.isArray(imgErr.error.errors)) {
            const errorMessages = imgErr.error.errors.map((e: any) => e.message).join(', ');
            toast.error(errorMessages || imgErr.error.message || 'Şəkil yüklənə bilmədi');
          } else if (imgErr?.error?.message) {
            toast.error(imgErr.error.message);
          } else if (imgErr?.message) {
            toast.error(imgErr.message);
          } else {
            toast.error('Şəkil yüklənə bilmədi');
          }
          return;
        }
      }

      const variantData = {
        imageId: imageId || null,
        attributes: editingVariant.attributes,
        isActive: editingVariant.isActive,
      };

      await productsApi.updateProductVariant(productId, editingVariant.id, variantData);
      toast.success('Variant uğurla yeniləndi');
      setEditingVariant(null);
      onUpdate?.();
    } catch (error: any) {
      console.error('Variant yeniləmə xətası:', error);
      
      // Handle validation errors
      if (error?.error?.errors && Array.isArray(error.error.errors)) {
        // Multiple validation errors
        const errorMessages = error.error.errors.map((e: any) => e.message).join(', ');
        toast.error(errorMessages || error.error.message || 'Variant yenilənə bilmədi');
      } else if (error?.error?.message) {
        // Single error message
        toast.error(error.error.message);
      } else if (error?.message) {
        // Direct error message
        toast.error(error.message);
      } else {
        toast.error('Variant yenilənə bilmədi');
      }
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Bu variantı silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      await productsApi.deleteProductVariant(productId, variantId);
      toast.success('Variant silindi');
      setVariantList(variantList.filter((v) => v.id !== variantId));
      onUpdate?.();
    } catch (error: any) {
      console.error('Variant silmə xətası:', error);
      
      // Handle validation errors
      if (error?.error?.errors && Array.isArray(error.error.errors)) {
        // Multiple validation errors
        const errorMessages = error.error.errors.map((e: any) => e.message).join(', ');
        toast.error(errorMessages || error.error.message || 'Variant silinə bilmədi');
      } else if (error?.error?.message) {
        // Single error message
        toast.error(error.error.message);
      } else if (error?.message) {
        // Direct error message
        toast.error(error.message);
      } else {
        toast.error('Variant silinə bilmədi');
      }
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_CONFIG.BASE_URL}${imageUrl}`;
  };

  return (
    <div className={cn(
      "space-y-6 p-6 rounded-lg border",
      theme === "light"
        ? "bg-white border-neutral-200"
        : "bg-neutral-800 border-neutral-700"
    )}>
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-semibold",
          theme === "light" ? "text-neutral-900" : "text-white"
        )}>
          Məhsul Variantları ({variantList.length})
        </h3>
      </div>

      {/* Create/Edit Form */}
      {editingVariant ? (
        <div className={cn(
          "p-4 rounded-lg border",
          theme === "light"
            ? "bg-neutral-50 border-neutral-200"
            : "bg-neutral-900 border-neutral-700"
        )}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={cn(
              "font-medium",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>
              Variant Redaktə
            </h4>
            <button
              onClick={() => setEditingVariant(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <FileUpload
              label="Variant Şəkli (Opsional)"
              accept="image/*"
              placeholder="Şəkil seçin"
              onChange={(file) => {
                if (editingVariant) {
                  setEditingVariant({
                    ...editingVariant,
                    imageFile: file || undefined,
                  });
                }
              }}
            />
            {editingVariant.imageUrl && !editingVariant.imageFile && (
              <div className="mt-2 relative w-32 h-32 rounded border border-neutral-200 overflow-hidden">
                <img
                  src={getImageUrl(editingVariant.imageUrl) || ''}
                  alt="Variant"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Attributes */}
          {categoryAttributes.length > 0 && (
            <div className="mt-4 space-y-2">
              <label className={cn(
                "text-sm font-medium",
                theme === "light" ? "text-neutral-700" : "text-neutral-300"
              )}>
                Atributlar
              </label>
              {categoryAttributes.map((attr) => (
                <Select
                  key={attr.id}
                  label={attr.displayName}
                  options={attr.values.map((val) => ({
                    label: val.displayValue || val.value,
                    value: val.value,
                  }))}
                  value={editingVariant.attributes[attr.attributeType] || ''}
                  onChange={(e) => handleAttributeChange(attr.attributeType, e.target.value)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditingVariant(null)}>
              Ləğv et
            </Button>
            <Button variant="primary" onClick={handleUpdateVariant}>
              Yenilə
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn(
          "p-4 rounded-lg border",
          theme === "light"
            ? "bg-neutral-50 border-neutral-200"
            : "bg-neutral-900 border-neutral-700"
        )}>
          <h4 className={cn(
            "font-medium mb-4",
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>
            Yeni Variant
          </h4>

          {/* Image Upload */}
          <div className="mt-4">
            <FileUpload
              label="Variant Şəkli (Opsional)"
              accept="image/*"
              placeholder="Şəkil seçin"
              onChange={(file) => {
                setNewVariant({
                  ...newVariant,
                  imageFile: file || null,
                });
              }}
            />
            {newVariant.imageFile && (
              <div className="mt-2 relative w-32 h-32 rounded border border-neutral-200 overflow-hidden">
                <img
                  src={URL.createObjectURL(newVariant.imageFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Attributes */}
          {categoryAttributes.length > 0 ? (
            <div className="mt-4 space-y-2">
              <label className={cn(
                "text-sm font-medium",
                theme === "light" ? "text-neutral-700" : "text-neutral-300"
              )}>
                Atributlar
              </label>
              {categoryAttributes.map((attr) => (
                <Select
                  key={attr.id}
                  label={attr.displayName}
                  options={attr.values.map((val) => ({
                    label: val.displayValue || val.value,
                    value: val.value,
                  }))}
                  value={newVariant.attributes[attr.attributeType] || ''}
                  onChange={(e) => handleAttributeChange(attr.attributeType, e.target.value)}
                />
              ))}
            </div>
          ) : (
            <div className={cn(
              "mt-4 text-sm",
              theme === "light" ? "text-neutral-500" : "text-neutral-400"
            )}>
              Bu kateqoriya üçün atribut mövcud deyil
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={handleCreateVariant}
              disabled={isCreating}
            >
              {isCreating ? 'Yaradılır...' : 'Variant Yarat'}
            </Button>
          </div>
        </div>
      )}

      {/* Variants List */}
      {variantList.length > 0 && (
        <div className="space-y-4">
          <h4 className={cn(
            "font-medium",
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>
            Mövcud Variantlar
          </h4>
          <div className="space-y-2">
            {variantList.map((variant) => (
              <div
                key={variant.id}
                className={cn(
                  "p-4 rounded-lg border flex items-center justify-between",
                  theme === "light"
                    ? "bg-white border-neutral-200"
                    : "bg-neutral-900 border-neutral-700"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  {variant.imageUrl && (
                    <img
                      src={getImageUrl(variant.imageUrl) || ''}
                      alt="Variant"
                      className="w-16 h-16 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        theme === "light" ? "text-neutral-900" : "text-white"
                      )}>
                        Variant #{variantList.indexOf(variant) + 1}
                      </span>
                      {!variant.isActive && (
                        <span className="text-xs text-neutral-500">(Deaktiv)</span>
                      )}
                    </div>
                    {Object.keys(variant.attributes).length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-500 mt-1">
                        Atribut yoxdur
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    icon={<Edit size={14} />}
                    onClick={() => setEditingVariant(variant)}
                    className="text-xs px-2 py-1"
                  >
                    Redaktə
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDeleteVariant(variant.id)}
                    className="text-xs px-2 py-1"
                  >
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

