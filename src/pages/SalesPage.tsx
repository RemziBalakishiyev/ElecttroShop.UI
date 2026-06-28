import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "../components/commons/Button";
import { Table } from "../components/commons/Table";
import { Pagination } from "../components/commons/Pagination";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Input } from "../components/commons/Input";
import { Select } from "../components/commons/Select";
import { DateInput } from "../components/commons/DateInput";
import { Modal } from "../components/commons/Modal";
import { Textarea } from "../components/commons/Textarea";
import { salesApi } from "../core/api/sales.api";
import type { SaleListItemDto, SaleDetailDto, SaleSource } from "../core/api/sales.api";
import { productsApi } from "../core/api/products.api";
import { categoriesApi } from "../core/api/categories.api";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

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

const formatMoney = (value: number) =>
    value.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₼";

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

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<SaleDetailDto | null>(null);
    const [createMode, setCreateMode] = useState<CreateMode>("existing");
    const [formData, setFormData] = useState<FormData>(emptyForm());

    // Delete state
    const [deleteItem, setDeleteItem] = useState<SaleListItemDto | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data queries
    const { data, isLoading, isError, error } = useQuery({
        queryKey: [
            "sales",
            page, pageSize, search,
            filterCategoryId, filterSaleSource,
            filterDateFrom, filterDateTo,
            filterMinProfit, filterMaxProfit,
        ],
        queryFn: () =>
            salesApi.getSales({
                page,
                pageSize,
                search: search || undefined,
                categoryId: filterCategoryId || undefined,
                saleSource: filterSaleSource || undefined,
                dateFrom: filterDateFrom ? new Date(filterDateFrom).toISOString() : undefined,
                dateTo: filterDateTo ? new Date(filterDateTo).toISOString() : undefined,
                minProfit: filterMinProfit ? Number(filterMinProfit) : undefined,
                maxProfit: filterMaxProfit ? Number(filterMaxProfit) : undefined,
            }),
    });

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

    // Handlers
    const handleAddNew = () => {
        setEditingSale(null);
        setCreateMode("existing");
        setFormData(emptyForm());
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

        saveMutation.mutate();
    };

    const getCategoryOptions = () => {
        const items = categoryItems ?? [];
        return items.map((c) => ({ label: c.value, value: c.key }));
    };

    const getProductOptions = () => {
        const items = products?.value ?? [];
        return items.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }));
    };

    const isDark = theme === "dark";

    const columns = [
        {
            key: "productName",
            label: t("sales.product_name"),
            render: (item: SaleListItemDto) => (
                <div>
                    <div className={cn("text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                        {item.productName}
                    </div>
                    {item.productCode && (
                        <div className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                            {item.productCode}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "categoryName",
            label: t("sales.category"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    {item.categoryName ?? "—"}
                </span>
            ),
        },
        {
            key: "costPrice",
            label: t("sales.cost_price"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    {formatMoney(item.costPrice)}
                </span>
            ),
        },
        {
            key: "salePrice",
            label: t("sales.sale_price"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                    {formatMoney(item.salePrice)}
                </span>
            ),
        },
        {
            key: "quantity",
            label: t("sales.quantity"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    {item.quantity}
                </span>
            ),
        },
        {
            key: "totalCost",
            label: t("sales.total_cost"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    {formatMoney(item.totalCost)}
                </span>
            ),
        },
        {
            key: "totalSaleAmount",
            label: t("sales.total_sale_amount"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                    {formatMoney(item.totalSaleAmount)}
                </span>
            ),
        },
        {
            key: "profit",
            label: t("sales.profit"),
            render: (item: SaleListItemDto) => (
                <span
                    className={cn(
                        "text-sm font-semibold",
                        item.profit > 0
                            ? "text-success"
                            : item.profit < 0
                            ? "text-red-500"
                            : isDark ? "text-neutral-400" : "text-neutral-500"
                    )}
                >
                    {item.profit >= 0 ? "+" : ""}{formatMoney(item.profit)}
                </span>
            ),
        },
        {
            key: "saleSource",
            label: t("sales.sale_source"),
            render: (item: SaleListItemDto) => (
                <span
                    className={cn(
                        "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                        item.saleSource === "ExistingProduct"
                            ? "bg-primary-400/10 text-primary-600"
                            : "bg-amber-100 text-amber-700"
                    )}
                >
                    {item.saleSource === "ExistingProduct"
                        ? t("sales.source_existing")
                        : t("sales.source_manual")}
                </span>
            ),
        },
        {
            key: "soldAt",
            label: t("sales.sold_at"),
            render: (item: SaleListItemDto) => (
                <span className={cn("text-sm", isDark ? "text-neutral-400" : "text-neutral-600")}>
                    {new Date(item.soldAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: "note",
            label: t("sales.note"),
            render: (item: SaleListItemDto) => (
                <span
                    className={cn("text-xs max-w-[120px] truncate block", isDark ? "text-neutral-400" : "text-neutral-500")}
                    title={item.note ?? ""}
                >
                    {item.note ?? "—"}
                </span>
            ),
        },
        {
            key: "actions",
            label: t("common.actions"),
            render: (item: SaleListItemDto) => (
                <div className="flex items-center gap-2">
                    <button
                        className={cn(
                            "p-1 rounded transition-colors",
                            isDark
                                ? "hover:bg-neutral-700 text-neutral-400"
                                : "hover:bg-neutral-100 text-neutral-600"
                        )}
                        onClick={(e) => { e.stopPropagation(); handleEdit(item.id); }}
                        title={t("common.edit")}
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className={cn(
                            "p-1 rounded transition-colors",
                            isDark
                                ? "hover:bg-red-900/20 text-red-400"
                                : "hover:bg-red-50 text-red-600"
                        )}
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                        title={t("common.delete")}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

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
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-neutral-900")}>
                        {t("sales.title")}
                    </h1>
                    <p className={cn("text-sm mt-1", isDark ? "text-neutral-400" : "text-neutral-600")}>
                        {t("sales.subtitle")}
                    </p>
                </div>
            </div>

            {/* Filters + Add Button */}
            <div
                className={cn(
                    "p-4 rounded-lg border space-y-3",
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                )}
            >
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
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
                                "w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400",
                                isDark
                                    ? "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                                    : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                            )}
                        />
                    </div>

                    {/* Category filter */}
                    <div className="w-44">
                        <Select
                            options={getCategoryOptions()}
                            value={filterCategoryId}
                            onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
                            placeholder={t("sales.filter_all_categories")}
                        />
                    </div>

                    {/* Sale source filter */}
                    <div className="w-44">
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

                    <Button variant="primary" icon={<Plus size={18} />} onClick={handleAddNew}>
                        {t("sales.add_sale")}
                    </Button>
                </div>

                {/* Advanced filters row */}
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="w-40">
                        <DateInput
                            label={t("sales.date_from")}
                            value={filterDateFrom}
                            onChange={(v) => { setFilterDateFrom(v); setPage(1); }}
                        />
                    </div>
                    <div className="w-40">
                        <DateInput
                            label={t("sales.date_to")}
                            value={filterDateTo}
                            onChange={(v) => { setFilterDateTo(v); setPage(1); }}
                        />
                    </div>
                    <div className="w-32">
                        <Input
                            label={t("sales.min_profit")}
                            type="number"
                            step="0.01"
                            value={filterMinProfit}
                            onChange={(e) => { setFilterMinProfit(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="w-32">
                        <Input
                            label={t("sales.max_profit")}
                            type="number"
                            step="0.01"
                            value={filterMaxProfit}
                            onChange={(e) => { setFilterMaxProfit(e.target.value); setPage(1); }}
                        />
                    </div>
                    {(filterDateFrom || filterDateTo || filterMinProfit || filterMaxProfit || filterCategoryId || filterSaleSource) && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFilterDateFrom("");
                                setFilterDateTo("");
                                setFilterMinProfit("");
                                setFilterMaxProfit("");
                                setFilterCategoryId("");
                                setFilterSaleSource("");
                                setPage(1);
                            }}
                        >
                            {t("sales.clear_filters")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div
                className={cn(
                    "rounded-lg border overflow-hidden",
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                )}
            >
                <Table
                    columns={columns}
                    data={data?.value ?? []}
                    isLoading={isLoading}
                />
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
                                "flex-1 py-2 rounded-md text-sm font-medium transition-all",
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
                                "flex-1 py-2 rounded-md text-sm font-medium transition-all",
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
                        <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                            isExistingProductEdit
                                ? "bg-primary-400/10 text-primary-600"
                                : "bg-amber-100 text-amber-700"
                        )}>
                            {isExistingProductEdit ? t("sales.source_existing") : t("sales.source_manual")}
                        </span>
                        {isExistingProductEdit && (
                            <p className={cn("mt-1 text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                {t("sales.existing_edit_note")}
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" variant="primary" loading={saveMutation.isPending}>
                            {editingSale ? t("common.update") : t("common.create")}
                        </Button>
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
