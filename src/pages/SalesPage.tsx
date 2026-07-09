import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Search, Plus, Trash2, Edit, X, ReceiptText, SlidersHorizontal,
    ChevronDown, ArrowUp, ArrowDown, ArrowUpDown, MessageSquareText,
    DollarSign, TrendingUp, TrendingDown, Wallet, Hash,
    FileSpreadsheet, FileText,
    type LucideIcon,
} from "lucide-react";
import { Button } from "../components/commons/Button";
import { Pagination } from "../components/commons/Pagination";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Input } from "../components/commons/Input";
import { Select } from "../components/commons/Select";
import { DateInput } from "../components/commons/DateInput";
import { Modal } from "../components/commons/Modal";
import { Textarea } from "../components/commons/Textarea";
import { salesApi } from "../core/api/sales.api";
import type {
    SaleListItemDto,
    SaleDetailDto,
    SaleSource,
    ExpenseType,
} from "../core/api/sales.api";
import { productsApi } from "../core/api/products.api";
import { categoriesApi } from "../core/api/categories.api";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";
import {
    AZ_MONTHS,
    SAFE_MONTHS,
    downloadBlob,
    parseFilenameFromContentDisposition,
} from "../utils/downloadFile";

type CreateMode = "existing" | "manual";

interface FormData {
    productId: string;
    productName: string;
    productCode: string;
    categoryId: string;
    categoryName: string;
    costPrice: string;
    salePrice: string;
    quantity: string;
    soldAt: string;
    note: string;
}

interface ExpenseRow {
    expenseType: ExpenseType | "";
    description: string;
    amount: string;
}

const EXPENSE_TYPES: ExpenseType[] = ["Installation", "Delivery", "Service", "Commission", "Other"];

const todayIso = () => new Date().toISOString().split("T")[0];

const emptyForm = (): FormData => ({
    productId: "",
    productName: "",
    productCode: "",
    categoryId: "",
    categoryName: "",
    costPrice: "",
    salePrice: "",
    quantity: "",
    soldAt: todayIso(),
    note: "",
});

const emptyExpenseRow = (): ExpenseRow => ({ expenseType: "", description: "", amount: "" });

const formatMoney = (value: number) =>
    value.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₼";

const SourceBadge = ({ source, isDark, label }: { source: SaleSource; isDark: boolean; label: string }) => (
    <span
        className={cn(
            "inline-flex px-2.5 py-1 rounded-full text-xs font-medium border",
            source === "ExistingProduct"
                ? isDark
                    ? "bg-primary-500/10 text-primary-400 border-primary-500/20"
                    : "bg-primary-50 text-primary-600 border-primary-100"
                : isDark
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-amber-50 text-amber-700 border-amber-100"
        )}
    >
        {label}
    </span>
);

const SourceIndicator = ({ source, isDark, label }: { source: SaleSource; isDark: boolean; label: string }) => (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
        <span className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            source === "ExistingProduct" ? "bg-primary-500" : "bg-amber-500"
        )} />
        <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>{label}</span>
    </span>
);

const ProfitBadge = ({ profit, formatted, isDark }: { profit: number; formatted: string; isDark: boolean }) => (
    <span
        className={cn(
            "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums whitespace-nowrap",
            profit > 0
                ? isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700"
                : profit < 0
                    ? isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700"
                    : isDark ? "bg-neutral-700/40 text-neutral-300" : "bg-neutral-100 text-neutral-600"
        )}
    >
        {formatted}
    </span>
);

const NoteIndicator = ({ note, isDark }: { note: string; isDark: boolean }) => (
    <span className="relative inline-flex group/note shrink-0">
        <MessageSquareText
            size={14}
            className={cn(
                "cursor-help transition-colors",
                isDark ? "text-neutral-500 hover:text-primary-400" : "text-neutral-400 hover:text-primary-600"
            )}
        />
        <span className={cn(
            "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-20 hidden group-hover/note:block",
            "w-56 rounded-lg border p-2 text-xs shadow-lg",
            isDark ? "bg-neutral-800 border-neutral-700 text-neutral-200" : "bg-white border-neutral-200 text-neutral-700"
        )}>
            {note}
        </span>
    </span>
);

const SUMMARY_TINTS: Record<string, { light: string; dark: string }> = {
    blue: { light: "bg-blue-50 text-blue-600", dark: "bg-blue-500/10 text-blue-400" },
    green: { light: "bg-green-50 text-green-600", dark: "bg-green-500/10 text-green-400" },
    red: { light: "bg-red-50 text-red-600", dark: "bg-red-500/10 text-red-400" },
    orange: { light: "bg-orange-50 text-orange-600", dark: "bg-orange-500/10 text-orange-400" },
    violet: { light: "bg-violet-50 text-violet-600", dark: "bg-violet-500/10 text-violet-400" },
};

const SummaryCard = ({
    title, value, icon: Icon, tint, isDark, isLoading,
}: {
    title: string;
    value: string | number;
    icon: LucideIcon;
    tint: keyof typeof SUMMARY_TINTS;
    isDark: boolean;
    isLoading: boolean;
}) => (
    <div className={cn(
        "rounded-xl border shadow-sm p-5",
        isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-100"
    )}>
        <div className="flex items-center justify-between">
            <p className={cn("text-sm font-medium", isDark ? "text-neutral-400" : "text-neutral-500")}>{title}</p>
            <div className={cn("p-2 rounded-lg", isDark ? SUMMARY_TINTS[tint].dark : SUMMARY_TINTS[tint].light)}>
                <Icon size={18} />
            </div>
        </div>
        {isLoading ? (
            <div className={cn("h-7 w-28 rounded mt-3 animate-pulse", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
        ) : (
            <h3 className={cn("text-2xl font-bold mt-3 tracking-tight tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
                {value}
            </h3>
        )}
    </div>
);

type SortableKey = "salePrice" | "quantity" | "cost" | "totalSaleAmount" | "totalExpenses" | "profit" | "soldAt";

const getSortValue = (item: SaleListItemDto, key: SortableKey): number => {
    switch (key) {
        case "salePrice": return item.salePrice;
        case "quantity": return item.quantity;
        case "cost": return item.totalCost;
        case "totalSaleAmount": return item.totalSaleAmount;
        case "totalExpenses": return item.totalExpenses ?? 0;
        case "profit": return item.profit;
        case "soldAt": return new Date(item.soldAt).getTime();
    }
};

export const SalesPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const toast = useToast();

    // Filters
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterCategoryId, setFilterCategoryId] = useState("");
    const [filterSaleSource, setFilterSaleSource] = useState<SaleSource | "">("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    const [filterMinProfit, setFilterMinProfit] = useState("");
    const [filterMaxProfit, setFilterMaxProfit] = useState("");
    const [filterMinExpense, setFilterMinExpense] = useState("");
    const [filterMaxExpense, setFilterMaxExpense] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [sortKey, setSortKey] = useState<SortableKey | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    // Monthly export state
    const [exportMonth, setExportMonth] = useState(() => new Date().getMonth() + 1); // 1-12, current month
    const [exportYear, setExportYear] = useState(() => new Date().getFullYear());
    const [exportingType, setExportingType] = useState<null | "excel" | "pdf">(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<SaleDetailDto | null>(null);
    const [createMode, setCreateMode] = useState<CreateMode>("existing");
    const [formData, setFormData] = useState<FormData>(emptyForm());
    const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

    // Delete state
    const [deleteItem, setDeleteItem] = useState<SaleListItemDto | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data queries
    const buildFilterParams = () => ({
        search: search || undefined,
        categoryId: filterCategoryId || undefined,
        saleSource: filterSaleSource || undefined,
        dateFrom: filterDateFrom ? new Date(filterDateFrom).toISOString() : undefined,
        dateTo: filterDateTo ? new Date(filterDateTo).toISOString() : undefined,
        minProfit: filterMinProfit ? Number(filterMinProfit) : undefined,
        maxProfit: filterMaxProfit ? Number(filterMaxProfit) : undefined,
        minExpense: filterMinExpense ? Number(filterMinExpense) : undefined,
        maxExpense: filterMaxExpense ? Number(filterMaxExpense) : undefined,
    });

    const filterDeps = [
        search, filterCategoryId, filterSaleSource,
        filterDateFrom, filterDateTo,
        filterMinProfit, filterMaxProfit,
        filterMinExpense, filterMaxExpense,
    ];

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["sales", page, pageSize, ...filterDeps],
        queryFn: () => salesApi.getSales({ page, pageSize, ...buildFilterParams() }),
    });

    const statsPageSize = Math.min(data?.totalCount ?? 0, 2000);

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["sales-stats", statsPageSize, ...filterDeps],
        queryFn: () => salesApi.getSales({ page: 1, pageSize: statsPageSize, ...buildFilterParams() }),
        enabled: statsPageSize > 0,
    });

    const summary = useMemo(() => {
        const rows = statsData?.value ?? [];
        return {
            totalSaleAmount: rows.reduce((sum, r) => sum + r.totalSaleAmount, 0),
            totalProfit: rows.reduce((sum, r) => sum + r.profit, 0),
            totalExpenses: rows.reduce((sum, r) => sum + (r.totalExpenses ?? 0), 0),
            count: data?.totalCount ?? rows.length,
        };
    }, [statsData, data?.totalCount]);

    const { data: categoryItems } = useQuery({
        queryKey: ["categories-lookup-all"],
        queryFn: async () => {
            const response = await categoriesApi.getLookup({ includeAll: true });
            const lookupData = (response as { value?: { items?: unknown[] } }).value || response;
            return (lookupData as { items?: { key: string; value: string }[] })?.items || [];
        },
        staleTime: 60 * 60 * 1000,
    });

    const activeMode: CreateMode = editingSale
        ? editingSale.saleSource === "ExistingProduct" ? "existing" : "manual"
        : createMode;

    const { data: products } = useQuery({
        queryKey: ["products", "all"],
        queryFn: () => productsApi.getProducts({ pageSize: 100 }),
        enabled: isModalOpen && activeMode === "existing" && !editingSale,
    });

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async () => {
            const validExpenses = expenses
                .filter(e => e.expenseType !== "" && e.amount !== "")
                .map(e => ({
                    expenseType: e.expenseType as ExpenseType,
                    description: e.description || null,
                    amount: Number(e.amount),
                }));

            if (editingSale) {
                const payload = {
                    productName: formData.productName || null,
                    productCode: formData.productCode || null,
                    categoryId: formData.categoryId || null,
                    categoryName: formData.categoryName || null,
                    costPrice: formData.costPrice ? Number(formData.costPrice) : null,
                    salePrice: Number(formData.salePrice),
                    quantity: Number(formData.quantity),
                    soldAt: formData.soldAt ? new Date(formData.soldAt).toISOString() : null,
                    note: formData.note || null,
                    expenses: validExpenses,
                };
                return salesApi.updateSale(editingSale.id, payload);
            } else {
                if (activeMode === "existing") {
                    return salesApi.createSale({
                        productId: formData.productId,
                        salePrice: Number(formData.salePrice),
                        quantity: Number(formData.quantity),
                        soldAt: formData.soldAt ? new Date(formData.soldAt).toISOString() : null,
                        note: formData.note || null,
                        expenses: validExpenses.length > 0 ? validExpenses : undefined,
                    });
                } else {
                    return salesApi.createSale({
                        productId: null,
                        productName: formData.productName,
                        productCode: formData.productCode || null,
                        categoryId: formData.categoryId || null,
                        categoryName: formData.categoryName || null,
                        costPrice: Number(formData.costPrice),
                        salePrice: Number(formData.salePrice),
                        quantity: Number(formData.quantity),
                        soldAt: formData.soldAt ? new Date(formData.soldAt).toISOString() : null,
                        note: formData.note || null,
                        expenses: validExpenses.length > 0 ? validExpenses : undefined,
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            closeModal();
            toast.success(editingSale ? t("sales.update_success") : t("sales.create_success"));
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(msg || (editingSale ? t("sales.update_error") : t("sales.create_error")));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => salesApi.deleteSale(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success(t("sales.delete_success"));
            setIsDeleteModalOpen(false);
            setDeleteItem(null);
        },
        onError: () => {
            toast.error(t("sales.delete_error"));
        },
    });

    // Monthly export options
    const monthOptions = useMemo(
        () => AZ_MONTHS.map((label, i) => ({ label, value: String(i + 1) })),
        []
    );
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => {
            const y = currentYear - i;
            return { label: String(y), value: String(y) };
        });
    }, []);

    const handleExport = async (type: "excel" | "pdf") => {
        if (exportingType) return;
        setExportingType(type);
        try {
            const res =
                type === "excel"
                    ? await salesApi.exportSalesExcel(exportYear, exportMonth)
                    : await salesApi.exportSalesPdf(exportYear, exportMonth);
            const ext = type === "excel" ? "xlsx" : "pdf";
            const fallback = `${SAFE_MONTHS[exportMonth - 1]}_AYI_SATIS_${exportYear}.${ext}`;
            const fromHeader = parseFilenameFromContentDisposition(
                res.headers["content-disposition"] as string | undefined
            );
            downloadBlob(res.data, fromHeader || fallback);
        } catch {
            toast.error(t("sales.export_error"));
        } finally {
            setExportingType(null);
        }
    };

    // Handlers
    const handleAddNew = () => {
        setEditingSale(null);
        setCreateMode("existing");
        setFormData(emptyForm());
        setExpenses([]);
        setIsModalOpen(true);
    };

    const handleEdit = async (id: string) => {
        try {
            const response = await salesApi.getSaleById(id);
            const sale = (response as { value?: SaleDetailDto }).value ?? (response as unknown as SaleDetailDto);
            if (!sale?.id) {
                toast.error(t("sales.load_error"));
                return;
            }
            setEditingSale(sale);
            setFormData({
                productId: sale.productId ?? "",
                productName: sale.productName ?? "",
                productCode: sale.productCode ?? "",
                categoryId: sale.categoryId ?? "",
                categoryName: sale.categoryName ?? "",
                costPrice: sale.costPrice?.toString() ?? "",
                salePrice: sale.salePrice?.toString() ?? "",
                quantity: sale.quantity?.toString() ?? "",
                soldAt: sale.soldAt ? sale.soldAt.split("T")[0] : "",
                note: sale.note ?? "",
            });
            setExpenses(
                (sale.expenses ?? []).map(e => ({
                    expenseType: e.expenseType,
                    description: e.description ?? "",
                    amount: e.amount.toString(),
                }))
            );
            setIsModalOpen(true);
        } catch {
            toast.error(t("sales.load_error"));
        }
    };

    const handleDeleteClick = (item: SaleListItemDto) => {
        setDeleteItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteItem) {
            deleteMutation.mutate(deleteItem.id);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSale(null);
        setFormData(emptyForm());
        setExpenses([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (activeMode === "existing" && !editingSale && !formData.productId) {
            toast.error(t("sales.product_required"));
            return;
        }
        if (activeMode === "manual" && !formData.productName.trim()) {
            toast.error(t("sales.product_name_required"));
            return;
        }
        if (!formData.salePrice || Number(formData.salePrice) < 0) {
            toast.error(t("sales.sale_price_required"));
            return;
        }
        if (!formData.quantity || Number(formData.quantity) <= 0) {
            toast.error(t("sales.quantity_required"));
            return;
        }
        if (activeMode === "manual" && !editingSale && (formData.costPrice === "" || Number(formData.costPrice) < 0)) {
            toast.error(t("sales.cost_price_required"));
            return;
        }

        for (const exp of expenses) {
            if (exp.expenseType === "") {
                toast.error(t("sales.expense_type_required"));
                return;
            }
            if (exp.amount === "" || Number(exp.amount) < 0) {
                toast.error(t("sales.expense_amount_invalid"));
                return;
            }
        }

        saveMutation.mutate();
    };

    const addExpenseRow = () => setExpenses(prev => [...prev, emptyExpenseRow()]);
    const removeExpenseRow = (idx: number) => setExpenses(prev => prev.filter((_, i) => i !== idx));
    const updateExpenseRow = (idx: number, field: keyof ExpenseRow, value: string) =>
        setExpenses(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));

    const getCategoryOptions = () => {
        const items = categoryItems ?? [];
        return items.map((c) => ({ label: c.value, value: c.key }));
    };

    const getProductOptions = () => {
        const items = products?.value ?? [];
        return items.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }));
    };

    const getExpenseTypeLabel = (type: ExpenseType): string => {
        const map: Record<ExpenseType, string> = {
            Installation: t("sales.expense_type_installation"),
            Delivery: t("sales.expense_type_delivery"),
            Service: t("sales.expense_type_service"),
            Commission: t("sales.expense_type_commission"),
            Other: t("sales.expense_type_other"),
        };
        return map[type];
    };

    const clearAllFilters = () => {
        setFilterDateFrom("");
        setFilterDateTo("");
        setFilterMinProfit("");
        setFilterMaxProfit("");
        setFilterCategoryId("");
        setFilterSaleSource("");
        setFilterMinExpense("");
        setFilterMaxExpense("");
        setPage(1);
    };

    const isDark = theme === "dark";

    const activeAdvancedCount = [
        filterDateFrom, filterDateTo,
        filterMinProfit, filterMaxProfit,
        filterMinExpense, filterMaxExpense,
    ].filter(Boolean).length;

    const activeFilterChips = useMemo(() => {
        const chips: { key: string; label: string; onRemove: () => void }[] = [];
        if (filterCategoryId) {
            const cat = (categoryItems ?? []).find(c => c.key === filterCategoryId);
            chips.push({
                key: "category",
                label: `${t("sales.filter_category")}: ${cat?.value ?? filterCategoryId}`,
                onRemove: () => { setFilterCategoryId(""); setPage(1); },
            });
        }
        if (filterSaleSource) {
            chips.push({
                key: "source",
                label: `${t("sales.filter_source")}: ${filterSaleSource === "ExistingProduct" ? t("sales.source_existing") : t("sales.source_manual")}`,
                onRemove: () => { setFilterSaleSource(""); setPage(1); },
            });
        }
        if (filterDateFrom) chips.push({ key: "dateFrom", label: `${t("sales.date_from")}: ${filterDateFrom}`, onRemove: () => { setFilterDateFrom(""); setPage(1); } });
        if (filterDateTo) chips.push({ key: "dateTo", label: `${t("sales.date_to")}: ${filterDateTo}`, onRemove: () => { setFilterDateTo(""); setPage(1); } });
        if (filterMinProfit) chips.push({ key: "minProfit", label: `${t("sales.min_profit")}: ${filterMinProfit}`, onRemove: () => { setFilterMinProfit(""); setPage(1); } });
        if (filterMaxProfit) chips.push({ key: "maxProfit", label: `${t("sales.max_profit")}: ${filterMaxProfit}`, onRemove: () => { setFilterMaxProfit(""); setPage(1); } });
        if (filterMinExpense) chips.push({ key: "minExpense", label: `${t("sales.min_expense")}: ${filterMinExpense}`, onRemove: () => { setFilterMinExpense(""); setPage(1); } });
        if (filterMaxExpense) chips.push({ key: "maxExpense", label: `${t("sales.max_expense")}: ${filterMaxExpense}`, onRemove: () => { setFilterMaxExpense(""); setPage(1); } });
        return chips;
    }, [filterCategoryId, filterSaleSource, filterDateFrom, filterDateTo, filterMinProfit, filterMaxProfit, filterMinExpense, filterMaxExpense, categoryItems, t]);

    const toggleSort = (key: SortableKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const sortedRows = useMemo(() => {
        const rows = data?.value ?? [];
        if (!sortKey) return rows;
        const dir = sortDir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => (getSortValue(a, sortKey) - getSortValue(b, sortKey)) * dir);
    }, [data, sortKey, sortDir]);

    const SortHeaderButton = ({ label, sortKeyName, align = "left" }: { label: string; sortKeyName: SortableKey; align?: "left" | "right" }) => {
        const active = sortKey === sortKeyName;
        return (
            <button
                type="button"
                onClick={() => toggleSort(sortKeyName)}
                className={cn(
                    "w-full inline-flex items-center gap-1 uppercase tracking-wider text-xs font-semibold whitespace-nowrap transition-colors",
                    align === "right" ? "justify-end" : "justify-start",
                    isDark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900"
                )}
            >
                {label}
                {active ? (
                    sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                ) : (
                    <ArrowUpDown size={12} className="opacity-30" />
                )}
            </button>
        );
    };

    if (isError) {
        return (
            <div className="p-8 text-center text-red-600">
                {t("common.error")}: {(error as { message?: string })?.message ?? "Unknown error"}
            </div>
        );
    }

    const isExistingProductEdit = editingSale?.saleSource === "ExistingProduct";
    const isManualEdit = editingSale?.saleSource === "ManualEntry";
    const showExistingProductFields = activeMode === "existing";
    const showManualFields = activeMode === "manual";

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className={cn(
                    "hidden sm:flex w-12 h-12 rounded-xl items-center justify-center shrink-0",
                    isDark ? "bg-primary-500/10 text-primary-400" : "bg-primary-50 text-primary-600"
                )}>
                    <ReceiptText size={22} />
                </div>
                <div>
                    <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-neutral-900")}>
                        {t("sales.title")}
                    </h1>
                    <p className={cn("text-sm mt-1", isDark ? "text-neutral-400" : "text-neutral-600")}>
                        {t("sales.subtitle")}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title={t("sales.total_sale_amount")}
                    value={formatMoney(summary.totalSaleAmount)}
                    icon={DollarSign}
                    tint="blue"
                    isDark={isDark}
                    isLoading={isLoading || statsLoading}
                />
                <SummaryCard
                    title={t("sales.profit")}
                    value={`${summary.totalProfit >= 0 ? "+" : ""}${formatMoney(summary.totalProfit)}`}
                    icon={summary.totalProfit >= 0 ? TrendingUp : TrendingDown}
                    tint={summary.totalProfit >= 0 ? "green" : "red"}
                    isDark={isDark}
                    isLoading={isLoading || statsLoading}
                />
                <SummaryCard
                    title={t("sales.total_expenses")}
                    value={formatMoney(summary.totalExpenses)}
                    icon={Wallet}
                    tint="orange"
                    isDark={isDark}
                    isLoading={isLoading || statsLoading}
                />
                <SummaryCard
                    title={t("sales.sales_count")}
                    value={summary.count}
                    icon={Hash}
                    tint="violet"
                    isDark={isDark}
                    isLoading={isLoading}
                />
            </div>

            {/* Filters + Add Button */}
            <div
                className={cn(
                    "p-4 rounded-xl border shadow-sm space-y-4",
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                )}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
                    {/* Search */}
                    <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                        <Search
                            size={18}
                            className={cn("absolute top-2.5 left-3", isDark ? "text-neutral-500" : "text-neutral-400")}
                        />
                        <input
                            type="text"
                            placeholder={t("sales.search_placeholder")}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className={cn(
                                "w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-primary-400 focus:border-primary-400",
                                isDark
                                    ? "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                                    : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                            )}
                        />
                    </div>

                    {/* Category filter */}
                    <div className="w-full sm:w-44">
                        <Select
                            options={getCategoryOptions()}
                            value={filterCategoryId}
                            onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
                            placeholder={t("sales.filter_all_categories")}
                        />
                    </div>

                    {/* Sale source filter */}
                    <div className="w-full sm:w-44">
                        <Select
                            options={[
                                { label: t("sales.source_existing"), value: "ExistingProduct" },
                                { label: t("sales.source_manual"), value: "ManualEntry" },
                            ]}
                            value={filterSaleSource}
                            onChange={(e) => { setFilterSaleSource(e.target.value as SaleSource | ""); setPage(1); }}
                            placeholder={t("sales.filter_all_sources")}
                        />
                    </div>

                    <Button variant="primary" icon={<Plus size={18} />} onClick={handleAddNew} className="w-full sm:w-auto shrink-0">
                        {t("sales.add_sale")}
                    </Button>
                </div>

                {/* Monthly export */}
                <div
                    className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap pt-4 border-t",
                        isDark ? "border-neutral-700" : "border-neutral-200"
                    )}
                >
                    <span className={cn("text-sm font-medium", isDark ? "text-neutral-300" : "text-neutral-700")}>
                        {t("sales.monthly_report")}
                    </span>
                    <div className="w-full sm:w-40">
                        <Select
                            options={monthOptions}
                            value={String(exportMonth)}
                            onChange={(e) => setExportMonth(Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <Select
                            options={yearOptions}
                            value={String(exportYear)}
                            onChange={(e) => setExportYear(Number(e.target.value))}
                            placeholder=""
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        <Button
                            variant="secondary"
                            icon={<FileSpreadsheet size={18} />}
                            loading={exportingType === "excel"}
                            disabled={exportingType !== null}
                            onClick={() => handleExport("excel")}
                            className="flex-1 sm:flex-none"
                        >
                            {exportingType === "excel" ? t("sales.exporting") : t("sales.export_excel")}
                        </Button>
                        <Button
                            variant="outline"
                            icon={<FileText size={18} />}
                            loading={exportingType === "pdf"}
                            disabled={exportingType !== null}
                            onClick={() => handleExport("pdf")}
                            className="flex-1 sm:flex-none"
                        >
                            {exportingType === "pdf" ? t("sales.exporting") : t("sales.export_pdf")}
                        </Button>
                    </div>
                </div>

                {/* Active filter chips */}
                {activeFilterChips.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {activeFilterChips.map(chip => (
                            <span
                                key={chip.key}
                                className={cn(
                                    "inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border",
                                    isDark ? "bg-neutral-700/50 border-neutral-600 text-neutral-200" : "bg-neutral-100 border-neutral-200 text-neutral-700"
                                )}
                            >
                                {chip.label}
                                <button
                                    type="button"
                                    onClick={chip.onRemove}
                                    className={cn(
                                        "rounded-full p-0.5 transition-colors",
                                        isDark ? "hover:bg-neutral-600 hover:text-white" : "hover:bg-neutral-200 hover:text-neutral-900"
                                    )}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className={cn(
                                "text-xs font-medium underline-offset-2 hover:underline",
                                isDark ? "text-primary-400" : "text-primary-600"
                            )}
                        >
                            {t("sales.clear_filters")}
                        </button>
                    </div>
                )}

                {/* Advanced filters toggle */}
                <div className={cn(
                    "pt-4 border-t",
                    isDark ? "border-neutral-700" : "border-neutral-100"
                )}>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(o => !o)}
                        className={cn(
                            "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                            isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-900"
                        )}
                    >
                        <SlidersHorizontal size={14} />
                        {t("sales.advanced_filters")}
                        {activeAdvancedCount > 0 && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[10px] font-bold normal-case tracking-normal",
                                isDark ? "bg-primary-500/20 text-primary-300" : "bg-primary-100 text-primary-700"
                            )}>
                                {activeAdvancedCount}
                            </span>
                        )}
                        <ChevronDown size={14} className={cn("transition-transform", filtersOpen && "rotate-180")} />
                    </button>

                    {filtersOpen && (
                        <div className="flex items-end gap-3 flex-wrap mt-3">
                            <div className="w-full sm:w-40">
                                <DateInput
                                    label={t("sales.date_from")}
                                    value={filterDateFrom}
                                    onChange={(v) => { setFilterDateFrom(v); setPage(1); }}
                                />
                            </div>
                            <div className="w-full sm:w-40">
                                <DateInput
                                    label={t("sales.date_to")}
                                    value={filterDateTo}
                                    onChange={(v) => { setFilterDateTo(v); setPage(1); }}
                                />
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border w-full sm:w-auto",
                                isDark ? "border-neutral-700" : "border-neutral-200"
                            )}>
                                <span className={cn("text-xs font-medium whitespace-nowrap", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("sales.profit")}
                                </span>
                                <div className="flex-1 sm:flex-none sm:w-24">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={t("sales.min_profit")}
                                        value={filterMinProfit}
                                        onChange={(e) => { setFilterMinProfit(e.target.value); setPage(1); }}
                                    />
                                </div>
                                <span className={isDark ? "text-neutral-600" : "text-neutral-300"}>—</span>
                                <div className="flex-1 sm:flex-none sm:w-24">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder={t("sales.max_profit")}
                                        value={filterMaxProfit}
                                        onChange={(e) => { setFilterMaxProfit(e.target.value); setPage(1); }}
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border w-full sm:w-auto",
                                isDark ? "border-neutral-700" : "border-neutral-200"
                            )}>
                                <span className={cn("text-xs font-medium whitespace-nowrap", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("sales.total_expenses")}
                                </span>
                                <div className="flex-1 sm:flex-none sm:w-24">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={t("sales.min_expense")}
                                        value={filterMinExpense}
                                        onChange={(e) => { setFilterMinExpense(e.target.value); setPage(1); }}
                                    />
                                </div>
                                <span className={isDark ? "text-neutral-600" : "text-neutral-300"}>—</span>
                                <div className="flex-1 sm:flex-none sm:w-24">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={t("sales.max_expense")}
                                        value={filterMaxExpense}
                                        onChange={(e) => { setFilterMaxExpense(e.target.value); setPage(1); }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div
                className={cn(
                    "rounded-xl border shadow-sm overflow-hidden",
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                )}
            >
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[1280px] text-sm">
                        <thead className={cn(
                            "border-b",
                            isDark ? "bg-neutral-900 border-neutral-700" : "bg-neutral-50 border-neutral-200"
                        )}>
                            <tr>
                                <th className={cn(
                                    "sticky left-0 z-10 px-4 py-3 min-w-[200px] text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap",
                                    isDark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-50 text-neutral-600"
                                )}>
                                    {t("sales.product_name")}
                                </th>
                                <th className={cn("px-4 py-3 min-w-[120px] text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-600")}>
                                    {t("sales.category")}
                                </th>
                                <th className="px-4 py-3 min-w-[120px]">
                                    <SortHeaderButton label={t("sales.sale_price")} sortKeyName="salePrice" align="right" />
                                </th>
                                <th className="px-4 py-3 min-w-[100px]">
                                    <SortHeaderButton label={t("sales.quantity")} sortKeyName="quantity" align="right" />
                                </th>
                                <th className="px-4 py-3 min-w-[140px]">
                                    <SortHeaderButton label={t("sales.total_cost")} sortKeyName="cost" align="right" />
                                </th>
                                <th className="px-4 py-3 min-w-[150px]">
                                    <SortHeaderButton label={t("sales.total_sale_amount")} sortKeyName="totalSaleAmount" align="right" />
                                </th>
                                <th className="px-4 py-3 min-w-[130px]">
                                    <SortHeaderButton label={t("sales.total_expenses")} sortKeyName="totalExpenses" align="right" />
                                </th>
                                <th className="px-4 py-3 min-w-[130px]">
                                    <SortHeaderButton label={t("sales.profit")} sortKeyName="profit" align="right" />
                                </th>
                                <th className={cn("px-4 py-3 min-w-[130px] text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-600")}>
                                    {t("sales.sale_source")}
                                </th>
                                <th className="px-4 py-3 min-w-[110px]">
                                    <SortHeaderButton label={t("sales.sold_at")} sortKeyName="soldAt" />
                                </th>
                                <th className={cn("px-4 py-3 min-w-[100px] text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-600")}>
                                    {t("common.actions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className={cn("divide-y", isDark ? "divide-neutral-800" : "divide-neutral-200")}>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        {Array.from({ length: 11 }).map((_, colIdx) => (
                                            <td key={colIdx} className="px-4 py-4">
                                                <div className={cn(
                                                    "h-3 rounded animate-pulse",
                                                    colIdx === 0 ? "w-32" : "w-16",
                                                    isDark ? "bg-neutral-700" : "bg-neutral-200"
                                                )} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : sortedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className={cn(
                                                "w-14 h-14 rounded-full flex items-center justify-center",
                                                isDark ? "bg-neutral-900" : "bg-neutral-100"
                                            )}>
                                                <ReceiptText size={24} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                                            </div>
                                            <p className={cn("text-sm font-medium", isDark ? "text-neutral-300" : "text-neutral-600")}>
                                                {t("sales.empty_state_title")}
                                            </p>
                                            <p className={cn("text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                {t("sales.empty_state_subtitle")}
                                            </p>
                                            <Button variant="primary" icon={<Plus size={16} />} onClick={handleAddNew}>
                                                {t("sales.add_sale")}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedRows.map(item => (
                                    <tr key={item.id} className={cn("group/row transition-colors", isDark ? "hover:bg-neutral-800/60" : "hover:bg-neutral-50")}>
                                        <td className={cn(
                                            "sticky left-0 z-10 px-4 py-3",
                                            isDark ? "bg-neutral-800 group-hover/row:bg-neutral-800/60" : "bg-white group-hover/row:bg-neutral-50"
                                        )}>
                                            <div className="flex items-center gap-2 min-w-[180px]">
                                                <div className="min-w-0">
                                                    <div className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-neutral-900")}>
                                                        {item.productName}
                                                    </div>
                                                    {item.productCode && (
                                                        <div className={cn("text-[11px] font-mono mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                            {item.productCode}
                                                        </div>
                                                    )}
                                                </div>
                                                {item.note && <NoteIndicator note={item.note} isDark={isDark} />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn("text-sm whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                                {item.categoryName ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={cn("text-sm font-medium tabular-nums whitespace-nowrap", isDark ? "text-white" : "text-neutral-900")}>
                                                {formatMoney(item.salePrice)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={cn("text-sm tabular-nums whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                                            <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                                                {formatMoney(item.totalCost)}
                                            </div>
                                            <div className={cn("text-[11px]", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                {formatMoney(item.costPrice)} / əd.
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={cn("text-sm font-medium tabular-nums whitespace-nowrap", isDark ? "text-white" : "text-neutral-900")}>
                                                {formatMoney(item.totalSaleAmount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={cn("text-sm tabular-nums whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                                {formatMoney(item.totalExpenses ?? 0)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ProfitBadge
                                                profit={item.profit}
                                                formatted={`${item.profit >= 0 ? "+" : ""}${formatMoney(item.profit)}`}
                                                isDark={isDark}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <SourceIndicator
                                                source={item.saleSource}
                                                isDark={isDark}
                                                label={item.saleSource === "ExistingProduct" ? t("sales.source_existing") : t("sales.source_manual")}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn("text-sm whitespace-nowrap", isDark ? "text-neutral-400" : "text-neutral-600")}>
                                                {new Date(item.soldAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-colors",
                                                        isDark ? "hover:bg-neutral-700 text-neutral-400 hover:text-white" : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                                                    )}
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item.id); }}
                                                    title={t("common.edit")}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-colors",
                                                        isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-600"
                                                    )}
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                    title={t("common.delete")}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile card layout (<768px) */}
                <div className="md:hidden">
                    {isLoading ? (
                        <div className={cn("divide-y", isDark ? "divide-neutral-800" : "divide-neutral-200")}>
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className="p-4 space-y-3">
                                    <div className={cn("h-4 w-40 rounded animate-pulse", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                                    <div className={cn("h-3 w-24 rounded animate-pulse", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                                    <div className={cn("h-3 w-32 rounded animate-pulse", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                                </div>
                            ))}
                        </div>
                    ) : sortedRows.length === 0 ? (
                        <div className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center",
                                    isDark ? "bg-neutral-900" : "bg-neutral-100"
                                )}>
                                    <ReceiptText size={24} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                                </div>
                                <p className={cn("text-sm font-medium", isDark ? "text-neutral-300" : "text-neutral-600")}>
                                    {t("sales.empty_state_title")}
                                </p>
                                <p className={cn("text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                    {t("sales.empty_state_subtitle")}
                                </p>
                                <Button variant="primary" icon={<Plus size={16} />} onClick={handleAddNew}>
                                    {t("sales.add_sale")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className={cn("divide-y", isDark ? "divide-neutral-800" : "divide-neutral-200")}>
                            {sortedRows.map(item => (
                                <div key={item.id} className="p-4 space-y-3">
                                    {/* Header: name + actions */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex items-start gap-1.5">
                                            <div className="min-w-0">
                                                <div className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-neutral-900")}>
                                                    {item.productName}
                                                </div>
                                                {item.productCode && (
                                                    <div className={cn("text-[11px] font-mono mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                        {item.productCode}
                                                    </div>
                                                )}
                                            </div>
                                            {item.note && <NoteIndicator note={item.note} isDark={isDark} />}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    isDark ? "hover:bg-neutral-700 text-neutral-400 hover:text-white" : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                                                )}
                                                onClick={() => handleEdit(item.id)}
                                                title={t("common.edit")}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-600"
                                                )}
                                                onClick={() => handleDeleteClick(item)}
                                                title={t("common.delete")}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta: source + category + date */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <SourceIndicator
                                            source={item.saleSource}
                                            isDark={isDark}
                                            label={item.saleSource === "ExistingProduct" ? t("sales.source_existing") : t("sales.source_manual")}
                                        />
                                        <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>•</span>
                                        <span className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                            {item.categoryName ?? "—"}
                                        </span>
                                        <span className={cn("text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>•</span>
                                        <span className={cn("text-sm whitespace-nowrap", isDark ? "text-neutral-400" : "text-neutral-600")}>
                                            {new Date(item.soldAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Figures */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("sales.sale_price")}</span>
                                            <span className={cn("text-sm font-medium tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
                                                {formatMoney(item.salePrice)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("sales.quantity")}</span>
                                            <span className={cn("text-sm tabular-nums", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("sales.total_sale_amount")}</span>
                                            <span className={cn("text-sm font-medium tabular-nums", isDark ? "text-white" : "text-neutral-900")}>
                                                {formatMoney(item.totalSaleAmount)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("sales.total_expenses")}</span>
                                            <span className={cn("text-sm tabular-nums", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                                {formatMoney(item.totalExpenses ?? 0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Profit */}
                                    <div className={cn(
                                        "flex items-center justify-between gap-2 pt-2 border-t",
                                        isDark ? "border-neutral-800" : "border-neutral-100"
                                    )}>
                                        <span className={cn("text-xs font-medium", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("sales.profit")}</span>
                                        <ProfitBadge
                                            profit={item.profit}
                                            formatted={`${item.profit >= 0 ? "+" : ""}${formatMoney(item.profit)}`}
                                            isDark={isDark}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {data && data.page !== undefined && (
                    <Pagination
                        currentPage={data.page}
                        totalPages={data.totalPages}
                        itemsPerPage={data.pageSize}
                        totalItems={data.totalCount ?? (data.value ?? []).length}
                        onPageChange={setPage}
                        onItemsPerPageChange={(v) => { setPageSize(v); setPage(1); }}
                    />
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                open={isModalOpen}
                onClose={closeModal}
                title={editingSale ? t("sales.edit_sale") : t("sales.add_sale")}
                width="max-w-2xl"
                mobileFullScreen
                footer={
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" form="sales-form" variant="primary" loading={saveMutation.isPending}>
                            {editingSale ? t("common.update") : t("common.create")}
                        </Button>
                    </div>
                }
            >
                {/* Tab switcher — only when creating */}
                {!editingSale && (
                    <div className={cn(
                        "flex rounded-lg p-1 mb-4",
                        isDark ? "bg-neutral-700" : "bg-neutral-100"
                    )}>
                        <button
                            type="button"
                            onClick={() => setCreateMode("existing")}
                            className={cn(
                                "flex-1 py-2.5 rounded-md text-sm font-medium transition-all",
                                createMode === "existing"
                                    ? "bg-primary-400 text-white shadow"
                                    : isDark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900"
                            )}
                        >
                            {t("sales.tab_existing")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreateMode("manual")}
                            className={cn(
                                "flex-1 py-2.5 rounded-md text-sm font-medium transition-all",
                                createMode === "manual"
                                    ? "bg-primary-400 text-white shadow"
                                    : isDark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900"
                            )}
                        >
                            {t("sales.tab_manual")}
                        </button>
                    </div>
                )}

                {/* Edit mode: show sale source badge */}
                {editingSale && (
                    <div className={cn(
                        "mb-4 p-3 rounded-lg border text-sm",
                        isDark ? "bg-neutral-700 border-neutral-600 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-700"
                    )}>
                        <span className="font-medium">{t("sales.sale_source")}: </span>
                        <SourceBadge
                            source={isExistingProductEdit ? "ExistingProduct" : "ManualEntry"}
                            isDark={isDark}
                            label={isExistingProductEdit ? t("sales.source_existing") : t("sales.source_manual")}
                        />
                        {isExistingProductEdit && (
                            <p className={cn("mt-1 text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                {t("sales.existing_edit_note")}
                            </p>
                        )}
                    </div>
                )}

                <form id="sales-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* Existing product: product picker (create only) */}
                    {showExistingProductFields && !editingSale && (
                        <Select
                            label={t("sales.product")}
                            options={getProductOptions()}
                            value={formData.productId}
                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                            placeholder={t("sales.select_product")}
                            required
                        />
                    )}

                    {/* Existing product edit: show read-only product info */}
                    {isExistingProductEdit && (
                        <div className={cn(
                            "p-3 rounded-lg border space-y-1",
                            isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50 border-neutral-200"
                        )}>
                            <div className={cn("text-xs font-medium", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                {t("sales.product_snapshot")}
                            </div>
                            <div className={cn("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                                {formData.productName}
                            </div>
                            {formData.productCode && (
                                <div className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("sales.product_code")}: {formData.productCode}
                                </div>
                            )}
                            {formData.categoryName && (
                                <div className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("sales.category")}: {formData.categoryName}
                                </div>
                            )}
                            <div className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                {t("sales.cost_price")}: {formatMoney(Number(formData.costPrice))}
                            </div>
                        </div>
                    )}

                    {/* Manual entry: editable product fields */}
                    {(showManualFields || isManualEdit) && (
                        <>
                            <Input
                                label={t("sales.product_name")}
                                value={formData.productName}
                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                required
                            />
                            <Input
                                label={t("sales.product_code")}
                                value={formData.productCode}
                                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                            />
                            <Select
                                label={t("sales.category")}
                                options={getCategoryOptions()}
                                value={formData.categoryId}
                                onChange={(e) => {
                                    const cat = (categoryItems ?? []).find(c => c.key === e.target.value);
                                    setFormData({
                                        ...formData,
                                        categoryId: e.target.value,
                                        categoryName: cat?.value ?? "",
                                    });
                                }}
                                placeholder="—"
                            />
                            <Input
                                label={t("sales.cost_price")}
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                required
                            />
                        </>
                    )}

                    {/* Common editable fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label={t("sales.sale_price")}
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.salePrice}
                            onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                            required
                        />
                        <Input
                            label={t("sales.quantity")}
                            type="number"
                            min="1"
                            step="1"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                        />
                    </div>

                    <DateInput
                        label={t("sales.sold_at")}
                        value={formData.soldAt}
                        onChange={(v) => setFormData({ ...formData, soldAt: v })}
                    />

                    <Textarea
                        label={t("sales.note")}
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        rows={2}
                    />

                    {/* Expenses section */}
                    <div className={cn(
                        "rounded-lg border p-3 space-y-3",
                        isDark ? "border-neutral-600 bg-neutral-900/40" : "border-neutral-200 bg-neutral-50"
                    )}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                                    {t("sales.expenses")}
                                </span>
                                <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("sales.profit_formula")}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                icon={<Plus size={14} />}
                                onClick={addExpenseRow}
                                className="w-full sm:w-auto shrink-0"
                            >
                                {t("sales.add_expense")}
                            </Button>
                        </div>

                        {expenses.length === 0 ? (
                            <p className={cn("text-xs text-center py-2", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                {t("sales.no_expenses")}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {expenses.map((row, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                        <div className="w-full sm:w-40 sm:flex-shrink-0">
                                            <Select
                                                options={EXPENSE_TYPES.map(type => ({
                                                    label: getExpenseTypeLabel(type),
                                                    value: type,
                                                }))}
                                                value={row.expenseType}
                                                onChange={(e) => updateExpenseRow(idx, "expenseType", e.target.value)}
                                                placeholder={t("sales.expense_type")}
                                            />
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-28 flex-1 sm:flex-none sm:flex-shrink-0">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder={t("sales.expense_amount")}
                                                    value={row.amount}
                                                    onChange={(e) => updateExpenseRow(idx, "amount", e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeExpenseRow(idx)}
                                                className={cn(
                                                    "mt-1 p-1.5 rounded transition-colors flex-shrink-0 sm:hidden",
                                                    isDark
                                                        ? "hover:bg-red-900/20 text-red-400"
                                                        : "hover:bg-red-50 text-red-500"
                                                )}
                                                title={t("sales.remove_expense")}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="w-full sm:flex-1">
                                            <Input
                                                placeholder={t("sales.expense_description")}
                                                value={row.description}
                                                maxLength={1000}
                                                onChange={(e) => updateExpenseRow(idx, "description", e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExpenseRow(idx)}
                                            className={cn(
                                                "mt-1 p-1.5 rounded transition-colors flex-shrink-0 hidden sm:block",
                                                isDark
                                                    ? "hover:bg-red-900/20 text-red-400"
                                                    : "hover:bg-red-50 text-red-500"
                                            )}
                                            title={t("sales.remove_expense")}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                open={isDeleteModalOpen}
                title={t("sales.delete_title")}
                message={
                    deleteItem?.saleSource === "ExistingProduct"
                        ? t("sales.delete_message_existing")
                        : t("sales.delete_message")
                }
                confirmLabel={t("common.delete")}
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setIsDeleteModalOpen(false); setDeleteItem(null); }}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};
