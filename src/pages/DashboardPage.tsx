import { useQuery } from "@tanstack/react-query";
import {
    Users, ShoppingBag, Package,
    ArrowUpRight, ArrowDownRight, DollarSign
} from "lucide-react";
import { dashboardApi } from "../core/api/dashboard.api";
import { API_CONFIG } from "../core/config/api.config";
import { DashboardChart } from "../components/dashboard/DashboardChart";
import { PromotionalBrands } from "../components/dashboard/PromotionalBrands";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

const StatCard = ({ title, value, subValue, icon: Icon, trend, color }: any) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    return (
        <div className={cn(
          "rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow",
          theme === "light"
            ? "bg-white border-neutral-100"
            : "bg-neutral-800 border-neutral-700"
        )}>
            <div className="flex items-start justify-between">
                <div>
                    <p className={cn(
                      "text-sm font-medium",
                      theme === "light" ? "text-neutral-500" : "text-neutral-400"
                    )}>{title}</p>
                    <h3 className={cn(
                      "text-2xl font-bold mt-2",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
            {subValue && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className={`flex items-center gap-1 font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {subValue}
                    </span>
                    <span className="text-neutral-400">{t('dashboard.vs_last_month')}</span>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    const styles: Record<string, string> = {
        Paid: "bg-green-50 text-green-700 border-green-100",
        Processing: "bg-blue-50 text-blue-700 border-blue-100",
        Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
        Delivered: "bg-purple-50 text-purple-700 border-purple-100",
        Cancelled: "bg-red-50 text-red-700 border-red-100",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-neutral-50 text-neutral-600"}`}>
            {t(`status.${status}`, { defaultValue: status })}
        </span>
    );
};

export const DashboardPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["dashboard"],
        queryFn: dashboardApi.getDashboardData,
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
            <div>
                <h1 className={cn(
                  "text-2xl font-bold",
                  theme === "light" ? "text-neutral-900" : "text-white"
                )}>{t('dashboard.title')}</h1>
                <p className={cn(
                  "mt-1",
                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                )}>{t('dashboard.subtitle')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.total_revenue')}
                    value={`${statistics.totalRevenue.toLocaleString()} ${statistics.revenueCurrency}`}
                    subValue={`+${statistics.revenueThisMonth.toLocaleString()}`}
                    trend="up"
                    icon={DollarSign}
                    color="bg-emerald-500"
                />
                <StatCard
                    title={t('dashboard.total_orders')}
                    value={statistics.totalOrders}
                    subValue={`+${statistics.ordersThisMonth}`}
                    trend="up"
                    icon={ShoppingBag}
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('dashboard.active_products')}
                    value={statistics.activeProducts}
                    subValue={`${statistics.totalProducts} ${t('dashboard.total')}`}
                    trend="up"
                    icon={Package}
                    color="bg-violet-500"
                />
                <StatCard
                    title={t('dashboard.total_customers')}
                    value={statistics.totalCustomers}
                    trend="up"
                    icon={Users}
                    color="bg-orange-500"
                />
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
                                      "font-medium border-b",
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
                                                    <div className={cn(
                                                      "font-medium",
                                                      theme === "light" ? "text-neutral-900" : "text-white"
                                                    )}>{order.customerName}</div>
                                                    <div className={cn(
                                                      "text-xs",
                                                      theme === "light" ? "text-neutral-500" : "text-neutral-400"
                                                    )}>{order.customerEmail}</div>
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
                      "rounded-xl border shadow-sm p-6 space-y-6",
                      theme === "light"
                        ? "bg-white border-neutral-200"
                        : "bg-neutral-800 border-neutral-700"
                    )}>
                        {recentProducts.map((product) => (
                            <div key={product.id} className="flex items-center gap-4 group cursor-pointer">
                                <div className={cn(
                                  "w-12 h-12 rounded-lg border flex items-center justify-center overflow-hidden",
                                  theme === "light"
                                    ? "bg-neutral-50 border-neutral-100"
                                    : "bg-neutral-900 border-neutral-700"
                                )}>
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl.startsWith("http") ? product.imageUrl : `${API_CONFIG.BASE_URL}${product.imageUrl}`}
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
