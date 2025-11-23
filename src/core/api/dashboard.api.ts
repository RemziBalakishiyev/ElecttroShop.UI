import apiClient from "./apiClient";

// --- Types ---

export interface DashboardStatisticsDto {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    ordersThisMonth: number;
    totalCustomers: number;
    totalCategories: number;
    totalBrands: number;
    totalRevenue: number;
    revenueCurrency: string;
    revenueThisMonth: number;
    pendingOrders: number;
    processingOrders: number;
    deliveredOrders: number;
}

export interface ProductListDto {
    id: string;
    name: string;
    price: number;
    currency: string;
    sku: string;
    categoryName: string;
    brandName: string;
    stock: number;
    isActive: boolean;
    imageUrl: string | null;
}

export interface OrderSummaryDto {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    status: string; // "Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"
    total: number;
    currency: string;
    itemCount: number;
    createdAt: string;
}

export interface DashboardDto {
    statistics: DashboardStatisticsDto;
    recentProducts: ProductListDto[];
    recentOrders: OrderSummaryDto[];
}

// --- API Functions ---

export const dashboardApi = {
    getDashboardData: async () => {
        const response = await apiClient.get<DashboardDto>("/Dashboard");
        return response.data;
    },

    getDashboardChart: async (period: "daily" | "weekly" | "monthly" = "monthly", periodCount: number = 12) => {
        const response = await apiClient.get<ChartDataPoint[]>("/Dashboard/chart", {
            params: { period, periodCount },
        });
        return response.data;
    },
};

export interface ChartDataPoint {
    date: string;
    value: number;
}
