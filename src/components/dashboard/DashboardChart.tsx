import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { dashboardApi } from "../../core/api/dashboard.api";
import { Calendar } from "lucide-react";

export const DashboardChart = () => {
    const { theme } = useTheme();
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

    const { data, isLoading } = useQuery({
        queryKey: ["dashboardChart", period],
        queryFn: () => dashboardApi.getDashboardChart(period),
    });

    const formatXAxis = (dateStr: string) => {
        const date = new Date(dateStr);
        if (period === "monthly") {
            return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        }
        return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("az-AZ", {
            style: "currency",
            currency: "AZN",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className={cn(
          "rounded-xl border shadow-sm p-6",
          theme === "light"
            ? "bg-white border-neutral-200"
            : "bg-neutral-800 border-neutral-700"
        )}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                        <Calendar size={20} />
                    </div>
                    <h2 className={cn(
                      "text-lg font-bold",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>Revenue Overview</h2>
                </div>

                <div className={cn(
                  "flex p-1 rounded-lg",
                  theme === "light" ? "bg-neutral-100" : "bg-neutral-900"
                )}>
                    {(["daily", "weekly", "monthly"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                              "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                              period === p
                                ? theme === "light"
                                  ? "bg-white text-neutral-900 shadow-sm"
                                  : "bg-neutral-700 text-white shadow-sm"
                                : theme === "light"
                                ? "text-neutral-500 hover:text-neutral-900"
                                : "text-neutral-400 hover:text-white"
                            )}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatXAxis}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                tickFormatter={(value) => `${value / 1000}k`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#4f46e5"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-neutral-400">
                        No data available for this period
                    </div>
                )}
            </div>
        </div>
    );
};
