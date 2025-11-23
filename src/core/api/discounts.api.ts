import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";

// --- Types ---

export type DiscountType = "Product" | "Brand" | "Category";

export interface Discount {
    id: string;
    type: DiscountType;
    productId: string | null;
    productName: string | null;
    brandId: string | null;
    brandName: string | null;
    categoryId: string | null;
    categoryName: string | null;
    targetName?: string; // For list view
    percent: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string | null;
}

export interface DiscountListItem {
    id: string;
    type: DiscountType;
    targetName: string;
    percent: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface DiscountListParams {
    page?: number;
    pageSize?: number;
    type?: DiscountType;
    isActive?: boolean;
    searchTerm?: string;
}

export interface CreateDiscountRequest {
    type: DiscountType;
    productId?: string | null;
    brandId?: string | null;
    categoryId?: string | null;
    percent: number;
    startDate: string;
    endDate?: string | null;
}

export interface UpdateDiscountRequest {
    percent: number;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
}

export interface PagedDiscountResponse extends ApiResponse<DiscountListItem[]> {
    value: DiscountListItem[];
    items?: DiscountListItem[]; // Fallback for compatibility
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
}

// --- API Functions ---

export const discountsApi = {
    getDiscounts: async (params?: DiscountListParams) => {
        const response = await apiClient.get<PagedDiscountResponse>(
            "/discounts",
            { params }
        );
        return response.data;
    },

    getDiscountById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<Discount>>(
            `/discounts/${id}`
        );
        return response.data;
    },

    createDiscount: async (data: CreateDiscountRequest) => {
        const response = await apiClient.post<ApiResponse<Discount>>(
            "/discounts",
            data
        );
        return response.data;
    },

    updateDiscount: async (id: string, data: UpdateDiscountRequest) => {
        const response = await apiClient.put<ApiResponse<Discount>>(
            `/discounts/${id}`,
            data
        );
        return response.data;
    },

    deleteDiscount: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<boolean>>(
            `/discounts/${id}`
        );
        return response.data;
    },
};

