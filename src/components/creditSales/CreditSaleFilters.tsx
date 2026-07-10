import { Search, Plus, RefreshCw, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../commons/Button";
import { Select } from "../commons/Select";
import { DateInput } from "../commons/DateInput";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import type { CreditSaleStatus, ProductSourceType } from "../../core/api/creditSales.api";
import type { CreditSaleFilterState } from "./creditSaleHelpers";

interface Props {
    filters: CreditSaleFilterState;
    onChange: (patch: Partial<CreditSaleFilterState>) => void;
    onClear: () => void;
    onRefresh: () => void;
    onAddNew: () => void;
    isRefreshing?: boolean;
}

export const CreditSaleFilters = ({
    filters,
    onChange,
    onClear,
    onRefresh,
    onAddNew,
    isRefreshing,
}: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const statusOptions = [
        { label: t("creditSales.status_pending"), value: "Pending" },
        { label: t("creditSales.status_overdue"), value: "Overdue" },
        { label: t("creditSales.status_sold"), value: "Sold" },
        { label: t("creditSales.status_cancelled"), value: "Cancelled" },
    ];

    const sourceOptions = [
        { label: t("creditSales.source_manual"), value: "ManualEntry" },
        { label: t("creditSales.source_existing"), value: "ExistingProduct" },
    ];

    const advancedCount = [
        filters.creditDateFrom,
        filters.creditDateTo,
        filters.dueDateFrom,
        filters.dueDateTo,
    ].filter(Boolean).length;

    const hasAnyFilter =
        filters.search ||
        filters.status ||
        filters.productSource ||
        advancedCount > 0;

    return (
        <div
            className={cn(
                "p-4 rounded-xl border shadow-sm space-y-4",
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
                {/* Search */}
                <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
                    <Search
                        size={18}
                        className={cn("absolute top-2.5 left-3", isDark ? "text-neutral-500" : "text-neutral-400")}
                    />
                    <input
                        type="text"
                        placeholder={t("creditSales.search_placeholder")}
                        value={filters.search}
                        onChange={(e) => onChange({ search: e.target.value })}
                        className={cn(
                            "w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-primary-400 focus:border-primary-400",
                            isDark
                                ? "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                                : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        )}
                    />
                </div>

                {/* Status */}
                <div className="w-full sm:w-44">
                    <Select
                        options={statusOptions}
                        value={filters.status}
                        onChange={(e) => onChange({ status: e.target.value as CreditSaleStatus | "" })}
                        placeholder={t("creditSales.filter_all_statuses")}
                    />
                </div>

                {/* Product source */}
                <div className="w-full sm:w-44">
                    <Select
                        options={sourceOptions}
                        value={filters.productSource}
                        onChange={(e) => onChange({ productSource: e.target.value as ProductSourceType | "" })}
                        placeholder={t("creditSales.filter_all_sources")}
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="secondary"
                        icon={<RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />}
                        onClick={onRefresh}
                        className="flex-1 sm:flex-none"
                        title={t("creditSales.refresh")}
                    >
                        <span className="sm:hidden">{t("creditSales.refresh")}</span>
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Plus size={18} />}
                        onClick={onAddNew}
                        className="flex-1 sm:flex-none shrink-0"
                    >
                        {t("creditSales.add")}
                    </Button>
                </div>
            </div>

            {/* Advanced filters toggle */}
            <div className={cn("pt-4 border-t", isDark ? "border-neutral-700" : "border-neutral-100")}>
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => setAdvancedOpen((o) => !o)}
                        className={cn(
                            "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                            isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
                        )}
                    >
                        <SlidersHorizontal size={14} />
                        {t("creditSales.advanced_filters")}
                        {advancedCount > 0 && (
                            <span
                                className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold normal-case tracking-normal",
                                    isDark ? "bg-primary-500/20 text-primary-300" : "bg-primary-100 text-primary-700"
                                )}
                            >
                                {advancedCount}
                            </span>
                        )}
                        <ChevronDown size={14} className={cn("transition-transform", advancedOpen && "rotate-180")} />
                    </button>

                    {hasAnyFilter && (
                        <button
                            type="button"
                            onClick={onClear}
                            className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline",
                                isDark ? "text-primary-400" : "text-primary-600"
                            )}
                        >
                            <X size={12} />
                            {t("creditSales.clear_filters")}
                        </button>
                    )}
                </div>

                {advancedOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                        <DateInput
                            label={t("creditSales.credit_date_from")}
                            value={filters.creditDateFrom}
                            onChange={(v) => onChange({ creditDateFrom: v })}
                        />
                        <DateInput
                            label={t("creditSales.credit_date_to")}
                            value={filters.creditDateTo}
                            onChange={(v) => onChange({ creditDateTo: v })}
                        />
                        <DateInput
                            label={t("creditSales.due_date_from")}
                            value={filters.dueDateFrom}
                            onChange={(v) => onChange({ dueDateFrom: v })}
                        />
                        <DateInput
                            label={t("creditSales.due_date_to")}
                            value={filters.dueDateTo}
                            onChange={(v) => onChange({ dueDateTo: v })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
