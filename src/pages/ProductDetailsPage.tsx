import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Calendar, Box, Info,
    Edit, Trash2, Package, Layers, Hash, CheckCircle, XCircle
} from "lucide-react";
import { productsApi } from "../core/api/products.api";
import { Button } from "../components/commons/Button";
import { API_CONFIG } from "../core/config/api.config";
import { AddItemModal } from "../components/modals/AddItemModal";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
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

    const { data, isLoading, isError } = useQuery({
        queryKey: ["product", id],
        queryFn: () => productsApi.getProductById(id!),
        enabled: !!id,
    });

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

    const uploadImageMutation = useMutation({
        mutationFn: (data: { id: string; file: File }) =>
            productsApi.uploadImage(data.id, data.file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product", id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: () => {
            toast.error(t('products.image_upload_error'));
        },
    });

    const handleSaveProduct = async (formData: any) => {
        if (!id) return;

        try {
            // Map AddItemModal formData to UpdateProductRequest
            const updateData: UpdateProductRequest = {
                name: formData.itemName,
                description: formData.description,
                price: Number(formData.price),
                currency: formData.currency,
                // sku: formData.itemNumber, // SKU is not updatable in UpdateProductRequest
                categoryId: formData.category,
                brandId: formData.manufacturer,
                stock: Number(formData.amount),
                vatRate: 0, // Default or from form if available
            };

            await updateMutation.mutateAsync({
                id,
                data: updateData
            });

            if (formData.image) {
                await uploadImageMutation.mutateAsync({ id, file: formData.image });
            }
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

    const imageUrl = product.imageUrl
        ? (product.imageUrl.startsWith("http") ? product.imageUrl : `${API_CONFIG.BASE_URL}${product.imageUrl}`)
        : null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Navigation */}
            <nav className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <button
                        onClick={() => navigate("/")}
                        className="hover:text-primary-600 transition-colors flex items-center gap-1"
                    >
                        <ArrowLeft size={16} />
                        {t('product_details.back')}
                    </button>
                    <span className="text-neutral-300">/</span>
                    <span className="font-medium text-neutral-900 truncate max-w-[200px]">{product.name}</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Edit size={16} />
                        {t('product_details.edit')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        {t('product_details.delete')}
                    </Button>
                </div>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Column: Image */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-white opacity-50" />
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="relative z-10 w-full h-full object-contain max-h-[500px] transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/600?text=No+Image";
                                }}
                            />
                        ) : (
                            <div className="relative z-10 flex flex-col items-center text-neutral-300">
                                <Package size={64} strokeWidth={1} />
                                <span className="mt-4 text-sm font-medium">{t('product_details.no_image')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Title & Price */}
                    <div className="space-y-4 border-b border-neutral-100 pb-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">{product.name}</h1>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${product.isActive
                                        ? "bg-green-50 text-green-700 border-green-100"
                                        : "bg-neutral-50 text-neutral-600 border-neutral-200"
                                        }`}>
                                        {product.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {product.isActive ? t('products.active') : t('products.inactive')}
                                    </span>
                                </div>
                                <p className="text-neutral-500 font-mono text-sm flex items-center gap-2">
                                    <Hash size={14} />
                                    {product.sku}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {product.finalPrice && product.finalDiscountPercent ? (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl line-through text-neutral-400">
                                            {product.price}
                                        </span>
                                        <span className="text-xl line-through text-neutral-400">{product.currency}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-primary-600 tracking-tight">
                                            {product.finalPrice.toFixed(2)}
                                        </span>
                                        <span className="text-xl font-medium text-primary-600">{product.currency}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-semibold">
                                        <span>-{product.finalDiscountPercent}%</span>
                                        <span className="text-xs text-success/70">{t('products.discount')}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-primary-600 tracking-tight">
                                        {product.price}
                                    </span>
                                    <span className="text-xl font-medium text-neutral-400">{product.currency}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 hover:border-primary-100 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                    <Layers size={18} />
                                </div>
                                <span className="text-sm font-medium text-neutral-500">{t('products.category')}</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 pl-1">{product.categoryName}</p>
                        </div>

                        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 hover:border-primary-100 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                    <Box size={18} />
                                </div>
                                <span className="text-sm font-medium text-neutral-500">{t('products.brand')}</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 pl-1">{product.brandName}</p>
                        </div>

                        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 hover:border-primary-100 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                    <Package size={18} />
                                </div>
                                <span className="text-sm font-medium text-neutral-500">{t('products.stock')}</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 pl-1">{product.stock} {t('product_details.units')}</p>
                        </div>

                        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 hover:border-primary-100 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-primary-600">
                                    <Calendar size={18} />
                                </div>
                                <span className="text-sm font-medium text-neutral-500">{t('product_details.added')}</span>
                            </div>
                            <p className="text-lg font-semibold text-neutral-900 pl-1">
                                {new Date(product.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                            <Info size={20} className="text-primary-600" />
                            {t('product_details.description')}
                        </h3>
                        <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
                            {product.description || (
                                <span className="text-neutral-400 italic">{t('product_details.no_description')}</span>
                            )}
                        </div>
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
        </div>
    );
};
