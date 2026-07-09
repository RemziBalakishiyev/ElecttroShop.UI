import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    BarChart3,
    DollarSign,
    Wallet,
    TrendingUp,
    Receipt,
    Package,
    RefreshCw,
    FileSpreadsheet,
    FileText,
    LineChart,
    PieChart as PieIcon,
    Trophy,
    FolderTree,
    Scale,
    ClipboardList,
    AlertTriangle,
    type LucideIcon,
} from "lucide-react";
import { reportsApi } from "../core/api/reports.api";
import { salesApi } from "../core/api/sales.api";
import { Button, Select } from "../components/commons";
import { useTheme } from "../core/context/ThemeContext";
import { useToast } from "../core/providers/ToastContext";
import { cn } from "../utils/cn";
import {
    AZ_MONTHS,
    SAFE_MONTHS,
    downloadBlob,
    parseFilenameFromContentDisposition,
} from "../utils/downloadFile";
import {
    formatCurrency,
    formatPercent,
    formatQuantity,
    formatReportDate,
    getProfitColor,
} from "../utils/reportFormat";

/* -------------------------------------------------------------------------- */
/*  Kart rəng tonları                                                         */
/* -------------------------------------------------------------------------- */

const TINTS: Record<string, { light: string; dark: string }> = {
    blue: { light: "bg-blue-50 text-blue-600", dark: "bg-blue-500/10 text-blue-400" },
    rose: { light: "bg-rose-50 text-rose-600", dark: "bg-rose-500/10 text-rose-400" },
    green: { light: "bg-green-50 text-green-600", dark: "bg-green-500/10 text-green-400" },
    emerald: { light: "bg-emerald-50 text-emerald-600", dark: "bg-emerald-500/10 text-emerald-400" },
    violet: { light: "bg-violet-50 text-violet-600", dark: "bg-violet-500/10 text-violet-400" },
    orange: { light: "bg-orange-50 text-orange-600", dark: "bg-orange-500/10 text-orange-400" },
};

const PIE_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

/* -------------------------------------------------------------------------- */
/*  Stat kartı                                                                */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    tint: keyof typeof TINTS;
    valueClass?: string;
    highlight?: boolean;
    isLoading?: boolean;
};

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    tint,
    valueClass,
    highlight,
    isLoading,
}: StatCardProps) => {
    const { theme } = useTheme();
    const tone = TINTS[tint] ?? TINTS.blue;
    return (
        <div
            className={cn(
                "rounded-xl p-5 border shadow-sm transition-all hover:shadow-md",
                theme === "light" ? "bg-white border-neutral-100" : "bg-neutral-800 border-neutral-700",
                highlight && "ring-2 ring-primary-400/60"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className={cn(
                            "text-xs font-medium truncate",
                            theme === "light" ? "text-neutral-500" : "text-neutral-400"
                        )}
                    >
                        {title}
                    </p>
                    {isLoading ? (
                        <div
                            className={cn(
                                "h-7 w-24 rounded mt-2 animate-pulse",
                                theme === "light" ? "bg-neutral-200" : "bg-neutral-700"
                            )}
                        />
                    ) : (
                        <h3
                            className={cn(
                                "text-xl font-bold mt-2 tracking-tight break-words",
                                valueClass ?? (theme === "light" ? "text-neutral-900" : "text-white")
                            )}
                        >
                            {value}
                        </h3>
                    )}
                    {subtitle && !isLoading && (
                        <p
                            className={cn(
                                "text-xs mt-1 truncate",
                                theme === "light" ? "text-neutral-400" : "text-neutral-500"
                            )}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        theme === "light" ? tone.light : tone.dark
                    )}
                >
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Bölmə kartı (başlıq + gövdə)                                              */
/* -------------------------------------------------------------------------- */

type SectionCardProps = {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
};

const SectionCard = ({ title, icon: Icon, children, className, action }: SectionCardProps) => {
    const { theme } = useTheme();
    return (
        <div
            className={cn(
                "rounded-xl border shadow-sm p-5",
                theme === "light" ? "bg-white border-neutral-200" : "bg-neutral-800 border-neutral-700",
                className
            )}
        >
            <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className={cn(
                            "p-2 rounded-lg shrink-0",
                            theme === "light" ? "bg-primary-50 text-primary-600" : "bg-primary-500/10 text-primary-400"
                        )}
                    >
                        <Icon size={18} />
                    </div>
                    <h2
                        className={cn(
                            "text-base font-bold truncate",
                            theme === "light" ? "text-neutral-900" : "text-white"
                        )}
                    >
                        {title}
                    </h2>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Səhifə                                                                     */
/* -------------------------------------------------------------------------- */

export const ReportsPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const toast = useToast();

    // Tema-uyğun sönük mətn rəngi (Tailwind `dark:` variantı bu layihədə
    // OS seçiminə bağlıdır, ona görə `useTheme()` şərtindən istifadə edirik).
    const muted = theme === "light" ? "text-neutral-500" : "text-neutral-400";

    const now = useMemo(() => new Date(), []);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Pending (istifadəçi seçir) vs Applied (query açarında) vəziyyət
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [appliedMonth, setAppliedMonth] = useState(currentMonth);
    const [appliedYear, setAppliedYear] = useState(currentYear);

    const [exportingType, setExportingType] = useState<null | "excel" | "pdf">(null);

    const monthOptions = AZ_MONTHS.map((label, i) => ({ label, value: String(i + 1) }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => {
        const y = currentYear - i;
        return { label: String(y), value: String(y) };
    });

    const { data, isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: ["monthly-report", appliedYear, appliedMonth],
        queryFn: () => reportsApi.getMonthlySalesReport(appliedYear, appliedMonth),
        placeholderData: keepPreviousData,
    });

    const report = data ?? null;
    const summary = report?.summary;

    useEffect(() => {
        if (isError) {
            toast.error(t("reports.load_error"));
        }
    }, [isError, toast, t]);

    const applyFilter = () => {
        setAppliedMonth(selectedMonth);
        setAppliedYear(selectedYear);
    };

    const handleExport = async (type: "excel" | "pdf") => {
        if (exportingType) return;
        setExportingType(type);
        try {
            const res =
                type === "excel"
                    ? await salesApi.exportSalesExcel(appliedYear, appliedMonth)
                    : await salesApi.exportSalesPdf(appliedYear, appliedMonth);
            const ext = type === "excel" ? "xlsx" : "pdf";
            const fallback = `${SAFE_MONTHS[appliedMonth - 1]}_AYI_SATIS_${appliedYear}.${ext}`;
            const fromHeader = parseFilenameFromContentDisposition(
                res.headers["content-disposition"] as string | undefined
            );
            downloadBlob(res.data, fromHeader || fallback);
        } catch {
            toast.error(t("reports.export_error"));
        } finally {
            setExportingType(null);
        }
    };

    const monthLabel = AZ_MONTHS[appliedMonth - 1];
    const periodLabel = `${monthLabel} ${appliedYear}`;

    // Günlük qrafik datası
    const dailyChartData = useMemo(() => {
        return (report?.dailySales ?? []).map((d) => ({
            label: d.dayLabel ?? String(new Date(d.date).getDate()),
            [t("reports.chart_total")]: d.totalSalesAmount,
            [t("reports.chart_net")]: d.netProfit,
        }));
    }, [report, t]);

    // Satış növü datası
    const saleTypeData = useMemo(() => {
        return (report?.saleTypeBreakdown ?? []).map((s) => ({
            name: translateSaleType(s.saleType, t),
            value: s.totalSalesAmount,
            count: s.salesCount,
        }));
    }, [report, t]);

    const categorySales = useMemo(() => {
        return [...(report?.categorySales ?? [])].sort(
            (a, b) => b.totalSalesAmount - a.totalSalesAmount
        );
    }, [report]);
    const maxCategoryAmount = categorySales.reduce(
        (max, c) => Math.max(max, c.totalSalesAmount),
        0
    );

    const topProducts = (report?.topProducts ?? []).slice(0, 10);
    const profitLoss = report?.profitLossProducts ?? [];
    const recentSales = (report?.recentSales ?? []).slice(0, 20);

    const showInitialSkeleton = isLoading && !report;

    const emptyText = (
        <div
            className={cn(
                "py-10 text-center text-sm",
                theme === "light" ? "text-neutral-400" : "text-neutral-500"
            )}
        >
            {t("reports.empty_table")}
        </div>
    );

    /* --------------------------- Tam səhifə xəta --------------------------- */
    if (isError && !report) {
        return (
            <div className="p-4 sm:p-6">
                <PageHeader
                    theme={theme}
                    t={t}
                    exportingType={exportingType}
                    onExport={handleExport}
                    hasData={false}
                />
                <div
                    className={cn(
                        "mt-8 rounded-xl border p-10 flex flex-col items-center text-center gap-4",
                        theme === "light" ? "bg-white border-neutral-200" : "bg-neutral-800 border-neutral-700"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-full",
                        theme === "light" ? "bg-rose-50 text-rose-500" : "bg-rose-500/10 text-rose-400"
                    )}>
                        <AlertTriangle size={28} />
                    </div>
                    <p className={cn("font-medium", theme === "light" ? "text-neutral-800" : "text-neutral-200")}>
                        {t("reports.load_error")}
                    </p>
                    <Button variant="primary" icon={<RefreshCw size={16} />} onClick={() => refetch()}>
                        {t("reports.retry")}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                theme={theme}
                t={t}
                exportingType={exportingType}
                onExport={handleExport}
                hasData={!!report}
            />

            {/* ------------------------- Filter paneli ------------------------- */}
            <div
                className={cn(
                    "rounded-xl border shadow-sm p-4 sm:p-5",
                    theme === "light" ? "bg-white border-neutral-200" : "bg-neutral-800 border-neutral-700"
                )}
            >
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <Select
                        label={t("reports.month")}
                        options={monthOptions}
                        value={String(selectedMonth)}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        wrapperClassName="sm:w-44"
                    />
                    <Select
                        label={t("reports.year")}
                        options={yearOptions}
                        value={String(selectedYear)}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        wrapperClassName="sm:w-32"
                    />
                    <div className="flex items-center gap-2 sm:pb-0.5">
                        <Button
                            variant="primary"
                            icon={<BarChart3 size={16} />}
                            onClick={applyFilter}
                            loading={isFetching}
                            className="flex-1 sm:flex-none"
                        >
                            {t("reports.show_report")}
                        </Button>
                        <Button
                            variant="outline"
                            icon={<RefreshCw size={16} className={cn(isFetching && "animate-spin")} />}
                            onClick={() => refetch()}
                            aria-label={t("reports.refresh")}
                            title={t("reports.refresh")}
                        />
                    </div>
                </div>
            </div>

            {/* -------------------------- Summary kartlar -------------------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    title={t("reports.card_total_sales")}
                    value={formatCurrency(summary?.totalSalesAmount ?? 0)}
                    subtitle={periodLabel}
                    icon={DollarSign}
                    tint="blue"
                    isLoading={showInitialSkeleton}
                />
                <StatCard
                    title={t("reports.card_expenses")}
                    value={formatCurrency(summary?.totalExpenses ?? 0)}
                    subtitle={periodLabel}
                    icon={Wallet}
                    tint="rose"
                    valueClass={theme === "light" ? "text-rose-600" : "text-rose-400"}
                    isLoading={showInitialSkeleton}
                />
                <StatCard
                    title={t("reports.card_gross_profit")}
                    value={formatCurrency(summary?.grossProfit ?? 0)}
                    subtitle={periodLabel}
                    icon={TrendingUp}
                    tint="emerald"
                    valueClass={getProfitColor(summary?.grossProfit ?? 0)}
                    isLoading={showInitialSkeleton}
                />
                <StatCard
                    title={t("reports.card_net_profit")}
                    value={formatCurrency(summary?.netProfit ?? 0)}
                    subtitle={t("reports.card_net_profit_hint")}
                    icon={Scale}
                    tint="green"
                    valueClass={getProfitColor(summary?.netProfit ?? 0)}
                    highlight
                    isLoading={showInitialSkeleton}
                />
                <StatCard
                    title={t("reports.card_sales_count")}
                    value={String(summary?.salesCount ?? 0)}
                    subtitle={periodLabel}
                    icon={Receipt}
                    tint="violet"
                    isLoading={showInitialSkeleton}
                />
                <StatCard
                    title={t("reports.card_quantity")}
                    value={formatQuantity(summary?.totalQuantity ?? 0)}
                    subtitle={periodLabel}
                    icon={Package}
                    tint="orange"
                    isLoading={showInitialSkeleton}
                />
            </div>

            {/* -------------------------- Mini metriklər -------------------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniMetric
                    theme={theme}
                    label={t("reports.mini_avg_sale")}
                    value={formatCurrency(summary?.averageSaleAmount ?? 0)}
                    isLoading={showInitialSkeleton}
                />
                <MiniMetric
                    theme={theme}
                    label={t("reports.mini_margin")}
                    value={formatPercent(summary?.profitMarginPercent ?? 0)}
                    valueClass={getProfitColor(summary?.profitMarginPercent ?? 0)}
                    isLoading={showInitialSkeleton}
                />
            </div>

            {/* --------------------- Chart bölməsi (2 sütun) --------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SectionCard
                    title={t("reports.daily_chart_title")}
                    icon={LineChart}
                    className="lg:col-span-2"
                >
                    <div className="h-[320px] w-full">
                        {showInitialSkeleton ? (
                            <ChartSkeleton theme={theme} />
                        ) : dailyChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="repTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="repNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke={theme === "light" ? "#f3f4f6" : "#334155"}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: theme === "light" ? "#6b7280" : "#94a3b8", fontSize: 12 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                                        axisLine={false}
                                        tickLine={false}
                                        width={48}
                                        tick={{ fill: theme === "light" ? "#6b7280" : "#94a3b8", fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme === "light" ? "#fff" : "#1e293b",
                                            borderRadius: "8px",
                                            border: theme === "light" ? "1px solid #e5e7eb" : "1px solid #334155",
                                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                            color: theme === "light" ? "#0f172a" : "#f1f5f9",
                                        }}
                                        labelStyle={{ color: theme === "light" ? "#0f172a" : "#f1f5f9" }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Area
                                        type="monotone"
                                        dataKey={t("reports.chart_total")}
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#repTotal)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={t("reports.chart_net")}
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#repNet)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-neutral-400 text-sm text-center px-4">
                                {t("reports.empty_chart")}
                            </div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard title={t("reports.sale_type_title")} icon={PieIcon}>
                    <div className="h-[320px] w-full">
                        {showInitialSkeleton ? (
                            <ChartSkeleton theme={theme} />
                        ) : saleTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={saleTypeData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={95}
                                        paddingAngle={2}
                                    >
                                        {saleTypeData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme === "light" ? "#fff" : "#1e293b",
                                            borderRadius: "8px",
                                            border: theme === "light" ? "1px solid #e5e7eb" : "1px solid #334155",
                                            color: theme === "light" ? "#0f172a" : "#f1f5f9",
                                        }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-neutral-400 text-sm text-center px-4">
                                {t("reports.empty_chart")}
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* ------------------------ Top məhsullar ------------------------ */}
            <SectionCard title={t("reports.top_products_title")} icon={Trophy}>
                {showInitialSkeleton ? (
                    <TableSkeleton theme={theme} rows={5} cols={6} />
                ) : topProducts.length === 0 ? (
                    emptyText
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <TableHead
                                theme={theme}
                                cols={[
                                    t("reports.col_product"),
                                    "SKU",
                                    t("reports.col_category"),
                                    t("reports.col_quantity"),
                                    t("reports.col_sales_amount"),
                                    t("reports.col_profit"),
                                ]}
                                right={[3, 4, 5]}
                            />
                            <tbody>
                                {topProducts.map((p, i) => (
                                    <tr key={i} className={rowClass(theme)}>
                                        <td className="px-4 py-3 font-medium">{p.productName ?? "—"}</td>
                                        <td className={cn("px-4 py-3", muted)}>{p.sku ?? "—"}</td>
                                        <td className={cn("px-4 py-3", muted)}>{p.categoryName ?? "—"}</td>
                                        <td className="px-4 py-3 text-right">{formatQuantity(p.quantity)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.totalSalesAmount)}</td>
                                        <td className={cn("px-4 py-3 text-right font-semibold", getProfitColor(p.totalProfit))}>
                                            {formatCurrency(p.totalProfit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* --------------------- Kateqoriya üzrə satışlar --------------------- */}
            <SectionCard title={t("reports.category_title")} icon={FolderTree}>
                {showInitialSkeleton ? (
                    <TableSkeleton theme={theme} rows={4} cols={5} />
                ) : categorySales.length === 0 ? (
                    emptyText
                ) : (
                    <div className="space-y-4">
                        {categorySales.map((c, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                                    <span className={cn("font-medium truncate", theme === "light" ? "text-neutral-800" : "text-neutral-200")}>
                                        {c.categoryName ?? "—"}
                                    </span>
                                    <div className="flex items-center gap-4 shrink-0 text-xs sm:text-sm">
                                        <span className={cn(muted, "hidden sm:inline")}>
                                            {t("reports.col_sales_count")}: {c.salesCount}
                                        </span>
                                        <span className={cn(muted, "hidden sm:inline")}>
                                            {t("reports.col_quantity")}: {formatQuantity(c.quantity)}
                                        </span>
                                        <span className="font-semibold">{formatCurrency(c.totalSalesAmount)}</span>
                                        <span className={cn("font-medium w-20 text-right", getProfitColor(c.totalProfit))}>
                                            {formatCurrency(c.totalProfit)}
                                        </span>
                                    </div>
                                </div>
                                <div className={cn("h-2 rounded-full overflow-hidden", theme === "light" ? "bg-neutral-100" : "bg-neutral-700")}>
                                    <div
                                        className="h-full rounded-full bg-primary-400"
                                        style={{
                                            width: `${maxCategoryAmount > 0 ? (c.totalSalesAmount / maxCategoryAmount) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* --------------------- Mənfəət / zərər analizi --------------------- */}
            <SectionCard title={t("reports.profit_loss_title")} icon={Scale}>
                {showInitialSkeleton ? (
                    <TableSkeleton theme={theme} rows={5} cols={7} />
                ) : profitLoss.length === 0 ? (
                    emptyText
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-sm">
                            <TableHead
                                theme={theme}
                                cols={[
                                    t("reports.col_product"),
                                    "SKU",
                                    t("reports.col_sales_amount"),
                                    t("reports.col_cost"),
                                    t("reports.col_expenses"),
                                    t("reports.col_net_profit"),
                                    t("reports.col_margin"),
                                ]}
                                right={[2, 3, 4, 5, 6]}
                            />
                            <tbody>
                                {profitLoss.map((p, i) => (
                                    <tr
                                        key={i}
                                        className={cn(
                                            "border-b last:border-0",
                                            theme === "light" ? "border-neutral-100" : "border-neutral-700/60",
                                            p.netProfit < 0
                                                ? theme === "light"
                                                    ? "bg-rose-50/60"
                                                    : "bg-rose-500/5"
                                                : theme === "light"
                                                ? "bg-green-50/50"
                                                : "bg-green-500/5"
                                        )}
                                    >
                                        <td className="px-4 py-3 font-medium">{p.productName ?? "—"}</td>
                                        <td className={cn("px-4 py-3", muted)}>{p.sku ?? "—"}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(p.totalSalesAmount)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(p.totalCostAmount)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(p.totalExpenses)}</td>
                                        <td className={cn("px-4 py-3 text-right font-semibold", getProfitColor(p.netProfit))}>
                                            {formatCurrency(p.netProfit)}
                                        </td>
                                        <td className={cn("px-4 py-3 text-right font-medium", getProfitColor(p.profitMarginPercent))}>
                                            {formatPercent(p.profitMarginPercent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* -------------------------- Son satışlar -------------------------- */}
            <SectionCard title={t("reports.recent_sales_title")} icon={ClipboardList}>
                {showInitialSkeleton ? (
                    <TableSkeleton theme={theme} rows={6} cols={8} />
                ) : recentSales.length === 0 ? (
                    emptyText
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1080px] text-sm">
                            <TableHead
                                theme={theme}
                                cols={[
                                    t("reports.col_product"),
                                    "SKU",
                                    t("reports.col_category"),
                                    t("reports.col_sale_type"),
                                    t("reports.col_sale_price"),
                                    t("reports.col_quantity"),
                                    t("reports.col_sales_amount"),
                                    t("reports.col_expenses"),
                                    t("reports.col_net_profit"),
                                    t("reports.col_date"),
                                ]}
                                right={[4, 5, 6, 7, 8]}
                            />
                            <tbody>
                                {recentSales.map((s, i) => (
                                    <tr key={i} className={rowClass(theme)}>
                                        <td className="px-4 py-3 font-medium">{s.productName ?? "—"}</td>
                                        <td className={cn("px-4 py-3", muted)}>{s.sku ?? "—"}</td>
                                        <td className={cn("px-4 py-3", muted)}>{s.categoryName ?? "—"}</td>
                                        <td className="px-4 py-3">{translateSaleType(s.saleType, t)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(s.salePrice)}</td>
                                        <td className="px-4 py-3 text-right">{formatQuantity(s.quantity)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.totalSalesAmount)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(s.totalExpenses)}</td>
                                        <td className={cn("px-4 py-3 text-right font-semibold", getProfitColor(s.netProfit))}>
                                            {formatCurrency(s.netProfit)}
                                        </td>
                                        <td className={cn("px-4 py-3 whitespace-nowrap", muted)}>
                                            {formatReportDate(s.saleDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Köməkçi komponentlər / funksiyalar                                        */
/* -------------------------------------------------------------------------- */

type TFn = ReturnType<typeof useTranslation>["t"];

function translateSaleType(saleType: string | null, t: TFn): string {
    if (!saleType) return "—";
    if (saleType === "ExistingProduct") return t("reports.source_existing");
    if (saleType === "ManualEntry") return t("reports.source_manual");
    return saleType;
}

const rowClass = (theme: string) =>
    cn("border-b last:border-0", theme === "light" ? "border-neutral-100" : "border-neutral-700/60");

const TableHead = ({
    theme,
    cols,
    right = [],
}: {
    theme: string;
    cols: string[];
    right?: number[];
}) => (
    <thead>
        <tr
            className={cn(
                "text-xs uppercase tracking-wide",
                theme === "light" ? "text-neutral-500 border-b border-neutral-200" : "text-neutral-400 border-b border-neutral-700"
            )}
        >
            {cols.map((c, i) => (
                <th key={i} className={cn("px-4 py-2.5 font-semibold whitespace-nowrap", right.includes(i) ? "text-right" : "text-left")}>
                    {c}
                </th>
            ))}
        </tr>
    </thead>
);

const PageHeader = ({
    theme,
    t,
    exportingType,
    onExport,
    hasData,
}: {
    theme: string;
    t: TFn;
    exportingType: null | "excel" | "pdf";
    onExport: (type: "excel" | "pdf") => void;
    hasData: boolean;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                <BarChart3 size={22} className="text-white" />
            </div>
            <div>
                <h1 className={cn("text-xl sm:text-2xl font-bold", theme === "light" ? "text-neutral-900" : "text-white")}>
                    {t("reports.title")}
                </h1>
                <p className={cn("text-sm", theme === "light" ? "text-neutral-500" : "text-neutral-400")}>
                    {t("reports.subtitle")}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                icon={<FileSpreadsheet size={16} />}
                onClick={() => onExport("excel")}
                loading={exportingType === "excel"}
                disabled={exportingType !== null || !hasData}
                className="flex-1 sm:flex-none"
            >
                {t("reports.export_excel")}
            </Button>
            <Button
                variant="outline"
                icon={<FileText size={16} />}
                onClick={() => onExport("pdf")}
                loading={exportingType === "pdf"}
                disabled={exportingType !== null || !hasData}
                className="flex-1 sm:flex-none"
            >
                {t("reports.export_pdf")}
            </Button>
        </div>
    </div>
);

const MiniMetric = ({
    theme,
    label,
    value,
    valueClass,
    isLoading,
}: {
    theme: string;
    label: string;
    value: string;
    valueClass?: string;
    isLoading?: boolean;
}) => (
    <div
        className={cn(
            "rounded-xl border shadow-sm px-5 py-4 flex items-center justify-between gap-3",
            theme === "light" ? "bg-white border-neutral-100" : "bg-neutral-800 border-neutral-700"
        )}
    >
        <span className={cn("text-sm font-medium", theme === "light" ? "text-neutral-500" : "text-neutral-400")}>
            {label}
        </span>
        {isLoading ? (
            <div className={cn("h-6 w-20 rounded animate-pulse", theme === "light" ? "bg-neutral-200" : "bg-neutral-700")} />
        ) : (
            <span className={cn("text-lg font-bold", valueClass ?? (theme === "light" ? "text-neutral-900" : "text-white"))}>
                {value}
            </span>
        )}
    </div>
);

const ChartSkeleton = ({ theme }: { theme: string }) => (
    <div className={cn("h-full w-full rounded-lg animate-pulse", theme === "light" ? "bg-neutral-100" : "bg-neutral-700/50")} />
);

const TableSkeleton = ({ theme, rows, cols }: { theme: string; rows: number; cols: number }) => (
    <div className="space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-3">
                {Array.from({ length: cols }).map((_, c) => (
                    <div
                        key={c}
                        className={cn(
                            "h-8 flex-1 rounded animate-pulse",
                            theme === "light" ? "bg-neutral-100" : "bg-neutral-700/50"
                        )}
                    />
                ))}
            </div>
        ))}
    </div>
);
