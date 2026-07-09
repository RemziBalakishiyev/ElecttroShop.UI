import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";
import type { PagedApiResponse } from "./products.api";

export type SaleSource = "ExistingProduct" | "ManualEntry";

export type ExpenseType = "Installation" | "Delivery" | "Service" | "Commission" | "Other";

export interface SaleExpenseDto {
    id: string;
    expenseType: ExpenseType;
    description: string | null;
    amount: number;
    createdAt: string;
}

export interface SaleExpenseRequestDto {
    expenseType: ExpenseType;
    description?: string | null;
    amount: number;
}

export interface SaleListItemDto {
    id: string;
    productId: string | null;
    productName: string;
    productCode: string | null;
    categoryId: string | null;
    categoryName: string | null;
    costPrice: number;
    salePrice: number;
    quantity: number;
    totalCost: number;
    totalSaleAmount: number;
    totalExpenses: number;
    profit: number;
    saleSource: SaleSource;
    soldAt: string;
    note: string | null;
    createdAt: string;
}

export interface SaleDetailDto extends SaleListItemDto {
    totalExpenses: number;
    expenses: SaleExpenseDto[];
    updatedAt: string | null;
    createdBy: string | null;
    updatedBy: string | null;
}

export interface CreateSaleCommand {
    productId?: string | null;
    productName?: string | null;
    productCode?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    costPrice?: number | null;
    salePrice: number;
    quantity: number;
    soldAt?: string | null;
    note?: string | null;
    expenses?: SaleExpenseRequestDto[];
}

export interface UpdateSaleCommand {
    productName?: string | null;
    productCode?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    costPrice?: number | null;
    salePrice: number;
    quantity: number;
    soldAt?: string | null;
    note?: string | null;
    expenses?: SaleExpenseRequestDto[] | null;
}

export interface SaleListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    productId?: string;
    saleSource?: SaleSource;
    dateFrom?: string;
    dateTo?: string;
    minProfit?: number;
    maxProfit?: number;
    minExpense?: number;
    maxExpense?: number;
}

export const salesApi = {
    getSales: async (params?: SaleListParams) => {
        const response = await apiClient.get<PagedApiResponse<SaleListItemDto>>(
            "/sales",
            { params }
        );
        return response.data;
    },

    getSaleById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<SaleDetailDto>>(
            `/sales/${id}`
        );
        return response.data;
    },

    createSale: async (data: CreateSaleCommand) => {
        const response = await apiClient.post<ApiResponse<SaleDetailDto>>(
            "/sales",
            data
        );
        return response.data;
    },

    updateSale: async (id: string, data: UpdateSaleCommand) => {
        const response = await apiClient.put<ApiResponse<SaleDetailDto>>(
            `/sales/${id}`,
            data
        );
        return response.data;
    },

    deleteSale: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<null>>(
            `/sales/${id}`
        );
        return response.data;
    },

    exportSalesExcel: async (year: number, month: number) => {
        return apiClient.get<Blob>("/sales/export/excel", {
            params: { year, month },
            responseType: "blob",
        });
    },

    exportSalesPdf: async (year: number, month: number) => {
        return apiClient.get<Blob>("/sales/export/pdf", {
            params: { year, month },
            responseType: "blob",
        });
    },
};
