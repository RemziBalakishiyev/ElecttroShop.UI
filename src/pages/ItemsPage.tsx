import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Filter, Trash2, Edit, Eye, Star, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/commons/Button";
import { Table } from "../components/commons/Table";
import { Pagination } from "../components/commons/Pagination";
import { FilterModal } from "../components/commons/FilterModal";
import { AddItemModal } from "../components/modals/AddItemModal";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { ImagePreviewModal } from "../components/modals/ImagePreviewModal";
import { productsApi } from "../core/api/products.api";
import type { Product, ProductListParams, CreateProductRequest, UpdateProductRequest } from "../core/api/products.api";
import { imagesApi } from "../core/api/images.api";
import { useToast } from "../core/providers/ToastContext";
import { API_CONFIG } from "../core/config/api.config";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

// Image component with fallback to prevent infinite loop
const ImageWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
    fallback: React.ReactNode;
}> = ({ src, alt, className, onClick, fallback }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (hasError) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onClick={onClick}
            onError={() => {
                setHasError(true);
                setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
            style={{ display: isLoading ? 'none' : 'block' }}
        />
    );
};

export const ItemsPage = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  // State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Confirmation Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filters state
  const [activeFilters, setActiveFilters] = useState<{
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
  }>({});

  // Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", page, pageSize, searchTerm, activeFilters],
    queryFn: () => {
      const params: ProductListParams = {
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        ...activeFilters,
      };
      return productsApi.getProducts(params);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedItems(new Set());
      toast.success(t('products.delete_success'));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    },
    onError: (err) => {
      console.error("Failed to delete product:", err);
      toast.error(t('products.delete_error'));
    },
  });

  // Handlers
  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected && data?.value) {
      setSelectedItems(new Set(data.value.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleApplyFilter = (filters: {
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setActiveFilters(filters);
    setPage(1);
    toast.info(t('products.filters_applied'));
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsAddItemOpen(true);
  };

  const handleAddItemClose = () => {
    setIsAddItemOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (formData: any) => {
    console.log("handleSaveProduct called with:", formData);
    try {
      // Determine if this is an update or create
      const isUpdate = !!editingProduct;
      const productId = editingProduct?.id;
      
      // STEP 1: Upload product images first and collect imageIds
      const imageIds: string[] = [];
      
      // For UPDATE: Preserve existing images by adding their imageIds first
      if (isUpdate && editingProduct?.images && editingProduct.images.length > 0) {
        console.log("Preserving existing product images...", editingProduct.images);
        for (const existingImage of editingProduct.images) {
          if (existingImage.imageId) {
            imageIds.push(existingImage.imageId);
            console.log("Preserved existing image, imageId:", existingImage.imageId);
          }
        }
      }
      
      // Upload new images and add to imageIds
      if (formData.images && formData.images.length > 0) {
        console.log("Uploading new product images...", formData.images);
        for (const imageFile of formData.images) {
          try {
            const imageResponse = await imagesApi.uploadImage(imageFile);
            // Response structure: { value: { imageId: "..." } } or { imageId: "..." }
            const imageData = (imageResponse as any)?.value || imageResponse;
            const imageId = imageData?.imageId || imageData?.id;
            
            if (imageId) {
              imageIds.push(imageId);
              console.log("New product image uploaded, imageId:", imageId);
            } else {
              console.warn("Image uploaded but imageId not found in response:", imageResponse);
            }
          } catch (imgErr: any) {
            console.error("Failed to upload product image:", imgErr);
            
            // Handle validation errors
            if (imgErr?.error?.errors && Array.isArray(imgErr.error.errors)) {
              const errorMessages = imgErr.error.errors.map((e: any) => e.message).join(', ');
              toast.error(errorMessages || imgErr.error.message || t('products.image_upload_error'));
            } else if (imgErr?.error?.message) {
              toast.error(imgErr.error.message);
            } else if (imgErr?.message) {
              toast.error(imgErr.message);
            } else {
              toast.error(t('products.image_upload_error'));
            }
            // Continue with other images even if one fails
          }
        }
      }

      // STEP 2: Process variants - upload variant images if needed
      const processedVariants = [];
      if (formData.variants && formData.variants.length > 0) {
        for (const variant of formData.variants) {
          let variantImageId = variant.imageId || null;

          // If variant has imageFile, upload it first using imagesApi
          if (variant.imageFile) {
            try {
              const imageResponse = await imagesApi.uploadImage(variant.imageFile);
              // Response structure: { value: { imageId: "..." } } or { imageId: "..." }
              const imageData = (imageResponse as any)?.value || imageResponse;
              variantImageId = imageData?.imageId || imageData?.id || null;
              
              if (variantImageId) {
                console.log("Variant image uploaded, imageId:", variantImageId);
              }
            } catch (imgErr: any) {
              console.error("Failed to upload variant image:", imgErr);
              
              // Handle validation errors
              if (imgErr?.error?.errors && Array.isArray(imgErr.error.errors)) {
                const errorMessages = imgErr.error.errors.map((e: any) => e.message).join(', ');
                toast.warning(errorMessages || imgErr.error.message || 'Variant şəkli yüklənə bilmədi');
              } else if (imgErr?.error?.message) {
                toast.warning(imgErr.error.message);
              } else if (imgErr?.message) {
                toast.warning(imgErr.message);
              }
              // Continue without variant image if upload fails
            }
          }

          // Prepare variant data (only attributes and optional imageId)
          const variantData: any = {
            attributes: variant.attributes || {}, // Already an object
            ...(variantImageId && { imageId: variantImageId }),
          };

          // For update: include id and isActive if present
          if (variant.id) {
            variantData.id = variant.id;
            variantData.isActive = variant.isActive !== undefined ? variant.isActive : true;
          }

          processedVariants.push(variantData);
        }
      }

      // STEP 3: Prepare product data with imageIds
      const commonData = {
        name: formData.itemName,
        description: formData.description,
        price: Number(formData.price),
        currency: formData.currency || "AZN",
        categoryId: formData.category,
        brandId: formData.manufacturer,
        stock: Number(formData.amount),
        vatRate: 0.18,
        ...(imageIds.length > 0 && { imageIds }), // Send imageIds array
        ...(processedVariants.length > 0 && { variants: processedVariants }),
      };

      console.log("isUpdate:", isUpdate, "productId:", productId);
      console.log("ImageIds to send:", imageIds);

      if (isUpdate && productId) {
        // UPDATE
        const updateData: UpdateProductRequest = {
          ...commonData,
        };
        console.log("Updating product...", updateData);
        await productsApi.updateProduct(productId, updateData);
        console.log("Product updated.");
        toast.success(t('products.update_success'));
      } else {
        // CREATE
        const createData: CreateProductRequest = {
          ...commonData,
          sku: formData.itemNumber,
        };
        console.log("Creating product...", createData);
        const response = await productsApi.createProduct(createData);
        console.log("Create response:", response);

        // Handle both wrapped (ApiResponse) and unwrapped (Product) responses
        const createdProduct = (response as any).value || response;
        productId = createdProduct?.id;

        if (!productId) {
          throw new Error("Product ID not found in response");
        }

        console.log("Created productId:", productId);
        toast.success(t('products.create_success'));
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      handleAddItemClose();
    } catch (err: any) {
      console.error("Failed to save product:", err);
      
      // Handle validation errors
      if (err?.error?.errors && Array.isArray(err.error.errors)) {
        // Multiple validation errors
        const errorMessages = err.error.errors.map((e: any) => e.message).join(', ');
        toast.error(errorMessages || err.error.message || t('products.save_error'));
      } else if (err?.error?.message) {
        // Single error message
        toast.error(err.error.message);
      } else if (err?.message) {
        // Direct error message
        toast.error(err.message);
      } else {
        toast.error(t('products.save_error'));
      }
    }
  };

  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const columns = [
    {
      key: "name",
      label: t('products.name'),
      sortable: true,
      render: (item: Product) => (
        <div className="flex flex-col">
          <button
            onClick={() => navigate(`/products/${item.id}`)}
            className="font-medium text-neutral-900 hover:text-primary-600 text-left transition-colors"
          >
            {item.name}
          </button>
          <span className="text-xs text-neutral-500">{item.sku}</span>
        </div>
      ),
    },
    {
      key: "image",
      label: t('products.image'),
      render: (item: Product) => {
        // Use primaryImageUrl if available, fallback to imageUrl
        const imageUrl = item.primaryImageUrl || item.imageUrl;
        const fullImageUrl = imageUrl
          ? (imageUrl.startsWith("http") 
              ? imageUrl 
              : imageUrl.startsWith("/api/")
              ? `${API_CONFIG.BASE_URL}${imageUrl}`
              : `${API_CONFIG.BASE_URL}/api/images/${imageUrl}`)
          : null;
        
        // Debug log (remove in production)
        if (item.primaryImageUrl) {
          console.log(`Product ${item.name}: primaryImageUrl=${item.primaryImageUrl}, fullImageUrl=${fullImageUrl}`);
        }

        return fullImageUrl ? (
          <ImageWithFallback
            src={fullImageUrl}
            alt={item.name}
            className="w-12 h-12 rounded-lg object-cover border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(fullImageUrl);
            }}
            fallback={
              <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">
                {t('products.no_image')}
              </div>
            }
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">
            {t('products.no_image')}
          </div>
        );
      },
    },
    {
      key: "price",
      label: t('products.price'),
      render: (item: Product) => (
        <div className="flex flex-col">
          {item.finalPrice && item.finalDiscountPercent ? (
            <>
              <span className="text-sm line-through text-neutral-400">
                {item.price} {item.currency}
              </span>
              <span className="text-sm font-medium text-primary-600">
                {item.finalPrice.toFixed(2)} {item.currency}
              </span>
              <span className="text-xs text-success">
                -{item.finalDiscountPercent}%
              </span>
            </>
          ) : (
            <span>{item.price} {item.currency}</span>
          )}
        </div>
      )
    },
    { key: "categoryName", label: t('products.category') },
    { key: "brandName", label: t('products.brand') },
    { key: "stock", label: t('products.stock') },
    {
      key: "isActive",
      label: t('common.status'),
      render: (item: Product) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.isActive
            ? "bg-success/10 text-success"
            : "bg-neutral/10 text-neutral-500"
            }`}
        >
          {item.isActive ? t('products.active') : t('products.inactive')}
        </span>
      ),
    },
    {
      key: "badges",
      label: "Statuslar",
      render: (item: Product) => (
        <div className="flex items-center gap-2 flex-wrap">
          {item.isBanner && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              <ImageIcon size={12} />
              {t('products.is_banner')}
            </span>
          )}
          {item.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
              <Star size={12} className="fill-yellow-400" />
              {t('products.is_featured')}
              {item.displayOrder && ` (${item.displayOrder})`}
            </span>
          )}
          {!item.isBanner && !item.isFeatured && (
            <span className="text-xs text-neutral-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: t('products.actions'),
      render: (item: Product) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${item.id}`); }}
            title={t('products.view_details')}
          >
            <Eye size={16} />
          </button>
          <button
            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
            title={t('products.edit')}
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1 hover:bg-red-50 rounded text-red-600"
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
            title={t('products.delete_confirm')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">
        {t('common.error')}: {(error as any)?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-2xl font-bold",
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>{t('products.title')}</h1>
          <p className={cn(
            "text-sm mt-1",
            theme === "light" ? "text-neutral-600" : "text-neutral-400"
          )}>{t('products.subtitle')}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border",
        theme === "light"
          ? "bg-white border-neutral-200"
          : "bg-neutral-800 border-neutral-700"
      )}>
        <div className="relative flex-1 max-w-md">
          <Search size={18} className={cn(
            "absolute top-2.5 left-3",
            theme === "light" ? "text-neutral-400" : "text-neutral-500"
          )} />
          <input
            type="text"
            placeholder={t('products.search_placeholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className={cn(
              "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none",
              theme === "light"
                ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                : "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => {
              setEditingProduct(null);
              setIsAddItemOpen(true);
            }}
          >
            {t('products.add_product')}
          </Button>
          <Button
            variant="outline"
            icon={<Filter size={18} />}
            onClick={() => setIsFilterOpen(true)}
          >
            {t('products.filter')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className={cn(
        "rounded-lg border overflow-hidden",
        theme === "light"
          ? "bg-white border-neutral-200"
          : "bg-neutral-800 border-neutral-700"
      )}>
        <Table
          columns={columns}
          data={data?.value || []}
          selectable
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {data && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            itemsPerPage={data.pageSize}
            totalItems={data.totalCount}
            onPageChange={setPage}
            onItemsPerPageChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilter}
      />

      {/* Add/Edit Item Modal */}
      <AddItemModal
        open={isAddItemOpen}
        onClose={handleAddItemClose}
        onAdd={handleSaveProduct}
        initialData={editingProduct}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={!!previewImage}
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        title={t('products.delete_title')}
        message={t('products.delete_message')}
        confirmLabel={t('products.delete_confirm')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
