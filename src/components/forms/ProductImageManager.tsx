import React, { useState } from 'react';
import { Upload, Trash2, Star } from 'lucide-react';
import { Button } from '../commons/Button';
import { productsApi } from '../../core/api/products.api';
import { imagesApi } from '../../core/api/images.api';
import type { ProductImage } from '../../core/api/products.api';
import { useToast } from '../../core/providers/ToastContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useTheme } from '../../core/context/ThemeContext';
import { API_CONFIG } from '../../core/config/api.config';

interface ProductImageManagerProps {
  productId: string;
  images?: ProductImage[];
  onUpdate?: () => void;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  productId,
  images = [],
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const toast = useToast();

  const [imageList, setImageList] = useState<ProductImage[]>(images);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    setImageList(images);
  }, [images]);

  const handleUploadImage = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Şəkil yüklə
      const imageResponse = await imagesApi.uploadImage(file);
      const uploadedImage = (imageResponse as any).value || imageResponse;
      const imageId = uploadedImage?.id;

      if (!imageId) {
        throw new Error('Şəkil ID alına bilmədi');
      }

      // 2. Məhsula şəkil əlavə et
      await productsApi.addProductImage(productId, {
        imageId,
        displayOrder: imageList.length,
        isPrimary: imageList.length === 0, // İlk şəkil avtomatik primary
      });

      toast.success('Şəkil uğurla əlavə edildi');
      onUpdate?.();
    } catch (error: any) {
      console.error('Şəkil yükləmə xətası:', error);
      toast.error(error?.message || 'Şəkil yüklənə bilmədi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await productsApi.setPrimaryImage(productId, imageId);
      toast.success('Əsas şəkil təyin edildi');
      onUpdate?.();
    } catch (error: any) {
      console.error('Əsas şəkil təyin etmə xətası:', error);
      toast.error(error?.message || 'Əsas şəkil təyin edilə bilmədi');
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Bu şəkili silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      await productsApi.deleteProductImage(productId, imageId);
      toast.success('Şəkil silindi');
      setImageList(imageList.filter((img) => img.imageId !== imageId));
      onUpdate?.();
    } catch (error: any) {
      console.error('Şəkil silmə xətası:', error);
      toast.error(error?.message || 'Şəkil silinə bilmədi');
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_CONFIG.BASE_URL}${imageUrl}`;
  };

  return (
    <div className={cn(
      "space-y-4 p-6 rounded-lg border",
      theme === "light"
        ? "bg-white border-neutral-200"
        : "bg-neutral-800 border-neutral-700"
    )}>
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-semibold",
          theme === "light" ? "text-neutral-900" : "text-white"
        )}>
          Məhsul Şəkilləri ({imageList.length})
        </h3>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadImage(file);
            }}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            icon={<Upload size={16} />}
            disabled={isUploading}
            type="button"
          >
            {isUploading ? 'Yüklənir...' : 'Şəkil Yüklə'}
          </Button>
        </label>
      </div>

      {imageList.length === 0 ? (
        <div className={cn(
          "text-center py-12 rounded-lg border-2 border-dashed",
          theme === "light"
            ? "bg-neutral-50 border-neutral-300 text-neutral-500"
            : "bg-neutral-900 border-neutral-600 text-neutral-400"
        )}>
          <p>Hələ şəkil yoxdur</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageList.map((img, index) => (
            <div
              key={img.id || img.imageId}
              className={cn(
                "relative group rounded-lg overflow-hidden border-2 transition-all",
                img.isPrimary
                  ? "border-primary-500 ring-2 ring-primary-200"
                  : theme === "light"
                  ? "border-neutral-200"
                  : "border-neutral-700"
              )}
            >
              <img
                src={getImageUrl(img.imageUrl)}
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                }}
              />

              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Star size={12} className="fill-white" />
                  Əsas
                </div>
              )}

              <div className={cn(
                "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2",
              )}>
                {!img.isPrimary && (
                  <Button
                    variant="outline"
                    icon={<Star size={14} />}
                    onClick={() => handleSetPrimary(img.imageId)}
                    className="bg-white/90 hover:bg-white text-xs px-2 py-1"
                  >
                    Əsas Et
                  </Button>
                )}
                <Button
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleRemoveImage(img.imageId)}
                  className="bg-red-500/90 hover:bg-red-500 text-xs px-2 py-1"
                >
                  Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

