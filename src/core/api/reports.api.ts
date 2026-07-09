import apiClient from "./apiClient";

/** Aylıq satış hesabatının ümumi göstəriciləri. */
export interface MonthlySalesReportSummary {
    salesCount: number;
    totalQuantity: number;
    totalSalesAmount: number;
    totalCostAmount: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    averageSaleAmount: number;
    profitMarginPercent: number;
}

/** Ay ərzində bir günün satış xülasəsi (günlük qrafik üçün). */
export interface DailySalesReport {
    date: string;
    dayLabel: string | null;
    salesCount: number;
    totalSalesAmount: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
}

/** Ən çox satılan məhsul sətri. */
export interface TopProductReport {
    productName: string | null;
    sku: string | null;
    categoryName: string | null;
    quantity: number;
    totalSalesAmount: number;
    totalProfit: number;
}

/** Kateqoriya üzrə satış xülasəsi. */
export interface CategorySalesReport {
    categoryName: string | null;
    salesCount: number;
    quantity: number;
    totalSalesAmount: number;
    totalProfit: number;
}

/** Satış növü (Mövcud məhsul / Manuel giriş) üzrə bölgü. */
export interface SaleTypeReport {
    saleType: string | null;
    salesCount: number;
    totalSalesAmount: number;
    totalProfit: number;
}

/** Mənfəət / zərər analizi üçün məhsul sətri. */
export interface ProfitLossProductReport {
    productName: string | null;
    sku: string | null;
    totalSalesAmount: number;
    totalCostAmount: number;
    totalExpenses: number;
    netProfit: number;
    profitMarginPercent: number;
}

/** Tək satış sətri (son satışlar / bütün satışlar). */
export interface MonthlySalesReportItem {
    productName: string | null;
    productCode: string | null;
    sku: string | null;
    categoryName: string | null;
    saleType: string | null;
    salePrice: number;
    quantity: number;
    totalCostAmount: number;
    totalSalesAmount: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    profit: number;
    saleDate: string;
}

/** `GET /reports/sales/monthly` cavabının tam sxemi. */
export interface MonthlySalesReport {
    year: number;
    month: number;
    monthName: string | null;
    startDate: string;
    endDate: string;
    generatedAt: string;
    reportDate: string;
    summary: MonthlySalesReportSummary;
    dailySales: DailySalesReport[] | null;
    topProducts: TopProductReport[] | null;
    categorySales: CategorySalesReport[] | null;
    saleTypeBreakdown: SaleTypeReport[] | null;
    profitLossProducts: ProfitLossProductReport[] | null;
    recentSales: MonthlySalesReportItem[] | null;
    items: MonthlySalesReportItem[] | null;
}

export const reportsApi = {
    // Bu endpoint DTO-nu birbaşa qaytarır (ApiResponse zərfi yoxdur).
    getMonthlySalesReport: async (year: number, month: number) => {
        const response = await apiClient.get<MonthlySalesReport>(
            "/reports/sales/monthly",
            { params: { year, month } }
        );
        return response.data;
    },
};
