import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Wallet, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { useToast } from "../core/providers/ToastContext";
import { cn } from "../utils/cn";
import { Button } from "../components/commons/Button";
import { Pagination } from "../components/commons/Pagination";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { CreditSaleSummaryCards } from "../components/creditSales/CreditSaleSummaryCards";
import { CreditSaleFilters } from "../components/creditSales/CreditSaleFilters";
import {
    emptyCreditSaleFilters,
    type CreditSaleFilterState,
} from "../components/creditSales/creditSaleHelpers";
import { CreditSaleTable } from "../components/creditSales/CreditSaleTable";
import { CreditSaleForm, type CreditSaleFormValues } from "../components/creditSales/CreditSaleForm";
import { CreditSaleDetailModal } from "../components/creditSales/CreditSaleDetailModal";
import { ConfirmMarkAsSoldModal } from "../components/creditSales/ConfirmMarkAsSoldModal";
import { creditSalesApi, PRODUCT_SOURCE_TYPE_NUMERIC } from "../core/api/creditSales.api";
import type {
    CreditSaleDetail,
    CreditSaleListItem,
    CreateCreditSaleRequest,
    UpdateCreditSaleRequest,
    CreditSaleExpenseRequestDto,
    ExpenseType,
} from "../core/api/creditSales.api";

const toIso = (d: string) => (d ? new Date(d).toISOString() : undefined);

const errMessage = (err: unknown): string | undefined => {
    const e = err as { response?: { data?: { error?: { message?: string } | string } } };
    const data = e?.response?.data?.error;
    if (typeof data === "string") return data;
    return data?.message;
};

export const CreditSalesPage = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const queryClient = useQueryClient();
    const toast = useToast();
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState<CreditSaleFilterState>(emptyCreditSaleFilters());

    // Modal state
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CreditSaleDetail | null>(null);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<CreditSaleDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [markSoldItem, setMarkSoldItem] = useState<CreditSaleListItem | null>(null);
    const [cancelItem, setCancelItem] = useState<CreditSaleListItem | null>(null);

    const listParams = useMemo(
        () => ({
            search: filters.search || undefined,
            status: filters.status || undefined,
            productSource: filters.productSource || undefined,
            creditDateFrom: toIso(filters.creditDateFrom),
            creditDateTo: toIso(filters.creditDateTo),
            dueDateFrom: toIso(filters.dueDateFrom),
            dueDateTo: toIso(filters.dueDateTo),
        }),
        [filters]
    );

    const summaryParams = useMemo(
        () => ({
            creditDateFrom: toIso(filters.creditDateFrom),
            creditDateTo: toIso(filters.creditDateTo),
            dueDateFrom: toIso(filters.dueDateFrom),
            dueDateTo: toIso(filters.dueDateTo),
        }),
        [filters]
    );

    const filterDeps = [
        filters.search,
        filters.status,
        filters.productSource,
        filters.creditDateFrom,
        filters.creditDateTo,
        filters.dueDateFrom,
        filters.dueDateTo,
    ];

    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ["credit-sales", page, pageSize, ...filterDeps],
        queryFn: () => creditSalesApi.getCreditSales({ page, pageSize, ...listParams }),
    });

    const { data: summaryData, isLoading: summaryLoading } = useQuery({
        queryKey: ["credit-sales-summary", ...filterDeps],
        queryFn: () => creditSalesApi.getCreditSalesSummary(summaryParams),
    });

    const items = data?.value ?? [];
    const summary = summaryData?.value ?? null;

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ["credit-sales"] });
        queryClient.invalidateQueries({ queryKey: ["credit-sales-summary"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
    };

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (values: CreditSaleFormValues) => {
            const expenses: CreditSaleExpenseRequestDto[] = values.expenses
                .filter((e) => e.expenseType !== "" && e.amount !== "")
                .map((e) => ({
                    expenseType: e.expenseType as ExpenseType,
                    description: e.description.trim() || null,
                    amount: Number(e.amount),
                }));

            const common = {
                customerName: values.customerName.trim() || null,
                customerPhone: values.customerPhone.trim() || null,
                costPrice: Number(values.costPrice),
                salePrice: Number(values.salePrice),
                quantity: Number(values.quantity),
                creditDate: toIso(values.creditDate)!,
                dueDate: toIso(values.dueDate) ?? null,
                expenses,
                note: values.note.trim() || null,
            };

            if (editing) {
                const payload: UpdateCreditSaleRequest = common;
                return creditSalesApi.updateCreditSale(editing.id, payload);
            }

            const isExisting = values.productSource === "ExistingProduct";
            const payload: CreateCreditSaleRequest = {
                ...common,
                productSourceType: PRODUCT_SOURCE_TYPE_NUMERIC[values.productSource],
                productId: isExisting ? values.productId : null,
                productName: isExisting ? null : values.productName.trim() || null,
                sku: values.sku.trim() || null,
            };
            return creditSalesApi.createCreditSale(payload);
        },
        onSuccess: () => {
            invalidateAll();
            setFormOpen(false);
            setEditing(null);
            toast.success(editing ? t("creditSales.update_success") : t("creditSales.create_success"));
        },
        onError: (err) => {
            toast.error(errMessage(err) || (editing ? t("creditSales.update_error") : t("creditSales.create_error")));
        },
    });

    const markSoldMutation = useMutation({
        mutationFn: ({ id, soldAt }: { id: string; soldAt: string }) =>
            creditSalesApi.markCreditSaleAsSold(id, { soldAt: toIso(soldAt)! }),
        onSuccess: () => {
            invalidateAll();
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            setMarkSoldItem(null);
            toast.success(t("creditSales.mark_sold_success"));
            toast.info(t("creditSales.view_sales_hint"), 5000);
        },
        onError: (err) => {
            toast.error(errMessage(err) || t("creditSales.mark_sold_error"));
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => creditSalesApi.cancelCreditSale(id),
        onSuccess: () => {
            invalidateAll();
            setCancelItem(null);
            toast.success(t("creditSales.cancel_success"));
        },
        onError: (err) => {
            toast.error(errMessage(err) || t("creditSales.cancel_error"));
        },
    });

    // Handlers
    const handleChangeFilters = (patch: Partial<CreditSaleFilterState>) => {
        setFilters((f) => ({ ...f, ...patch }));
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilters(emptyCreditSaleFilters());
        setPage(1);
    };

    const handleAddNew = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const handleEdit = async (item: CreditSaleListItem) => {
        try {
            const response = await creditSalesApi.getCreditSaleById(item.id);
            const detail = (response as { value?: CreditSaleDetail }).value ?? (response as unknown as CreditSaleDetail);
            setEditing(detail?.id ? detail : (item as CreditSaleDetail));
        } catch {
            // list item carries all editable fields; fall back to it
            setEditing(item as CreditSaleDetail);
        }
        setFormOpen(true);
    };

    const handleDetail = async (item: CreditSaleListItem) => {
        setDetailOpen(true);
        setDetailItem(null);
        setDetailLoading(true);
        try {
            const response = await creditSalesApi.getCreditSaleById(item.id);
            const detail = (response as { value?: CreditSaleDetail }).value ?? (response as unknown as CreditSaleDetail);
            setDetailItem(detail?.id ? detail : (item as CreditSaleDetail));
        } catch {
            setDetailItem(item as CreditSaleDetail);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("hidden sm:flex w-12 h-12 rounded-xl items-center justify-center shrink-0", isDark ? "bg-primary-500/10 text-primary-400" : "bg-primary-50 text-primary-600")}>
                        <Wallet size={22} />
                    </div>
                    <div>
                        <h1 className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-neutral-900")}>
                            {t("creditSales.title")}
                        </h1>
                        <p className={cn("text-sm mt-1", isDark ? "text-neutral-400" : "text-neutral-600")}>
                            {t("creditSales.subtitle")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <CreditSaleSummaryCards summary={summary} isLoading={summaryLoading} />

            {/* Filters */}
            <CreditSaleFilters
                filters={filters}
                onChange={handleChangeFilters}
                onClear={handleClearFilters}
                onRefresh={() => refetch()}
                onAddNew={handleAddNew}
                isRefreshing={isFetching}
            />

            {/* Table / error */}
            {isError ? (
                <div className={cn("rounded-xl border shadow-sm p-10 flex flex-col items-center gap-3 text-center", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200")}>
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", isDark ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600")}>
                        <AlertCircle size={26} />
                    </div>
                    <p className={cn("text-sm font-medium", isDark ? "text-neutral-200" : "text-neutral-700")}>
                        {t("creditSales.load_error")}
                    </p>
                    <Button variant="primary" icon={<RefreshCw size={16} />} onClick={() => refetch()}>
                        {t("creditSales.retry")}
                    </Button>
                </div>
            ) : (
                <div className={cn("rounded-xl border shadow-sm overflow-hidden", isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200")}>
                    <CreditSaleTable
                        items={items}
                        isLoading={isLoading}
                        onDetail={handleDetail}
                        onEdit={handleEdit}
                        onMarkSold={setMarkSoldItem}
                        onCancel={setCancelItem}
                        onAddNew={handleAddNew}
                    />
                    {data && data.page !== undefined && (
                        <Pagination
                            currentPage={data.page}
                            totalPages={data.totalPages}
                            itemsPerPage={data.pageSize}
                            totalItems={data.totalCount ?? items.length}
                            onPageChange={setPage}
                            onItemsPerPageChange={(v) => { setPageSize(v); setPage(1); }}
                        />
                    )}
                </div>
            )}

            {/* Create / Edit */}
            <CreditSaleForm
                open={formOpen}
                editing={editing}
                isSubmitting={saveMutation.isPending}
                onClose={() => { setFormOpen(false); setEditing(null); }}
                onSubmit={(values) => saveMutation.mutate(values)}
            />

            {/* Detail */}
            <CreditSaleDetailModal
                open={detailOpen}
                item={detailItem}
                isLoading={detailLoading}
                onClose={() => { setDetailOpen(false); setDetailItem(null); }}
                onViewSale={() => navigate("/sales")}
            />

            {/* Mark as sold */}
            <ConfirmMarkAsSoldModal
                open={!!markSoldItem}
                item={markSoldItem}
                isLoading={markSoldMutation.isPending}
                onConfirm={(soldAt) => { if (markSoldItem) markSoldMutation.mutate({ id: markSoldItem.id, soldAt }); }}
                onCancel={() => setMarkSoldItem(null)}
            />

            {/* Cancel */}
            <ConfirmationModal
                open={!!cancelItem}
                title={t("creditSales.cancel_title")}
                message={t("creditSales.cancel_message")}
                confirmLabel={t("creditSales.action_cancel")}
                variant="warning"
                onConfirm={() => { if (cancelItem) cancelMutation.mutate(cancelItem.id); }}
                onCancel={() => setCancelItem(null)}
                isLoading={cancelMutation.isPending}
            />
        </div>
    );
};
