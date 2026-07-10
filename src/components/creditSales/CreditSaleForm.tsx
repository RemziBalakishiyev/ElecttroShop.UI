import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Modal } from "../commons/Modal";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { DateInput } from "../commons/DateInput";
import { Textarea } from "../commons/Textarea";
import { ProductSearchSelect } from "./ProductSearchSelect";
import { useToast } from "../../core/providers/ToastContext";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { formatCurrency, getProfitColor } from "../../utils/reportFormat";
import { todayIso } from "./creditSaleHelpers";
import type { Product } from "../../core/api/products.api";
import {
    normalizeProductSource,
    type CreditSaleDetail,
    type ProductSourceType,
    type ExpenseType,
} from "../../core/api/creditSales.api";

const EXPENSE_TYPES: ExpenseType[] = ["Installation", "Delivery", "Service", "Commission", "Other"];

export interface ExpenseRow {
    expenseType: ExpenseType | "";
    description: string;
    amount: string;
}

const emptyExpenseRow = (): ExpenseRow => ({ expenseType: "", description: "", amount: "" });

export interface CreditSaleFormValues {
    productSource: ProductSourceType;
    productId: string;
    productName: string;
    sku: string;
    categoryName: string;
    customerName: string;
    customerPhone: string;
    costPrice: string;
    salePrice: string;
    quantity: string;
    creditDate: string;
    dueDate: string;
    expenses: ExpenseRow[];
    note: string;
}

const emptyValues = (): CreditSaleFormValues => ({
    productSource: "ExistingProduct",
    productId: "",
    productName: "",
    sku: "",
    categoryName: "",
    customerName: "",
    customerPhone: "",
    costPrice: "",
    salePrice: "",
    quantity: "",
    creditDate: todayIso(),
    dueDate: "",
    expenses: [],
    note: "",
});

interface Props {
    open: boolean;
    editing: CreditSaleDetail | null;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (values: CreditSaleFormValues) => void;
}

export const CreditSaleForm = ({ open, editing, isSubmitting, onClose, onSubmit }: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const toast = useToast();
    const isDark = theme === "dark";

    const [values, setValues] = useState<CreditSaleFormValues>(emptyValues());
    const [selectedProductLabel, setSelectedProductLabel] = useState<string | null>(null);
    const [stock, setStock] = useState<number | null>(null);

    const isEdit = !!editing;
    const isExisting = values.productSource === "ExistingProduct";

    const expenseTypeLabel = (type: ExpenseType): string => {
        const map: Record<ExpenseType, string> = {
            Installation: t("creditSales.expense_type_installation"),
            Delivery: t("creditSales.expense_type_delivery"),
            Service: t("creditSales.expense_type_service"),
            Commission: t("creditSales.expense_type_commission"),
            Other: t("creditSales.expense_type_other"),
        };
        return map[type];
    };

    // Reset / hydrate when the modal opens or the edited record changes.
    useEffect(() => {
        if (!open) return;
        if (editing) {
            setValues({
                productSource: normalizeProductSource(editing.productSourceType),
                productId: editing.productId ?? "",
                productName: editing.productName ?? "",
                sku: editing.sku ?? "",
                categoryName: editing.categoryName ?? "",
                customerName: editing.customerName ?? "",
                customerPhone: editing.customerPhone ?? "",
                costPrice: editing.costPrice?.toString() ?? "",
                salePrice: editing.salePrice?.toString() ?? "",
                quantity: editing.quantity?.toString() ?? "",
                creditDate: editing.creditDate ? editing.creditDate.split("T")[0] : todayIso(),
                dueDate: editing.dueDate ? editing.dueDate.split("T")[0] : "",
                expenses: (editing.expenses ?? []).map((e) => ({
                    expenseType: e.expenseType,
                    description: e.description ?? "",
                    amount: e.amount.toString(),
                })),
                note: editing.note ?? "",
            });
            setSelectedProductLabel(
                normalizeProductSource(editing.productSourceType) === "ExistingProduct"
                    ? `${editing.productName}${editing.sku ? ` (${editing.sku})` : ""}`
                    : null
            );
            setStock(null);
        } else {
            setValues(emptyValues());
            setSelectedProductLabel(null);
            setStock(null);
        }
    }, [open, editing]);

    const patch = (p: Partial<CreditSaleFormValues>) => setValues((v) => ({ ...v, ...p }));

    const handleSelectProduct = (product: Product) => {
        setStock(product.stock);
        setSelectedProductLabel(`${product.name} (${product.sku})`);
        patch({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            categoryName: product.categoryName,
            salePrice: product.price?.toString() ?? "",
            // costPrice məhsul API-dən gəlmir — istifadəçi əl ilə daxil edir.
        });
    };

    const handleClearProduct = () => {
        setStock(null);
        setSelectedProductLabel(null);
        patch({ productId: "", productName: "", sku: "", categoryName: "", salePrice: "" });
    };

    const setSourceTab = (source: ProductSourceType) => {
        setSelectedProductLabel(null);
        setStock(null);
        setValues((v) => ({ ...emptyValues(), productSource: source, creditDate: v.creditDate }));
    };

    // Expense rows
    const addExpenseRow = () => patch({ expenses: [...values.expenses, emptyExpenseRow()] });
    const removeExpenseRow = (idx: number) => patch({ expenses: values.expenses.filter((_, i) => i !== idx) });
    const updateExpenseRow = (idx: number, field: keyof ExpenseRow, value: string) =>
        patch({ expenses: values.expenses.map((row, i) => (i === idx ? { ...row, [field]: value } : row)) });

    // Live preview
    const preview = useMemo(() => {
        const cost = Number(values.costPrice) || 0;
        const sale = Number(values.salePrice) || 0;
        const qty = Number(values.quantity) || 0;
        const exp = values.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const totalCost = cost * qty;
        const totalSale = sale * qty;
        const profit = totalSale - totalCost;
        const netProfit = profit - exp;
        return { totalCost, totalSale, expenses: exp, profit, netProfit };
    }, [values.costPrice, values.salePrice, values.quantity, values.expenses]);

    const durationDays = useMemo(() => {
        if (!values.creditDate || !values.dueDate) return null;
        const from = new Date(values.creditDate);
        const to = new Date(values.dueDate);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
        return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    }, [values.creditDate, values.dueDate]);

    const stockExceeded = stock !== null && values.quantity !== "" && Number(values.quantity) > stock;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEdit && isExisting && !values.productId) {
            toast.error(t("creditSales.err_product_required"));
            return;
        }
        if (!isEdit && !isExisting && !values.productName.trim()) {
            toast.error(t("creditSales.err_product_name_required"));
            return;
        }
        if (values.costPrice === "" || Number(values.costPrice) < 0) {
            toast.error(t("creditSales.err_cost_price_required"));
            return;
        }
        if (values.salePrice === "" || Number(values.salePrice) < 0) {
            toast.error(t("creditSales.err_sale_price_required"));
            return;
        }
        if (!values.quantity || Number(values.quantity) <= 0) {
            toast.error(t("creditSales.err_quantity_required"));
            return;
        }
        if (stockExceeded) {
            toast.error(t("creditSales.err_stock_exceeded", { count: stock ?? 0 }));
            return;
        }
        if (!values.creditDate) {
            toast.error(t("creditSales.err_credit_date_required"));
            return;
        }
        if (values.dueDate && durationDays !== null && durationDays < 0) {
            toast.error(t("creditSales.err_due_before_credit"));
            return;
        }
        for (const exp of values.expenses) {
            if (exp.expenseType === "") {
                toast.error(t("creditSales.err_expense_type_required"));
                return;
            }
            if (exp.amount === "" || Number(exp.amount) < 0) {
                toast.error(t("creditSales.err_expense_amount_invalid"));
                return;
            }
        }

        onSubmit(values);
    };

    const labelCls = cn("text-xs font-medium", isDark ? "text-neutral-400" : "text-neutral-500");
    const sectionCls = cn(
        "rounded-lg border p-3 space-y-3",
        isDark ? "border-neutral-700 bg-neutral-900/40" : "border-neutral-200 bg-neutral-50"
    );
    const sectionTitleCls = cn("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900");

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? t("creditSales.edit_title") : t("creditSales.add_title")}
            width="max-w-3xl"
            mobileFullScreen
            footer={
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit" form="credit-sale-form" variant="primary" loading={isSubmitting}>
                        {t("common.save")}
                    </Button>
                </div>
            }
        >
            <form id="credit-sale-form" onSubmit={handleSubmit} className="space-y-4">
                {/* A) Customer */}
                <div className={sectionCls}>
                    <p className={sectionTitleCls}>{t("creditSales.section_customer")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label={t("creditSales.customer_name")}
                            value={values.customerName}
                            onChange={(e) => patch({ customerName: e.target.value })}
                        />
                        <Input
                            label={t("creditSales.customer_phone")}
                            value={values.customerPhone}
                            onChange={(e) => patch({ customerPhone: e.target.value })}
                            placeholder="050 123 45 67"
                        />
                    </div>
                </div>

                {/* B) Product */}
                <div className={sectionCls}>
                    <p className={sectionTitleCls}>{t("creditSales.section_product")}</p>

                    {/* Source tabs — create only */}
                    {!isEdit && (
                        <div className={cn("flex rounded-lg p-1", isDark ? "bg-neutral-700" : "bg-neutral-100")}>
                            <button
                                type="button"
                                onClick={() => setSourceTab("ExistingProduct")}
                                className={cn(
                                    "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                                    isExisting ? "bg-primary-400 text-white shadow" : isDark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900"
                                )}
                            >
                                {t("creditSales.tab_existing")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceTab("ManualEntry")}
                                className={cn(
                                    "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                                    !isExisting ? "bg-primary-400 text-white shadow" : isDark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900"
                                )}
                            >
                                {t("creditSales.tab_manual")}
                            </button>
                        </div>
                    )}

                    {/* Existing product picker (create only) */}
                    {isExisting && !isEdit && (
                        <>
                            <ProductSearchSelect
                                label={t("creditSales.product")}
                                required
                                selectedLabel={selectedProductLabel}
                                onSelect={handleSelectProduct}
                                onClear={handleClearProduct}
                            />
                            {stock !== null && (
                                <p className={cn("text-xs", stockExceeded ? "text-red-500 font-medium" : isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("creditSales.in_stock", { count: stock })}
                                </p>
                            )}
                            {values.categoryName && (
                                <p className={labelCls}>{t("creditSales.category")}: {values.categoryName}</p>
                            )}
                        </>
                    )}

                    {/* Existing product edit — read-only snapshot */}
                    {isExisting && isEdit && (
                        <div className={cn("p-3 rounded-lg border space-y-1", isDark ? "bg-neutral-800 border-neutral-600" : "bg-white border-neutral-200")}>
                            <div className={cn("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>{values.productName}</div>
                            {values.sku && <div className={labelCls}>SKU: {values.sku}</div>}
                            {values.categoryName && <div className={labelCls}>{t("creditSales.category")}: {values.categoryName}</div>}
                            <p className={cn("text-xs pt-1", isDark ? "text-neutral-500" : "text-neutral-400")}>{t("creditSales.existing_locked_note")}</p>
                        </div>
                    )}

                    {/* Manual entry fields */}
                    {!isExisting && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label={t("creditSales.product_name")}
                                value={values.productName}
                                onChange={(e) => patch({ productName: e.target.value })}
                                required
                                disabled={isEdit}
                            />
                            <Input
                                label={t("creditSales.sku")}
                                value={values.sku}
                                onChange={(e) => patch({ sku: e.target.value })}
                                disabled={isEdit}
                            />
                        </div>
                    )}

                    {/* Prices + quantity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label={t("creditSales.cost_price")}
                            type="number"
                            step="0.01"
                            min="0"
                            value={values.costPrice}
                            onChange={(e) => patch({ costPrice: e.target.value })}
                            required
                        />
                        <Input
                            label={t("creditSales.sale_price")}
                            type="number"
                            step="0.01"
                            min="0"
                            value={values.salePrice}
                            onChange={(e) => patch({ salePrice: e.target.value })}
                            required
                        />
                        <Input
                            label={t("creditSales.quantity")}
                            type="number"
                            min="1"
                            step="1"
                            value={values.quantity}
                            onChange={(e) => patch({ quantity: e.target.value })}
                            required
                            error={stockExceeded ? t("creditSales.err_stock_exceeded", { count: stock ?? 0 }) : undefined}
                        />
                    </div>
                </div>

                {/* C) Credit info */}
                <div className={sectionCls}>
                    <p className={sectionTitleCls}>{t("creditSales.section_credit")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DateInput
                            label={t("creditSales.credit_date")}
                            value={values.creditDate}
                            onChange={(v) => patch({ creditDate: v })}
                            required
                        />
                        <div>
                            <DateInput
                                label={t("creditSales.due_date")}
                                value={values.dueDate}
                                onChange={(v) => patch({ dueDate: v })}
                            />
                            {durationDays !== null && durationDays >= 0 && (
                                <p className={cn("text-xs mt-1", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("creditSales.duration_days", { count: durationDays })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Expenses (dynamic rows, Sales pattern) */}
                    <div className={cn("rounded-lg border p-3 space-y-3", isDark ? "border-neutral-600 bg-neutral-900/40" : "border-neutral-200 bg-white")}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className={cn("text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                                    {t("creditSales.expenses")}
                                </span>
                                <p className={cn("text-xs mt-0.5", isDark ? "text-neutral-400" : "text-neutral-500")}>
                                    {t("creditSales.profit_formula")}
                                </p>
                            </div>
                            <Button type="button" variant="outline" icon={<Plus size={14} />} onClick={addExpenseRow} className="w-full sm:w-auto shrink-0">
                                {t("creditSales.add_expense")}
                            </Button>
                        </div>

                        {values.expenses.length === 0 ? (
                            <p className={cn("text-xs text-center py-2", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                {t("creditSales.no_expenses")}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {values.expenses.map((row, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                        <div className="w-full sm:w-40 sm:flex-shrink-0">
                                            <Select
                                                options={EXPENSE_TYPES.map((type) => ({ label: expenseTypeLabel(type), value: type }))}
                                                value={row.expenseType}
                                                onChange={(e) => updateExpenseRow(idx, "expenseType", e.target.value)}
                                                placeholder={t("creditSales.expense_type")}
                                            />
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-28 flex-1 sm:flex-none sm:flex-shrink-0">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder={t("creditSales.expense_amount")}
                                                    value={row.amount}
                                                    onChange={(e) => updateExpenseRow(idx, "amount", e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeExpenseRow(idx)}
                                                className={cn("mt-1 p-1.5 rounded transition-colors flex-shrink-0 sm:hidden", isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-500")}
                                                title={t("creditSales.remove_expense")}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="w-full sm:flex-1">
                                            <Input
                                                placeholder={t("creditSales.expense_description")}
                                                value={row.description}
                                                maxLength={1000}
                                                onChange={(e) => updateExpenseRow(idx, "description", e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExpenseRow(idx)}
                                            className={cn("mt-1 p-1.5 rounded transition-colors flex-shrink-0 hidden sm:block", isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-500")}
                                            title={t("creditSales.remove_expense")}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Textarea
                        label={t("creditSales.note")}
                        value={values.note}
                        onChange={(e) => patch({ note: e.target.value })}
                        rows={2}
                    />
                </div>

                {/* D) Live preview */}
                <div className={cn("rounded-lg border p-4", isDark ? "border-primary-500/30 bg-primary-500/5" : "border-primary-100 bg-primary-50/50")}>
                    <p className={cn("text-sm font-semibold mb-3", isDark ? "text-white" : "text-neutral-900")}>
                        {t("creditSales.preview_title")}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            { label: t("creditSales.preview_total_cost"), value: formatCurrency(preview.totalCost) },
                            { label: t("creditSales.preview_total_sale"), value: formatCurrency(preview.totalSale) },
                            { label: t("creditSales.expenses"), value: formatCurrency(preview.expenses) },
                            { label: t("creditSales.preview_profit"), value: `${preview.profit >= 0 ? "+" : ""}${formatCurrency(preview.profit)}`, cls: getProfitColor(preview.profit) },
                            { label: t("creditSales.preview_net_income"), value: `${preview.netProfit >= 0 ? "+" : ""}${formatCurrency(preview.netProfit)}`, cls: getProfitColor(preview.netProfit) },
                        ].map((cell) => (
                            <div key={cell.label}>
                                <p className={labelCls}>{cell.label}</p>
                                <p className={cn("text-sm font-semibold tabular-nums mt-0.5", cell.cls ?? (isDark ? "text-white" : "text-neutral-900"))}>
                                    {cell.value}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className={cn("text-[11px] mt-3", isDark ? "text-neutral-500" : "text-neutral-400")}>
                        {t("creditSales.preview_note")}
                    </p>
                </div>
            </form>
        </Modal>
    );
};
