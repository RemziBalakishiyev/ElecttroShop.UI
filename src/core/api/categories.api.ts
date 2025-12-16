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

// Category Attribute Types
export interface CategoryAttributeValue {
    id?: string;
    value: string;
    displayValue?: string;
    displayOrder?: number;
    colorCode?: string | null;
}

export interface CategoryAttribute {
    id: string;
    name: string;
    displayName: string;
    attributeType: string;
    isRequired: boolean;
    displayOrder: number;
    values: CategoryAttributeValue[];
}

export interface CreateCategoryAttributeRequest {
    name: string;
    displayName: string;
    attributeType: string;
    isRequired?: boolean;
    displayOrder?: number;
}

export interface UpdateCategoryAttributeRequest {
    name: string;
    displayName: string;
    attributeType: string;
    isRequired?: boolean;
    displayOrder?: number;
}

export interface CreateAttributeValueRequest {
    value: string;
    displayValue?: string;
    displayOrder?: number;
    colorCode?: string | null;
}

export interface UpdateAttributeValueRequest {
    value: string;
    displayValue?: string;
    displayOrder?: number;
    colorCode?: string | null;
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

    // Category Attributes Management
    createCategoryAttribute: async (categoryId: string, data: CreateCategoryAttributeRequest) => {
        const response = await apiClient.post<ApiResponse<CategoryAttribute>>(
            `/categories/${categoryId}/attributes`,
            data
        );
        return response.data;
    },

    updateCategoryAttribute: async (id: string, data: UpdateCategoryAttributeRequest) => {
        const response = await apiClient.put<ApiResponse<CategoryAttribute>>(
            `/categories/attributes/${id}`,
            data
        );
        return response.data;
    },

    deleteCategoryAttribute: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/categories/attributes/${id}`
        );
        return response.data;
    },

    getCategoryAttributes: async (categoryId: string) => {
        const response = await apiClient.get<ApiResponse<CategoryAttribute[]>>(
            `/categories/${categoryId}/attributes`
        );
        return response.data;
    },

    // Category Attribute Values Management
    addAttributeValue: async (attributeId: string, data: CreateAttributeValueRequest) => {
        const response = await apiClient.post<ApiResponse<CategoryAttributeValue>>(
            `/categories/attributes/${attributeId}/values`,
            data
        );
        return response.data;
    },

    updateAttributeValue: async (valueId: string, data: UpdateAttributeValueRequest) => {
        const response = await apiClient.put<ApiResponse<CategoryAttributeValue>>(
            `/categories/attributes/values/${valueId}`,
            data
        );
        return response.data;
    },

    deleteAttributeValue: async (valueId: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/categories/attributes/values/${valueId}`
        );
        return response.data;
    },

    // Lookup API
    getLookup: async () => {
        const response = await apiClient.get<LookupApiResponse>(
            "/categories/lookup"
        );
        return response.data;
    },
};

// Lookup Types
export interface LookupItem {
    key: string;
    value: string;
}

export interface LookupResponse {
    items: LookupItem[];
    cachedAt?: string;
    cacheKey?: string;
}

export interface LookupApiResponse extends ApiResponse<LookupResponse> {
    value?: LookupResponse;
}
