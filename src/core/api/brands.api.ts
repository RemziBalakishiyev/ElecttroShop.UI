import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";

// --- Types ---

export interface Brand {
    id: string;
    name: string;
    discountPercent?: number | null;
    createdAt: string;
}

export interface BrandListParams {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
}

export interface CreateBrandRequest {
    name: string;
}

export interface UpdateBrandRequest {
    name: string;
}

export interface PagedBrandResponse extends ApiResponse<Brand[]> {
    value: Brand[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// --- API Functions ---

export const brandsApi = {
    getBrands: async (params?: BrandListParams) => {
        const response = await apiClient.get<PagedBrandResponse>(
            "/brands",
            { params }
        );
        return response.data;
    },

    getBrandById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<Brand>>(
            `/brands/${id}`
        );
        return response.data;
    },

    createBrand: async (data: CreateBrandRequest) => {
        const response = await apiClient.post<ApiResponse<Brand>>(
            "/brands",
            data
        );
        return response.data;
    },

    updateBrand: async (id: string, data: UpdateBrandRequest) => {
        const response = await apiClient.put<ApiResponse<Brand>>(
            `/brands/${id}`,
            data
        );
        return response.data;
    },

    deleteBrand: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<boolean>>(
            `/brands/${id}`
        );
        return response.data;
    },
};
