import apiClient from "./apiClient";
import type { ApiResponse } from "../types/auth.types";
import type { PagedApiResponse } from "./products.api";

/**
 * Nisyə (credit sale) API modulu.
 *
 * QEYD: contracts/openapi.json backend-də credit-sales endpointlərini hələ
 * əks etdirmir (köhnəlmişdir). Aşağıdakı DTO sahə adları Sales moduluna
 * (sales.api.ts) və tələb sənədinə əsasən ən yaxın təxminlə yazılıb.
 * İnteqrasiya zamanı real API cavabı yoxlanılıb sahə adları dəqiqləşdirilməlidir —
 * dəyişiklik yalnız bu faylla məhdudlaşır.
 */

export type CreditSaleStatus = "Pending" | "Overdue" | "Sold" | "Cancelled";

export type ProductSourceType = "ExistingProduct" | "ManualEntry";

/**
 * Backend `productSourceType`-i rəqəmli enum kimi qəbul edir.
 * Backend validasiyası: **Manual = 1, SystemProduct (ExistingProduct) = 2**.
 */
export const PRODUCT_SOURCE_TYPE_NUMERIC: Record<ProductSourceType, number> = {
    ManualEntry: 1,
    ExistingProduct: 2,
};

/** Cavabda gələn source dəyərini (string və ya rəqəm) sabit union-a çevirir. */
export function normalizeProductSource(raw: unknown): ProductSourceType {
    if (raw === 1 || raw === "1" || raw === "ManualEntry") return "ManualEntry";
    return "ExistingProduct";
}

export type ExpenseType = "Installation" | "Delivery" | "Service" | "Commission" | "Other";

export interface CreditSaleExpenseDto {
    id: string;
    expenseType: ExpenseType;
    description: string | null;
    amount: number;
    createdAt: string;
}

export interface CreditSaleExpenseRequestDto {
    expenseType: ExpenseType;
    description?: string | null;
    amount: number;
}

export interface CreditSaleListItem {
    id: string;
    customerName: string | null;
    customerPhone: string | null;
    productId: string | null;
    productName: string;
    sku: string | null;
    categoryId: string | null;
    categoryName: string | null;
    quantity: number;
    costPrice: number;
    salePrice: number;
    totalCost: number;
    totalSaleAmount: number;
    totalExpenses: number;
    profit: number;
    netProfit: number;
    creditDate: string;
    dueDate: string | null;
    status: CreditSaleStatus;
    /** Cavabda string ("ManualEntry") və ya rəqəm ola bilər — `normalizeProductSource` ilə oxuyun. */
    productSourceType: ProductSourceType | number | string;
    note: string | null;
    convertedAt: string | null;
    convertedSaleId: string | null;
    createdAt: string;
}

export interface CreditSaleDetail extends CreditSaleListItem {
    expenses: CreditSaleExpenseDto[];
    updatedAt: string | null;
    createdBy: string | null;
    updatedBy: string | null;
}

export interface CreateCreditSaleRequest {
    customerName?: string | null;
    customerPhone?: string | null;
    productSourceType: number;
    productId?: string | null;
    productName?: string | null;
    sku?: string | null;
    costPrice: number;
    salePrice: number;
    quantity: number;
    creditDate: string;
    dueDate?: string | null;
    expenses?: CreditSaleExpenseRequestDto[];
    note?: string | null;
}

export interface UpdateCreditSaleRequest {
    customerName?: string | null;
    customerPhone?: string | null;
    costPrice: number;
    salePrice: number;
    quantity: number;
    creditDate: string;
    dueDate?: string | null;
    expenses?: CreditSaleExpenseRequestDto[];
    note?: string | null;
}

export interface MarkAsSoldRequest {
    soldAt: string;
}

export interface CreditSaleSummary {
    openCount: number;
    openAmount: number;
    overdueCount: number;
    overdueAmount: number;
    totalDebtAmount: number;
    expectedProfit: number;
    soldThisMonthCount: number;
    soldThisMonthAmount: number;
    netIncome: number;
}

export interface CreditSaleListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: CreditSaleStatus;
    productSource?: ProductSourceType;
    creditDateFrom?: string;
    creditDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
}

export interface CreditSaleSummaryParams {
    creditDateFrom?: string;
    creditDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
}

export const creditSalesApi = {
    getCreditSales: async (params?: CreditSaleListParams) => {
        const response = await apiClient.get<PagedApiResponse<CreditSaleListItem>>(
            "/credit-sales",
            { params }
        );
        return response.data;
    },

    getCreditSaleById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<CreditSaleDetail>>(
            `/credit-sales/${id}`
        );
        return response.data;
    },

    createCreditSale: async (data: CreateCreditSaleRequest) => {
        const response = await apiClient.post<ApiResponse<CreditSaleDetail>>(
            "/credit-sales",
            data
        );
        return response.data;
    },

    updateCreditSale: async (id: string, data: UpdateCreditSaleRequest) => {
        const response = await apiClient.put<ApiResponse<CreditSaleDetail>>(
            `/credit-sales/${id}`,
            data
        );
        return response.data;
    },

    markCreditSaleAsSold: async (id: string, data: MarkAsSoldRequest) => {
        const response = await apiClient.post<ApiResponse<CreditSaleDetail>>(
            `/credit-sales/${id}/mark-as-sold`,
            data
        );
        return response.data;
    },

    cancelCreditSale: async (id: string) => {
        const response = await apiClient.post<ApiResponse<CreditSaleDetail>>(
            `/credit-sales/${id}/cancel`,
            {}
        );
        return response.data;
    },

    getCreditSalesSummary: async (params?: CreditSaleSummaryParams) => {
        const response = await apiClient.get<ApiResponse<CreditSaleSummary>>(
            "/credit-sales/summary",
            { params }
        );
        return response.data;
    },
};
