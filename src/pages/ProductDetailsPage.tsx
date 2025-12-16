import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Calendar, Box, Info,
    Edit, Trash2, Package, Layers, Hash, CheckCircle, XCircle,
    Star, Image as ImageIcon, Copy, AlertTriangle
} from "lucide-react";

// Image component with fallback to prevent infinite loop
const ImageWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    fallback: React.ReactNode;
}> = ({ src, alt, className, fallback }) => {
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
            onError={() => {
                setHasError(true);
                setIsLoading(false);
            }}
            onLoad={() => setIsLoading(false)}
            style={{ display: isLoading ? 'none' : 'block' }}
        />
    );
};
import { productsApi } from "../core/api/products.api";
import { imagesApi } from "../core/api/images.api";
import { Button } from "../components/commons/Button";
import { API_CONFIG } from "../core/config/api.config";
import { AddItemModal } from "../components/modals/AddItemModal";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Modal } from "../components/commons/Modal";
import { Input } from "../components/commons/Input";
import { useToast } from "../core/providers/ToastContext";
import type { UpdateProductRequest } from "../core/api/products.api";
import { useTranslation } from "react-i18next";

export const ProductDetailsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const toast = useToast();

    // State for modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
    const [featuredDisplayOrder, setFeaturedDisplayOrder] = useState(1);
    
    // Local state for banner and featured status
    const [isBanner, setIsBanner] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["product", id],
        queryFn: () => productsApi.getProductById(id!),
        enabled: !!id,
    });

    // Update local state when product data changes
    useEffect(() => {
        if (data) {
            const product = (data as any)?.value || data;
            if (product) {
                setIsBanner(product.isBanner || false);
                setIsFeatured(product.isFeatured || false);
            }
        }
    }, [data]);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: productsApi.deleteProduct,
        onSuccess: () => {
            toast.success(t('products.delete_success'));
            queryClient.invalidateQueries({ queryKey: ["products"] });
            navigate("/");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('products.delete_error'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; data: UpdateProductRequest }) =>
            productsApi.updateProduct(data.id, data.data),
        onSuccess: () => {
            toast.success(t('products.update_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsEditModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || t('products.save_error'));
        },
    });


    // Set primary image mutation
    const setPrimaryImageMutation = useMutation({
        mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
            productsApi.setPrimaryImage(productId, imageId),
        onSuccess: () => {
            toast.success(t('products.primary_image_set_success') || 'Əsas şəkil uğurla dəyişdirildi');
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            const errorMessage = error?.error?.message || error?.message || t('products.primary_image_error') || 'Əsas şəkil dəyişdirilə bilmədi';
            toast.error(errorMessage);
        },
    });

    // Banner mutations
    const setBannerMutation = useMutation({
        mutationFn: (productId: string) => productsApi.setBanner(productId),
        onSuccess: () => {
            setIsBanner(true);
            toast.success(t('products.banner_set_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('products.banner_error'));
        },
    });

    const removeBannerMutation = useMutation({
        mutationFn: (productId: string) => productsApi.removeBanner(productId),
        onSuccess: () => {
            setIsBanner(false);
            toast.success(t('products.banner_remove_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('products.banner_error'));
        },
    });

    // Featured mutations
    const setFeaturedMutation = useMutation({
        mutationFn: ({ productId, displayOrder }: { productId: string; displayOrder: number }) =>
            productsApi.setFeatured(productId, displayOrder),
        onSuccess: () => {
            setIsFeatured(true);
            setIsFeaturedModalOpen(false);
            toast.success(t('products.featured_set_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('products.featured_error'));
        },
    });

    const removeFeaturedMutation = useMutation({
        mutationFn: (productId: string) => productsApi.removeFeatured(productId),
        onSuccess: () => {
            setIsFeatured(false);
            toast.success(t('products.featured_remove_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('products.featured_error'));
        },
    });

    const handleSaveProduct = async (formData: any) => {
        if (!id) return;

        try {
            // STEP 1: Upload product images first and collect imageIds
            const imageIds: string[] = [];
            
            // Preserve existing images by adding their imageIds first
            if (product?.images && product.images.length > 0) {
                console.log("Preserving existing product images...", product.images);
                for (const existingImage of product.images) {
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
                            toast.error(errorMessages || imgErr.error.message || 'Şəkil yüklənə bilmədi');
                        } else if (imgErr?.error?.message) {
                            toast.error(imgErr.error.message);
                        } else if (imgErr?.message) {
                            toast.error(imgErr.message);
                        } else {
                            toast.error('Şəkil yüklənə bilmədi');
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
                        attributes: variant.attributes || {},
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

            // STEP 3: Map AddItemModal formData to UpdateProductRequest with imageIds
            const updateData: UpdateProductRequest = {
                name: formData.itemName,
                description: formData.description,
                price: Number(formData.price),
                currency: formData.currency,
                categoryId: formData.category,
                brandId: formData.manufacturer,
                stock: Number(formData.amount),
                vatRate: 0.18,
                ...(imageIds.length > 0 && { imageIds }), // Send imageIds array
                ...(processedVariants.length > 0 && { variants: processedVariants }),
            };

            console.log("Updating product with imageIds:", imageIds);

            await updateMutation.mutateAsync({
                id,
                data: updateData
            });
        } catch (error) {
            console.error("Error updating product:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Handle both wrapped (data.value) and unwrapped (data) responses
    const product = (data as any)?.value || data;

    if (isError || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-600">
                <p className="text-xl font-semibold mb-4">{t('product_details.not_found')}</p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    {t('product_details.go_back')}
                </Button>
            </div>
        );
    }

    // Use primaryImageUrl if available, fallback to imageUrl
    const imageUrl = product.primaryImageUrl || product.imageUrl;
    const fullImageUrl = imageUrl
        ? (imageUrl.startsWith("http") 
            ? imageUrl 
            : imageUrl.startsWith("/api/")
            ? `${API_CONFIG.BASE_URL}${imageUrl}`
            : `${API_CONFIG.BASE_URL}/api/images/${imageUrl}`)
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header Navigation - Enhanced */}
                <nav className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-neutral-200 px-6 py-4">
                    <div className="flex items-center gap-3 text-sm">
                        <button
                            onClick={() => navigate("/products")}
                            className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors font-medium"
                        >
                            <ArrowLeft size={18} />
                            <span>{t('product_details.back')}</span>
                        </button>
                        <span className="text-neutral-300">/</span>
                        <span className="font-semibold text-neutral-900 truncate max-w-[250px]">{product.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Primary Action: Edit */}
                        <Button
                            variant="primary"
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <Edit size={16} />
                            {t('product_details.edit')}
                        </Button>

                        {/* Secondary Actions */}
                        {isFeatured ? (
                            <Button
                                variant="outline"
                                onClick={() => id && removeFeaturedMutation.mutate(id)}
                                className="flex items-center gap-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                loading={removeFeaturedMutation.isPending}
                            >
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                {t('products.remove_featured')}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsFeaturedModalOpen(true)}
                                className="flex items-center gap-2 hover:border-yellow-300 hover:text-yellow-700"
                            >
                                <Star size={16} />
                                {t('products.set_featured')}
                            </Button>
                        )}

                        {isBanner ? (
                            <Button
                                variant="outline"
                                onClick={() => id && removeBannerMutation.mutate(id)}
                                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                loading={removeBannerMutation.isPending}
                            >
                                <ImageIcon size={16} />
                                {t('products.remove_banner')}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => id && setBannerMutation.mutate(id)}
                                className="flex items-center gap-2 hover:border-blue-300 hover:text-blue-700"
                                loading={setBannerMutation.isPending}
                            >
                                <ImageIcon size={16} />
                                {t('products.set_banner')}
                            </Button>
                        )}

                        {/* Destructive Action: Delete */}
                        <Button
                            variant="danger"
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <Trash2 size={16} />
                            {t('product_details.delete')}
                        </Button>
                    </div>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Image */}
                <div className="lg:col-span-5 space-y-4">
                    {/* Main Product Image with Hover Zoom - Enhanced */}
                    <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-lg p-8 flex items-center justify-center min-h-[450px] relative overflow-hidden group hover:border-primary-300 transition-all duration-300">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {fullImageUrl ? (
                            <>
                                <ImageWithFallback
                                    src={fullImageUrl}
                                    alt={product.name}
                                    className="relative z-10 w-full h-full object-contain max-h-[500px] transition-all duration-300 group-hover:scale-110 cursor-zoom-in drop-shadow-lg"
                                    fallback={
                                        <div className="relative z-10 flex flex-col items-center text-neutral-300">
                                            <div className="p-6 bg-neutral-100 rounded-full mb-3">
                                                <Package size={48} strokeWidth={1.5} />
                                            </div>
                                            <span className="text-sm text-neutral-400 font-medium">{t('product_details.no_image')}</span>
                                        </div>
                                    }
                                />
                                {/* Primary Image Indicator - Enhanced */}
                                {product.images && product.images.some((img: any) => img.isPrimary) && (
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold z-20 shadow-lg flex items-center gap-1.5">
                                        <Star size={12} className="fill-white" />
                                        Primary
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center text-neutral-300">
                                <div className="p-6 bg-neutral-100 rounded-full mb-3">
                                    <Package size={48} strokeWidth={1.5} />
                                </div>
                                <span className="text-sm text-neutral-400 font-medium">{t('product_details.no_image')}</span>
                            </div>
                        )}
                    </div>

                    {/* Additional Images Gallery - Enhanced */}
                    {product.images && product.images.length > 0 && (
                        <div className="bg-white rounded-xl border border-neutral-200 shadow-md p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-semibold text-neutral-800 flex items-center gap-2">
                                    <ImageIcon size={18} className="text-primary-600" />
                                    Additional Images
                                </h3>
                                <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                                    {product.images.length} {product.images.length === 1 ? 'image' : 'images'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {product.images.map((image: any) => {
                                    // Use imageUrl if available, otherwise construct from imageId
                                    let imgUrl: string | null = null;
                                    
                                    if (image.imageUrl) {
                                        imgUrl = image.imageUrl.startsWith("http") 
                                            ? image.imageUrl 
                                            : image.imageUrl.startsWith("/api/")
                                            ? `${API_CONFIG.BASE_URL}${image.imageUrl}`
                                            : `${API_CONFIG.BASE_URL}/api/images/${image.imageUrl}`;
                                    } else if (image.imageId) {
                                        imgUrl = `${API_CONFIG.BASE_URL}/api/images/${image.imageId}`;
                                    }
                                    
                                    return (
                                        <div key={image.id} className="relative group">
                                            {imgUrl ? (
                                                <div className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                                                    image.isPrimary 
                                                        ? 'border-primary-500 ring-2 ring-primary-200 shadow-md' 
                                                        : 'border-neutral-200 hover:border-primary-400 hover:shadow-md'
                                                }`}>
                                                    <ImageWithFallback
                                                        src={imgUrl}
                                                        alt={product.name}
                                                        className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-110"
                                                        fallback={
                                                            <div className="w-full h-28 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
                                                                No Image
                                                            </div>
                                                        }
                                                    />
                                                    {image.isPrimary && (
                                                        <div className="absolute top-2 right-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
                                                            <Star size={10} className="fill-white" />
                                                            Primary
                                                        </div>
                                                    )}
                                                    {!image.isPrimary && id && (
                                                        <button
                                                            onClick={() => {
                                                                setPrimaryImageMutation.mutate({
                                                                    productId: id,
                                                                    imageId: image.imageId,
                                                                });
                                                            }}
                                                            disabled={setPrimaryImageMutation.isPending}
                                                            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 text-white text-xs font-medium"
                                                        >
                                                            {setPrimaryImageMutation.isPending 
                                                                ? t('common.loading') || 'Yüklənir...'
                                                                : t('product_details.set_primary') || 'Set as Primary'
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full h-28 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg border-2 border-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Details - Enhanced */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Primary Information Card - Enhanced */}
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-lg p-6 space-y-5">
                        {/* Product Name & Status */}
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">{product.name}</h1>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                                            product.isActive
                                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                                : "bg-neutral-200 text-neutral-700"
                                        }`}>
                                            {product.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {product.isActive ? t('products.active') : t('products.inactive')}
                                        </span>
                                    </div>
                                    {/* Product ID with Copy - Enhanced */}
                                    <div className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200 w-fit">
                                        <Hash size={14} className="text-neutral-400" />
                                        <span className="font-mono font-medium">{product.sku}</span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(product.sku);
                                                toast.success('SKU kopyalandı');
                                            }}
                                            className="p-1 hover:bg-white rounded transition-colors text-neutral-400 hover:text-primary-600"
                                            title="SKU-nu kopyala"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Price - Strong Visual with Gradient */}
                            <div className="pt-2">
                                {product.finalPrice && product.finalDiscountPercent ? (
                                    <div className="space-y-2">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl line-through text-neutral-400">
                                                {product.price}
                                            </span>
                                            <span className="text-lg line-through text-neutral-400">{product.currency}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                                {product.finalPrice.toFixed(2)}
                                            </span>
                                            <span className="text-2xl font-bold text-primary-600">{product.currency}</span>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-bold shadow-md">
                                            <span>-{product.finalDiscountPercent}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                            {product.price}
                                        </span>
                                        <span className="text-2xl font-bold text-primary-600">{product.currency}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Cards - Enhanced with Icons and Gradients */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all hover:border-blue-200 group">
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <Layers size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{t('products.category')}</span>
                            </div>
                            <p className="text-base font-bold text-neutral-900">{product.categoryName}</p>
                        </div>

                        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-all hover:border-purple-200 group">
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <Box size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{t('products.brand')}</span>
                            </div>
                            <p className="text-base font-bold text-neutral-900">{product.brandName}</p>
                        </div>

                        <div className={`rounded-xl p-4 border shadow-sm hover:shadow-md transition-all group ${
                            product.stock < 10 
                                ? 'bg-gradient-to-br from-orange-50 to-red-50/30 border-orange-200 hover:border-orange-300' 
                                : 'bg-gradient-to-br from-white to-green-50/30 border-green-100 hover:border-green-200'
                        }`}>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className={`p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow ${
                                    product.stock < 10
                                        ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                                        : 'bg-gradient-to-br from-green-500 to-green-600'
                                }`}>
                                    <Package size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{t('products.stock')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={`text-base font-bold ${product.stock < 10 ? 'text-orange-700' : 'text-neutral-900'}`}>
                                    {product.stock} {t('product_details.units')}
                                </p>
                                {product.stock < 10 && (
                                    <AlertTriangle size={14} className="text-orange-500" />
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-4 border border-neutral-200 shadow-sm hover:shadow-md transition-all hover:border-neutral-300 group">
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-2 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <Calendar size={16} className="text-white" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{t('product_details.added')}</span>
                            </div>
                            <p className="text-base font-bold text-neutral-900">
                                {new Date(product.createdAt).toLocaleDateString('az-AZ', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Description - Enhanced Readability */}
                    {product.description && (
                        <div className="bg-white rounded-xl border border-neutral-200 shadow-md p-6">
                            <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                                <div className="p-1.5 bg-primary-100 rounded-lg">
                                    <Info size={16} className="text-primary-600" />
                                </div>
                                {t('product_details.description')}
                            </h3>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                </div>
            </div>

            {/* Modals */}
            {product && (
                <AddItemModal
                    open={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onAdd={handleSaveProduct}
                    initialData={product}
                />
            )}

            <ConfirmationModal
                open={isDeleteModalOpen}
                title={t('products.delete_title')}
                message={t('products.delete_message')}
                confirmLabel={t('products.delete_confirm')}
                variant="danger"
                onConfirm={() => deleteMutation.mutate(id!)}
                onCancel={() => setIsDeleteModalOpen(false)}
                isLoading={deleteMutation.isPending}
            />

            {/* Featured Modal */}
            <Modal
                open={isFeaturedModalOpen}
                onClose={() => setIsFeaturedModalOpen(false)}
                title={t('products.set_featured')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-neutral-600">
                        {t('products.display_order_required')}
                    </p>
                    <Input
                        type="number"
                        label={t('products.display_order')}
                        min={1}
                        max={5}
                        value={featuredDisplayOrder.toString()}
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 5) {
                                setFeaturedDisplayOrder(value);
                            }
                        }}
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsFeaturedModalOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (id && featuredDisplayOrder >= 1 && featuredDisplayOrder <= 5) {
                                    setFeaturedMutation.mutate({
                                        productId: id,
                                        displayOrder: featuredDisplayOrder,
                                    });
                                }
                            }}
                            loading={setFeaturedMutation.isPending}
                        >
                            {t('common.confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
