import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users, ShoppingBag, Package,
    ArrowUpRight, ArrowDownRight, DollarSign,
    TrendingUp, TrendingDown, BarChart3,
    type LucideIcon
} from "lucide-react";
import { dashboardApi } from "../core/api/dashboard.api";
import { resolveImageUrl } from "../utils/imageUrl";
import { DashboardChart } from "../components/dashboard/DashboardChart";
import { PromotionalBrands } from "../components/dashboard/PromotionalBrands";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

const STAT_TINTS: Record<string, { light: string; dark: string }> = {
    emerald: { light: "bg-emerald-50 text-emerald-600", dark: "bg-emerald-500/10 text-emerald-400" },
    blue: { light: "bg-blue-50 text-blue-600", dark: "bg-blue-500/10 text-blue-400" },
    violet: { light: "bg-violet-50 text-violet-600", dark: "bg-violet-500/10 text-violet-400" },
    orange: { light: "bg-orange-50 text-orange-600", dark: "bg-orange-500/10 text-orange-400" },
    green: { light: "bg-green-50 text-green-600", dark: "bg-green-500/10 text-green-400" },
    rose: { light: "bg-rose-50 text-rose-600", dark: "bg-rose-500/10 text-rose-400" },
};

type StatCardProps = {
    title: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    trend?: "up" | "down";
    color?: keyof typeof STAT_TINTS;
};

const StatCard = ({ title, value, subValue, icon: Icon, trend, color = "blue" }: StatCardProps) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const tint = STAT_TINTS[color] ?? STAT_TINTS.blue;
    return (
        <div className={cn(
          "rounded-xl p-6 border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
          theme === "light"
            ? "bg-white border-neutral-100"
            : "bg-neutral-800 border-neutral-700"
        )}>
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      theme === "light" ? "text-neutral-500" : "text-neutral-400"
                    )}>{title}</p>
                    <h3 className={cn(
                      "text-2xl font-bold mt-2 tracking-tight",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>{value}</h3>
                </div>
                <div className={cn(
                  "p-3 rounded-xl shrink-0",
                  theme === "light" ? tint.light : tint.dark
                )}>
                    <Icon size={20} />
                </div>
            </div>
            {subValue && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className={cn(
                      "flex items-center gap-1 font-medium",
                      trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}>
                        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {subValue}
                    </span>
                    <span className={theme === "light" ? "text-neutral-400" : "text-neutral-500"}>{t('dashboard.vs_last_month')}</span>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles: Record<string, { light: string; dark: string }> = {
        Paid: { light: "bg-green-50 text-green-700 border-green-100", dark: "bg-green-500/10 text-green-400 border-green-500/20" },
        Processing: { light: "bg-blue-50 text-blue-700 border-blue-100", dark: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        Pending: { light: "bg-yellow-50 text-yellow-700 border-yellow-100", dark: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        Delivered: { light: "bg-purple-50 text-purple-700 border-purple-100", dark: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
        Cancelled: { light: "bg-red-50 text-red-700 border-red-100", dark: "bg-red-500/10 text-red-400 border-red-500/20" },
    };
    const fallback = theme === "light" ? "bg-neutral-50 text-neutral-600 border-neutral-200" : "bg-neutral-700/40 text-neutral-300 border-neutral-600";

    return (
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-medium border",
          styles[status] ? (theme === "light" ? styles[status].light : styles[status].dark) : fallback
        )}>
            {t(`status.${status}`, { defaultValue: status })}
        </span>
    );
};

export const DashboardPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [salesTab, setSalesTab] = useState<"daily" | "monthly">("daily");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["dashboard"],
        queryFn: dashboardApi.getDashboardData,
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboardStatistics"],
        queryFn: dashboardApi.getStatistics,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-600">
                <p className="text-lg font-medium">{t('common.dashboard_load_error')}</p>
            </div>
        );
    }

    const { statistics, recentOrders, recentProducts } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={cn(
                  "hidden sm:flex w-12 h-12 rounded-xl items-center justify-center shrink-0",
                  theme === "light" ? "bg-primary-50 text-primary-600" : "bg-primary-500/10 text-primary-400"
                )}>
                    <BarChart3 size={22} />
                </div>
                <div>
                    <h1 className={cn(
                      "text-2xl font-bold tracking-tight",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>{t('dashboard.title')}</h1>
                    <p className={cn(
                      "mt-1",
                      theme === "light" ? "text-neutral-500" : "text-neutral-400"
                    )}>{t('dashboard.subtitle')}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.total_revenue')}
                    value={`${statistics.totalRevenue.toLocaleString()} ${statistics.revenueCurrency}`}
                    subValue={`+${statistics.revenueThisMonth.toLocaleString()}`}
                    trend="up"
                    icon={DollarSign}
                    color="emerald"
                />
                <StatCard
                    title={t('dashboard.total_orders')}
                    value={statistics.totalOrders}
                    subValue={`+${statistics.ordersThisMonth}`}
                    trend="up"
                    icon={ShoppingBag}
                    color="blue"
                />
                <StatCard
                    title={t('dashboard.active_products')}
                    value={statistics.activeProducts}
                    subValue={`${statistics.totalProducts} ${t('dashboard.total')}`}
                    trend="up"
                    icon={Package}
                    color="violet"
                />
                <StatCard
                    title={t('dashboard.total_customers')}
                    value={statistics.totalCustomers}
                    trend="up"
                    icon={Users}
                    color="orange"
                />
            </div>

            {/* Sales Statistics */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className={cn(
                        "text-lg font-bold",
                        theme === "light" ? "text-neutral-900" : "text-white"
                    )}>
                        {t('dashboard.sales_statistics')}
                    </h2>
                    <div className={cn(
                        "flex p-1 rounded-lg",
                        theme === "light" ? "bg-neutral-100" : "bg-neutral-900"
                    )}>
                        {(["daily", "monthly"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSalesTab(tab)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                    salesTab === tab
                                        ? theme === "light"
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "bg-neutral-700 text-white shadow-sm"
                                        : theme === "light"
                                        ? "text-neutral-500 hover:text-neutral-900"
                                        : "text-neutral-400 hover:text-white"
                                )}
                            >
                                {tab === "daily" ? t('dashboard.daily_sales') : t('dashboard.monthly_sales')}
                            </button>
                        ))}
                    </div>
                </div>

                {statsLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    </div>
                ) : statsData ? (
                    <div className="space-y-6">
                        {(() => {
                            const s = salesTab === "daily" ? statsData.dailySales : statsData.monthlySales;
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <StatCard
                                        title={t('dashboard.total_sale_amount')}
                                        value={`${s.totalSaleAmount.toLocaleString()} AZN`}
                                        icon={DollarSign}
                                        color="emerald"
                                    />
                                    <StatCard
                                        title={t('dashboard.total_profit')}
                                        value={`${s.totalProfit.toLocaleString()} AZN`}
                                        icon={TrendingUp}
                                        color="green"
                                    />
                                    <StatCard
                                        title={t('dashboard.total_expenses')}
                                        value={`${s.totalExpenses.toLocaleString()} AZN`}
                                        icon={TrendingDown}
                                        color="orange"
                                    />
                                    <StatCard
                                        title={t('dashboard.total_product_cost')}
                                        value={`${s.totalProductCost.toLocaleString()} AZN`}
                                        icon={Package}
                                        color="blue"
                                    />
                                    <StatCard
                                        title={t('dashboard.sold_product_qty')}
                                        value={s.soldProductQuantity}
                                        icon={ShoppingBag}
                                        color="violet"
                                    />
                                    <StatCard
                                        title={t('dashboard.sales_count')}
                                        value={s.salesCount}
                                        icon={BarChart3}
                                        color="rose"
                                    />
                                </div>
                            );
                        })()}

                        <div className={cn(
                            "rounded-xl border shadow-sm p-6 space-y-4",
                            theme === "light"
                                ? "bg-white border-neutral-100"
                                : "bg-neutral-800 border-neutral-700"
                        )}>
                            <h3 className={cn(
                                "text-sm font-semibold",
                                theme === "light" ? "text-neutral-700" : "text-neutral-300"
                            )}>
                                {t('dashboard.product_summary')}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <StatCard
                                    title={t('dashboard.total_product_count')}
                                    value={statsData.productSummary.totalProductCount}
                                    icon={Package}
                                    color="blue"
                                />
                                <StatCard
                                    title={t('dashboard.total_product_cost_value')}
                                    value={`${statsData.productSummary.totalProductCostValue.toLocaleString()} AZN`}
                                    icon={DollarSign}
                                    color="orange"
                                />
                                <StatCard
                                    title={t('dashboard.total_product_sale_value')}
                                    value={`${statsData.productSummary.totalProductSaleValue.toLocaleString()} AZN`}
                                    icon={DollarSign}
                                    color="emerald"
                                />
                                <StatCard
                                    title={t('dashboard.total_inventory_cost_value')}
                                    value={`${statsData.productSummary.totalInventoryCostValue.toLocaleString()} AZN`}
                                    icon={Package}
                                    color="violet"
                                />
                                <StatCard
                                    title={t('dashboard.total_inventory_sale_value')}
                                    value={`${statsData.productSummary.totalInventorySaleValue.toLocaleString()} AZN`}
                                    icon={Package}
                                    color="green"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
                        {t('dashboard.statistics_load_error')}
                    </div>
                )}
            </div>

            {/* Promotional Brands */}
            <PromotionalBrands />

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Chart Section */}
                    <DashboardChart />

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className={cn(
                              "text-lg font-bold",
                              theme === "light" ? "text-neutral-900" : "text-white"
                            )}>{t('dashboard.recent_orders')}</h2>
                            <button className={cn(
                              "text-sm font-medium",
                              theme === "light"
                                ? "text-primary-600 hover:text-primary-700"
                                : "text-primary-400 hover:text-primary-300"
                            )}>{t('dashboard.view_all')}</button>
                        </div>

                        <div className={cn(
                          "rounded-xl border shadow-sm overflow-hidden",
                          theme === "light"
                            ? "bg-white border-neutral-200"
                            : "bg-neutral-800 border-neutral-700"
                        )}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className={cn(
                                      "font-semibold text-xs uppercase tracking-wide border-b",
                                      theme === "light"
                                        ? "bg-neutral-50 text-neutral-500 border-neutral-200"
                                        : "bg-neutral-900 text-neutral-400 border-neutral-700"
                                    )}>
                                        <tr>
                                            <th className="px-6 py-4">{t('table.order_id')}</th>
                                            <th className="px-6 py-4">{t('table.customer')}</th>
                                            <th className="px-6 py-4">{t('table.status')}</th>
                                            <th className="px-6 py-4">{t('table.amount')}</th>
                                            <th className="px-6 py-4">{t('table.date')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className={cn(
                                      "divide-y",
                                      theme === "light"
                                        ? "divide-neutral-100"
                                        : "divide-neutral-700"
                                    )}>
                                        {recentOrders.map((order) => (
                                            <tr
                                              key={order.id}
                                              className={cn(
                                                "transition-colors",
                                                theme === "light"
                                                  ? "hover:bg-neutral-50/50"
                                                  : "hover:bg-neutral-800/50"
                                              )}
                                            >
                                                <td className={cn(
                                                  "px-6 py-4 font-mono text-xs",
                                                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                                                )}>
                                                    #{order.id.slice(0, 8)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                                                          theme === "light" ? "bg-primary-50 text-primary-600" : "bg-primary-500/10 text-primary-400"
                                                        )}>
                                                            {order.customerName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className={cn(
                                                              "font-medium truncate",
                                                              theme === "light" ? "text-neutral-900" : "text-white"
                                                            )}>{order.customerName}</div>
                                                            <div className={cn(
                                                              "text-xs truncate",
                                                              theme === "light" ? "text-neutral-500" : "text-neutral-400"
                                                            )}>{order.customerEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className={cn(
                                                  "px-6 py-4 font-medium",
                                                  theme === "light" ? "text-neutral-900" : "text-white"
                                                )}>
                                                    {order.total} {order.currency}
                                                </td>
                                                <td className={cn(
                                                  "px-6 py-4",
                                                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                                                )}>
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Products */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className={cn(
                          "text-lg font-bold",
                          theme === "light" ? "text-neutral-900" : "text-white"
                        )}>{t('dashboard.new_products')}</h2>
                        <button className={cn(
                          "text-sm font-medium",
                          theme === "light"
                            ? "text-primary-600 hover:text-primary-700"
                            : "text-primary-400 hover:text-primary-300"
                        )}>{t('dashboard.view_all')}</button>
                    </div>

                    <div className={cn(
                      "rounded-xl border shadow-sm overflow-hidden divide-y",
                      theme === "light"
                        ? "bg-white border-neutral-200 divide-neutral-100"
                        : "bg-neutral-800 border-neutral-700 divide-neutral-700"
                    )}>
                        {recentProducts.map((product) => {
                            const productImageUrl = resolveImageUrl(product.imageUrl);
                            return (
                            <div key={product.id} className={cn(
                              "flex items-center gap-4 p-4 group cursor-pointer transition-colors",
                              theme === "light" ? "hover:bg-neutral-50/70" : "hover:bg-neutral-900/40"
                            )}>
                                <div className={cn(
                                  "w-12 h-12 rounded-lg border flex items-center justify-center overflow-hidden shrink-0",
                                  theme === "light"
                                    ? "bg-neutral-50 border-neutral-100"
                                    : "bg-neutral-900 border-neutral-700"
                                )}>
                                    {productImageUrl ? (
                                        <img
                                            src={productImageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                    ) : (
                                        <Package size={20} className="text-neutral-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                      "text-sm font-medium truncate transition-colors",
                                      theme === "light"
                                        ? "text-neutral-900 group-hover:text-primary-600"
                                        : "text-white group-hover:text-primary-400"
                                    )}>
                                        {product.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                          "text-xs",
                                          theme === "light" ? "text-neutral-500" : "text-neutral-400"
                                        )}>{product.categoryName}</span>
                                        <span className={cn(
                                          "w-1 h-1 rounded-full",
                                          theme === "light" ? "bg-neutral-300" : "bg-neutral-600"
                                        )} />
                                        <span className={cn(
                                          "text-xs font-medium",
                                          theme === "light" ? "text-neutral-900" : "text-white"
                                        )}>
                                            {product.price} {product.currency}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
