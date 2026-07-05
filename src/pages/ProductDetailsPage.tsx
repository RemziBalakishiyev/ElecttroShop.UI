import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Calendar, Box, Info,
    Edit, Trash2, Package, Layers, Hash, CheckCircle, XCircle,
    Star, Image as ImageIcon, Copy, AlertTriangle, Tags, TrendingUp,
    MoreHorizontal, ChevronDown
} from "lucide-react";
import type { CategoryAttribute } from "../core/api/categories.api";

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
import type { Product, ProductVariant, UpdateProductRequest } from "../core/api/products.api";
import { categoriesApi } from "../core/api/categories.api";
import {
  buildUpdateProductPayload,
  type ProductFormSubmitData,
} from "../utils/productSave";
import {
  isConcurrencyConflictError,
  mapProductSaveErrorMessage,
} from "../utils/productAttributes";
import { Button } from "../components/commons/Button";
import { getImageUrl, resolveProductImage } from "../utils/imageUrl";
import { AddItemModal } from "../components/modals/AddItemModal";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Modal } from "../components/commons/Modal";
import { Input } from "../components/commons/Input";
import { useToast } from "../core/providers/ToastContext";
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
    const [isPopularModalOpen, setIsPopularModalOpen] = useState(false);
    const [popularDisplayOrder, setPopularDisplayOrder] = useState(1);
    
    // Local state for banner, featured and popular status
    const [isBanner, setIsBanner] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPopular, setIsPopular] = useState(false);

    // Dropdown state
    const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
    const moreActionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
                setIsMoreActionsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["product", id],
        queryFn: () => productsApi.getProductById(id!),
        enabled: !!id,
    });

    const product = useMemo((): Product | undefined => {
        if (!data) return undefined;
        return (data as { value?: Product }).value || (data as Product);
    }, [data]);

    // Update local state when product data changes
    useEffect(() => {
        if (data) {
            const product = (data as any)?.value || data;
            if (product) {
                setIsBanner(product.isBanner || false);
                setIsFeatured(product.isFeatured || false);
                setIsPopular(product.isPopular || false);
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
            queryClient.invalidateQueries({ queryKey: ["category-attributes"] });
            setIsEditModalOpen(false);
        },
        onError: (error: unknown) => {
            toast.error(mapProductSaveErrorMessage(error));
            if (isConcurrencyConflictError(error) && id) {
                queryClient.invalidateQueries({ queryKey: ["product", id] });
            }
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

    // Popular mutations
    const setPopularMutation = useMutation({
        mutationFn: ({ productId, displayOrder }: { productId: string; displayOrder: number }) =>
            productsApi.setPopular(productId, displayOrder),
        onSuccess: () => {
            setIsPopular(true);
            setIsPopularModalOpen(false);
            toast.success(t('products.popular_set_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["popular-products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('products.popular_error'));
        },
    });

    const removePopularMutation = useMutation({
        mutationFn: (productId: string) => productsApi.removePopular(productId),
        onSuccess: () => {
            setIsPopular(false);
            toast.success(t('products.popular_remove_success'));
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["popular-products"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || t('products.popular_error'));
        },
    });

    const handleSaveProduct = async (formData: ProductFormSubmitData) => {
        if (!id || !product) return;

        let categoryAttributes = product.categoryAttributes ?? [];
        try {
            categoryAttributes = await categoriesApi.getCategoryAttributes(
                formData.category
            );
        } catch {
            // fallback to embedded attributes from GET product
        }

        const updateData = await buildUpdateProductPayload(
            formData,
            categoryAttributes,
            product
        );

        await updateMutation.mutateAsync({ id, data: updateData });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const categoryAttributes: CategoryAttribute[] = (product?.categoryAttributes ?? [])
        .map((attr: CategoryAttribute) => ({
            ...attr,
            values: [...(attr.values || [])].sort(
                (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
            ),
        }))
        .sort((a: CategoryAttribute, b: CategoryAttribute) =>
            (a.displayOrder || 0) - (b.displayOrder || 0)
        );

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

    const productImageRef = resolveProductImage(product);
    const fullImageUrl = productImageRef ? getImageUrl(productImageRef) : null;

    return (
        <div className="min-h-screen bg-neutral-50">

            {/* ── Sticky Action Bar ─────────────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 min-w-0 text-sm">
                        <button
                            onClick={() => navigate("/products")}
                            className="flex items-center gap-1.5 text-neutral-500 hover:text-primary-600 transition-colors font-medium shrink-0"
                        >
                            <ArrowLeft size={16} />
                            <span>{t('product_details.back')}</span>
                        </button>
                        <span className="text-neutral-300">/</span>
                        <span className="font-semibold text-neutral-800 truncate">{product.name}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Primary: Edit */}
                        <Button
                            variant="primary"
                            onClick={() => setIsEditModalOpen(true)}
                            className="gap-2 text-sm"
                        >
                            <Edit size={14} />
                            {t('product_details.edit')}
                        </Button>

                        {/* Secondary: dropdown for all other actions */}
                        <div className="relative" ref={moreActionsRef}>
                            <button
                                onClick={() => setIsMoreActionsOpen(v => !v)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
                            >
                                <MoreHorizontal size={15} />
                                <span className="hidden sm:inline">Əməliyyatlar</span>
                                <ChevronDown size={13} className={`transition-transform ${isMoreActionsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMoreActionsOpen && (
                                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="py-1">
                                        {/* Featured */}
                                        {isFeatured ? (
                                            <button
                                                onClick={() => { id && removeFeaturedMutation.mutate(id); setIsMoreActionsOpen(false); }}
                                                disabled={removeFeaturedMutation.isPending}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                                            >
                                                <Star size={15} className="fill-yellow-400 text-yellow-400 shrink-0" />
                                                <span>{t('products.remove_featured')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setIsFeaturedModalOpen(true); setIsMoreActionsOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                                            >
                                                <Star size={15} className="shrink-0" />
                                                <span>{t('products.set_featured')}</span>
                                            </button>
                                        )}

                                        {/* Popular */}
                                        {isPopular ? (
                                            <button
                                                onClick={() => { id && removePopularMutation.mutate(id); setIsMoreActionsOpen(false); }}
                                                disabled={removePopularMutation.isPending}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50"
                                            >
                                                <TrendingUp size={15} className="shrink-0" />
                                                <span>{t('products.remove_popular')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setIsPopularModalOpen(true); setIsMoreActionsOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                                            >
                                                <TrendingUp size={15} className="shrink-0" />
                                                <span>{t('products.set_popular')}</span>
                                            </button>
                                        )}

                                        {/* Banner */}
                                        {isBanner ? (
                                            <button
                                                onClick={() => { id && removeBannerMutation.mutate(id); setIsMoreActionsOpen(false); }}
                                                disabled={removeBannerMutation.isPending}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                            >
                                                <ImageIcon size={15} className="shrink-0" />
                                                <span>{t('products.remove_banner')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { id && setBannerMutation.mutate(id); setIsMoreActionsOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                                            >
                                                <ImageIcon size={15} className="shrink-0" />
                                                <span>{t('products.set_banner')}</span>
                                            </button>
                                        )}

                                        {/* Divider + Delete */}
                                        <div className="h-px bg-neutral-100 mx-2 my-1" />
                                        <button
                                            onClick={() => { setIsDeleteModalOpen(true); setIsMoreActionsOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={15} className="shrink-0" />
                                            <span>{t('product_details.delete')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Page Content ─────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

                    {/* ── Left: Image Column ─────────────────────────────── */}
                    <div className="lg:col-span-5 flex flex-col gap-4">

                        {/* Main image card */}
                        <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-transparent to-indigo-50/30 pointer-events-none" />

                            <div className="relative flex items-center justify-center min-h-[400px] p-10">
                                {fullImageUrl ? (
                                    <ImageWithFallback
                                        src={fullImageUrl}
                                        alt={product.name}
                                        className="max-w-full max-h-[360px] object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-xl cursor-zoom-in"
                                        fallback={
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-8 bg-neutral-100 rounded-full">
                                                    <Package size={52} strokeWidth={1.2} className="text-neutral-300" />
                                                </div>
                                                <span className="text-sm text-neutral-400 font-medium">{t('product_details.no_image')}</span>
                                            </div>
                                        }
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-8 bg-neutral-100 rounded-full">
                                            <Package size={52} strokeWidth={1.2} className="text-neutral-300" />
                                        </div>
                                        <span className="text-sm text-neutral-400 font-medium">{t('product_details.no_image')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Overlay status badges (top-left) */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                {isFeatured && (
                                    <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                        <Star size={10} className="fill-white" /> Featured
                                    </span>
                                )}
                                {isPopular && (
                                    <span className="inline-flex items-center gap-1.5 bg-purple-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                        <TrendingUp size={10} /> Məşhur
                                    </span>
                                )}
                                {isBanner && (
                                    <span className="inline-flex items-center gap-1.5 bg-primary-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                        <ImageIcon size={10} /> Banner
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Gallery strip */}
                        {product.images && product.images.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-md p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-primary-500" />
                                        Şəkillər
                                    </h3>
                                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium">
                                        {product.images.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((image: any) => {
                                        const imgUrl = getImageUrl(image.imageUrl || image.imageId);
                                        return (
                                            <div key={image.id} className="relative group/thumb">
                                                <div className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                                                    image.isPrimary
                                                        ? 'border-primary-400 ring-2 ring-primary-100 shadow-sm'
                                                        : 'border-neutral-200 hover:border-primary-300 hover:shadow-sm'
                                                }`}>
                                                    {imgUrl ? (
                                                        <ImageWithFallback
                                                            src={imgUrl}
                                                            alt={product.name}
                                                            className="w-full h-[72px] object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                                                            fallback={
                                                                <div className="w-full h-[72px] bg-neutral-100 flex items-center justify-center">
                                                                    <Package size={16} className="text-neutral-300" />
                                                                </div>
                                                            }
                                                        />
                                                    ) : (
                                                        <div className="w-full h-[72px] bg-neutral-100 flex items-center justify-center">
                                                            <Package size={16} className="text-neutral-300" />
                                                        </div>
                                                    )}
                                                    {image.isPrimary && (
                                                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center shadow">
                                                            <Star size={8} className="fill-white text-white" />
                                                        </div>
                                                    )}
                                                    {!image.isPrimary && id && imgUrl && (
                                                        <button
                                                            onClick={() => setPrimaryImageMutation.mutate({ productId: id, imageId: image.imageId })}
                                                            disabled={setPrimaryImageMutation.isPending}
                                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold"
                                                        >
                                                            {setPrimaryImageMutation.isPending ? '...' : 'Primary'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Details Column ──────────────────────────── */}
                    <div className="lg:col-span-7 flex flex-col gap-5">

                        {/* Product header card with gradient */}
                        <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
                            {/* Gradient header band */}
                            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 pt-5 pb-6">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h1 className="text-2xl font-bold text-white leading-tight">{product.name}</h1>
                                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow ${
                                        product.isActive
                                            ? 'bg-green-400/90 text-white'
                                            : 'bg-white/20 text-white/80 border border-white/30'
                                    }`}>
                                        {product.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {product.isActive ? t('products.active') : t('products.inactive')}
                                    </span>
                                </div>

                                {/* SKU */}
                                <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-1.5 cursor-default">
                                    <Hash size={13} className="text-white/60" />
                                    <span className="font-mono text-sm text-white/90 font-medium">{product.sku}</span>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(product.sku); toast.success('SKU kopyalandı'); }}
                                        className="text-white/60 hover:text-white transition-colors"
                                        title="SKU-nu kopyala"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Price row */}
                            <div className="px-6 py-5 border-b border-neutral-100">
                                {product.finalPrice && product.finalDiscountPercent ? (
                                    <div className="flex items-end gap-4 flex-wrap">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-4xl font-black text-neutral-900 tracking-tight">
                                                {product.finalPrice.toFixed(2)}
                                            </span>
                                            <span className="text-xl font-bold text-neutral-500">{product.currency}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-base line-through text-neutral-400">
                                                {product.price} {product.currency}
                                            </span>
                                            <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                                                -{product.finalDiscountPercent}%
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl font-black text-neutral-900 tracking-tight">{product.price}</span>
                                        <span className="text-xl font-bold text-neutral-500">{product.currency}</span>
                                    </div>
                                )}
                            </div>

                            {/* Current status chips (only when active) */}
                            {(isFeatured || isPopular || isBanner) && (
                                <div className="px-6 py-3 bg-neutral-50 flex items-center gap-2 flex-wrap">
                                    {isFeatured && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                            <Star size={11} className="fill-yellow-500 text-yellow-500" /> Featured
                                        </span>
                                    )}
                                    {isPopular && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                            <TrendingUp size={11} /> Məşhur
                                        </span>
                                    )}
                                    {isBanner && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                            <ImageIcon size={11} /> Banner
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Metadata 2×2 grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Category */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                        <Layers size={15} className="text-white" />
                                    </div>
                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{t('products.category')}</span>
                                </div>
                                <p className="text-base font-bold text-neutral-900 pl-0.5">{product.categoryName}</p>
                            </div>

                            {/* Brand */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                        <Box size={15} className="text-white" />
                                    </div>
                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{t('products.brand')}</span>
                                </div>
                                <p className="text-base font-bold text-neutral-900 pl-0.5">{product.brandName}</p>
                            </div>

                            {/* Stock */}
                            <div className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${
                                product.stock < 10
                                    ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                                    : 'bg-white border-neutral-200 hover:border-green-200'
                            }`}>
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${
                                        product.stock < 10 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}>
                                        <Package size={15} className="text-white" />
                                    </div>
                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{t('products.stock')}</span>
                                    {product.stock < 10 && <AlertTriangle size={13} className="text-orange-500 ml-auto" />}
                                </div>
                                <p className={`text-base font-bold pl-0.5 ${product.stock < 10 ? 'text-orange-700' : 'text-neutral-900'}`}>
                                    {product.stock} {t('product_details.units')}
                                </p>
                            </div>

                            {/* Date */}
                            <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                        <Calendar size={15} className="text-white" />
                                    </div>
                                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">{t('product_details.added')}</span>
                                </div>
                                <p className="text-base font-bold text-neutral-900 pl-0.5">
                                    {new Date(product.createdAt).toLocaleDateString('az-AZ', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Category Attributes — always visible */}
                        <div className="bg-white rounded-xl border border-neutral-200 shadow-md overflow-hidden">
                            {/* Section header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/60">
                                <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                                    <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                                        <Tags size={14} className="text-violet-600" />
                                    </div>
                                    Kateqoriya atributları
                                </h3>
                                {categoryAttributes.length > 0 && (
                                    <span className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                                        {categoryAttributes.length} atribut
                                    </span>
                                )}
                            </div>

                            <div className="p-5">
                                {categoryAttributes.length === 0 ? (
                                    /* Empty state */
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-2">
                                            <Tags size={18} className="text-neutral-400" />
                                        </div>
                                        <p className="text-sm font-medium text-neutral-500">Atribut tapılmadı</p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            "Düzəliş et" → "Inline atributlar" bölməsindən əlavə edin
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categoryAttributes.map((attr) => (
                                            <div
                                                key={attr.id}
                                                className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4 space-y-3"
                                            >
                                                {/* Attribute header */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-neutral-800 leading-tight">
                                                            {attr.displayName}
                                                        </p>
                                                        <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                                                            {attr.attributeType}
                                                        </p>
                                                    </div>
                                                    {attr.isRequired && (
                                                        <span className="shrink-0 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                            Tələb
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Values */}
                                                {attr.values.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {attr.values.map((val) => (
                                                            <span
                                                                key={val.id ?? val.value}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-neutral-200 text-neutral-700 shadow-sm"
                                                                style={val.colorCode
                                                                    ? { borderColor: val.colorCode, backgroundColor: `${val.colorCode}18` }
                                                                    : undefined}
                                                            >
                                                                {val.colorCode && (
                                                                    <span
                                                                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-sm"
                                                                        style={{ backgroundColor: val.colorCode }}
                                                                    />
                                                                )}
                                                                {val.displayValue || val.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-neutral-400 italic">Dəyər yoxdur</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-md p-5">
                                <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                                    <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <Layers size={14} className="text-amber-600" />
                                    </div>
                                    Variantlar
                                    <span className="ml-1 text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                                        {product.variants.length}
                                    </span>
                                </h3>
                                <div className="space-y-2">
                                    {product.variants.map((variant: ProductVariant, idx: number) => (
                                        <div key={variant.id} className="rounded-lg border border-neutral-200 p-3.5 bg-neutral-50/60">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <span className="text-sm font-semibold text-neutral-700">
                                                    Variant {idx + 1}
                                                </span>
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    variant.isActive
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                                                }`}>
                                                    {variant.isActive ? 'Aktiv' : 'Deaktiv'}
                                                </span>
                                            </div>
                                            {Object.keys(variant.attributes ?? {}).length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(variant.attributes).map(([key, value]) => (
                                                        <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-neutral-200">
                                                            <span className="text-neutral-400">{key}:</span>
                                                            <span className="font-semibold text-neutral-800">{String(value)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-neutral-400">Atribut təyin edilməyib</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-md p-5">
                                <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
                                    <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <Info size={14} className="text-primary-600" />
                                    </div>
                                    {t('product_details.description')}
                                </h3>
                                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
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

            {/* Popular Modal */}
            <Modal
                open={isPopularModalOpen}
                onClose={() => setIsPopularModalOpen(false)}
                title={t('products.set_popular')}
            >
                <div className="space-y-4">
                    <p className="text-sm text-neutral-600">
                        {t('products.popular_display_order_required')}
                    </p>
                    <Input
                        type="number"
                        label={t('products.display_order')}
                        min={1}
                        max={4}
                        value={popularDisplayOrder.toString()}
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= 4) {
                                setPopularDisplayOrder(value);
                            }
                        }}
                        required
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsPopularModalOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (id && popularDisplayOrder >= 1 && popularDisplayOrder <= 4) {
                                    setPopularMutation.mutate({
                                        productId: id,
                                        displayOrder: popularDisplayOrder,
                                    });
                                }
                            }}
                            loading={setPopularMutation.isPending}
                        >
                            {t('common.confirm')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
