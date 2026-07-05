import apiClient from "./apiClient";
import { imagesApi } from "./images.api";
import type { CategoryAttribute } from "./categories.api";
import type { ApiResponse } from "../types/auth.types";
import { unwrapApiData } from "../../utils/apiResponse";

// --- Types ---

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    finalDiscountPercent?: number | null;
    finalPrice?: number | null;
    currency: string;
    sku: string;
    categoryId: string;
    categoryName: string;
    brandId: string;
    brandName: string;
    vatRate: number;
    stock: number;
    isActive: boolean;
    imageId: string | null;
    imageUrl: string | null;
    primaryImageUrl?: string | null;
    mainImageUrl?: string | null;
    thumbnailUrl?: string | null;
    imagePath?: string | null;
    images?: ProductImage[];
    isBanner?: boolean;
    isFeatured?: boolean;
    isPopular?: boolean;
    displayOrder?: number | null;
    popularDisplayOrder?: number | null;
    categoryAttributes?: CategoryAttribute[];
    variants?: ProductVariant[];
    rowVersion?: number;
    createdAt: string;
    updatedAt: string | null;
}

export interface ProductListParams {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
}

// Product Image Types
export interface ProductImage {
    id: string;
    imageId: string;
    imageUrl: string;
    url?: string;
    imagePath?: string;
    displayOrder: number;
    isPrimary: boolean;
}

export interface AddProductImageRequest {
    imageId: string;
    displayOrder?: number;
    isPrimary?: boolean;
}

// Product Variant Types
// Note: SKU, Price, Currency, and Stock are at Product level, not Variant level
// Variants only represent attribute combinations
export interface ProductVariant {
    id: string;
    // Deprecated: These fields are now at Product level
    sku?: string;
    price?: number;
    currency?: string;
    stock?: number;
    isActive: boolean;
    imageId: string | null;
    imageUrl: string | null;
    attributes: Record<string, string>;
    finalDiscountPercent?: number | null;
    finalPrice?: number | null;
}

/** @deprecated Prefer ProductVariantRequest on create/update product body */
export interface CreateProductVariantRequest {
    imageId?: string | null;
    attributes: Record<string, string>;
}

/** @deprecated Prefer ProductVariantRequest on create/update product body */
export interface UpdateProductVariantRequest {
    imageId?: string | null;
    attributes: Record<string, string>;
    isActive?: boolean;
}

export interface InlineProductAttributeValue {
    value: string;
    displayValue?: string;
    displayOrder: number;
    colorCode?: string;
}

export interface InlineProductAttribute {
    name: string;
    displayName: string;
    attributeType: string;
    isRequired: boolean;
    displayOrder: number;
    values: InlineProductAttributeValue[];
}

export interface ProductVariantRequest {
    id?: string | null;
    imageId?: string | null;
    attributes: Record<string, string>;
    isActive?: boolean;
}

export interface CreateProductRequest {
    name: string;
    description?: string | null;
    price: number;
    currency?: string;
    sku: string;
    categoryId: string;
    brandId: string;
    vatRate?: number;
    stock: number;
    imageIds?: string[];
    inlineAttributes?: InlineProductAttribute[];
    variants?: ProductVariantRequest[];
}

export interface UpdateProductRequest {
    name: string;
    description?: string | null;
    price: number;
    currency?: string;
    categoryId: string;
    brandId: string;
    vatRate?: number;
    stock: number;
    rowVersion: number;
    imageIds?: string[];
    inlineAttributes?: InlineProductAttribute[];
    variants?: ProductVariantRequest[];
}

export interface PopularProduct {
    id: string;
    name: string;
    shortDescription: string | null;
    imageUrl: string | null;
    displayOrder: number;
    isActive?: boolean;
}

export interface PagedApiResponse<T> extends ApiResponse<T[]> {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export const StockOperation = {
    Increase: 1,
    Decrease: 2,
} as const;

export type StockOperation = typeof StockOperation[keyof typeof StockOperation];

// --- API Functions ---

export const productsApi = {
    getProducts: async (params?: ProductListParams) => {
        const response = await apiClient.get<PagedApiResponse<Product>>(
            "/Products",
            { params }
        );
        return response.data;
    },

    getProductById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<Product>>(
            `/Products/${id}`
        );
        return unwrapApiData<Product>(response.data);
    },

    searchProducts: async (searchTerm: string, page = 1, pageSize = 20) => {
        const response = await apiClient.get<PagedApiResponse<Product>>(
            "/Products/search",
            {
                params: { searchTerm, page, pageSize },
            }
        );
        return response.data;
    },

    createProduct: async (data: CreateProductRequest) => {
        const response = await apiClient.post<ApiResponse<Product>>(
            "/Products",
            data
        );
        return response.data;
    },

    updateProduct: async (id: string, data: UpdateProductRequest) => {
        const response = await apiClient.put<ApiResponse<Product>>(
            `/Products/${id}`,
            data
        );
        return response.data;
    },

    deleteProduct: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/Products/${id}`
        );
        return response.data;
    },

    updatePrice: async (id: string, newPrice: number) => {
        const response = await apiClient.patch<ApiResponse<null>>(
            `/Products/${id}/price`,
            { newPrice }
        );
        return response.data;
    },

    updateStock: async (
        id: string,
        quantity: number,
        operation: StockOperation
    ) => {
        const response = await apiClient.patch<ApiResponse<null>>(
            `/Products/${id}/stock`,
            { quantity, operation }
        );
        return response.data;
    },

    uploadImage: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post<ApiResponse<Product>>(
            `/Products/${id}/image`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },

    // Banner Management
    setBanner: async (productId: string) => {
        const response = await apiClient.post<ApiResponse<null>>(
            `/Products/${productId}/banner`
        );
        return response.data;
    },

    removeBanner: async (productId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/Products/${productId}/banner`
        );
        return response.data;
    },

    // Featured Management
    setFeatured: async (productId: string, displayOrder: number) => {
        const response = await apiClient.post<ApiResponse<null>>(
            `/Products/${productId}/featured`,
            { displayOrder }
        );
        return response.data;
    },

    removeFeatured: async (productId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/Products/${productId}/featured`
        );
        return response.data;
    },

    // Popular Management
    getPopularProducts: async () => {
        const response = await apiClient.get<ApiResponse<PopularProduct[]>>(
            "/Products/popular"
        );
        return unwrapApiData<PopularProduct[]>(response.data) ?? [];
    },

    setPopular: async (productId: string, displayOrder: number) => {
        const response = await apiClient.post<ApiResponse<null>>(
            `/Products/${productId}/popular`,
            { displayOrder }
        );
        return response.data;
    },

    removePopular: async (productId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/Products/${productId}/popular`
        );
        return response.data;
    },

    // Product Images Management
    addProductImage: async (productId: string, data: AddProductImageRequest) => {
        const response = await apiClient.post<ApiResponse<ProductImage>>(
            `/Products/${productId}/images`,
            data
        );
        return response.data;
    },

    deleteProductImage: async (productId: string, imageId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/Products/${productId}/images/${imageId}`
        );
        return response.data;
    },

    setPrimaryImage: async (productId: string, imageId: string) => {
        const response = await apiClient.post<ApiResponse<null>>(
            `/Products/${productId}/images/${imageId}/primary`
        );
        return response.data;
    },

    // Product Variants Management
    createProductVariant: async (productId: string, data: CreateProductVariantRequest) => {
        const response = await apiClient.post<ApiResponse<ProductVariant>>(
            `/Products/${productId}/variants`,
            data
        );
        return response.data;
    },

    updateProductVariant: async (
        productId: string,
        variantId: string,
        data: UpdateProductVariantRequest
    ) => {
        const response = await apiClient.put<ApiResponse<ProductVariant>>(
            `/Products/${productId}/variants/${variantId}`,
            data
        );
        return response.data;
    },

    deleteProductVariant: async (productId: string, variantId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/Products/${productId}/variants/${variantId}`
        );
        return response.data;
    },

    /** Upload files and link each to a product without replacing existing images */
    addProductImagesFromFiles: async (
        productId: string,
        files: File[],
        existingImageCount = 0
    ) => {
        for (let i = 0; i < files.length; i++) {
            const imageResponse = await imagesApi.uploadImage(files[i]);
            const imageData = (imageResponse as any)?.value || imageResponse;
            const imageId = imageData?.imageId || imageData?.id;
            if (!imageId) continue;

            await productsApi.addProductImage(productId, {
                imageId,
                displayOrder: existingImageCount + i,
                isPrimary: existingImageCount === 0 && i === 0,
            });
        }
    },
};

export function getProductExistingImageCount(
    product?: Pick<Product, "images" | "imageId"> | null,
    existingImageIds?: string[]
): number {
    if (existingImageIds?.length) return existingImageIds.length;
    if (product?.images?.length) return product.images.length;
    if (product?.imageId) return 1;
    return 0;
}

export async function buildProductImageIdsForSave(
    existingImageIds: string[] | undefined,
    newFiles: File[] | undefined,
    product?: Pick<Product, "images" | "imageId"> | null
): Promise<string[]> {
    const imageIds: string[] = [];
    const seen = new Set<string>();

    const addId = (id?: string | null) => {
        if (id && !seen.has(id)) {
            seen.add(id);
            imageIds.push(id);
        }
    };

    existingImageIds?.forEach(addId);
    product?.images?.forEach((img) => addId(img.imageId));
    addId(product?.imageId);

    for (const file of newFiles ?? []) {
        const imageResponse = await imagesApi.uploadImage(file);
        const imageData = unwrapApiData<{ imageId?: string; id?: string }>(imageResponse);
        addId(imageData?.imageId || imageData?.id);
    }

    return imageIds;
}
