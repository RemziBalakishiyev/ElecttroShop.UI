import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";

// --- Types ---

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parentName: string | null;
    discountPercent?: number | null;
    createdAt: string;
}

export interface CategoryListParams {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    parentId?: string;
    includeChildren?: boolean;
}

export interface CreateCategoryRequest {
    name: string;
    parentId?: string | null;
    slug?: string;
}

export interface UpdateCategoryRequest {
    name: string;
    parentId?: string | null;
    slug?: string;
}

export interface PagedCategoryResponse extends ApiResponse<Category[]> {
    value: Category[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

// --- API Functions ---

export const categoriesApi = {
    getCategories: async (params?: CategoryListParams) => {
        const response = await apiClient.get<PagedCategoryResponse>(
            "/categories",
            { params }
        );
        return response.data;
    },

    getCategoryById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<Category>>(
            `/categories/${id}`
        );
        return response.data;
    },

    getCategoryBySlug: async (slug: string) => {
        const response = await apiClient.get<ApiResponse<Category>>(
            `/categories/slug/${slug}`
        );
        return response.data;
    },

    createCategory: async (data: CreateCategoryRequest) => {
        const response = await apiClient.post<ApiResponse<Category>>(
            "/categories",
            data
        );
        return response.data;
    },

    updateCategory: async (id: string, data: UpdateCategoryRequest) => {
        const response = await apiClient.put<ApiResponse<Category>>(
            `/categories/${id}`,
            data
        );
        return response.data;
    },

    deleteCategory: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<boolean>>(
            `/categories/${id}`
        );
        return response.data;
    },
};
