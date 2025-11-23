import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";

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
        return response.data;
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
};
