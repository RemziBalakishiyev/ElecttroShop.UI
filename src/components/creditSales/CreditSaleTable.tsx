import { Eye, Edit, CheckCircle2, Ban, Plus, Wallet, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { Button } from "../commons/Button";
import { formatCurrency, formatReportDate, formatPhone, getProfitColor } from "../../utils/reportFormat";
import { CreditSaleStatusBadge } from "./CreditSaleStatusBadge";
import {
    effectiveStatus,
    isActionable,
    isOverdue,
    isDueSoon,
    daysUntilDue,
} from "./creditSaleHelpers";
import { normalizeProductSource, type CreditSaleListItem } from "../../core/api/creditSales.api";

interface Props {
    items: CreditSaleListItem[];
    isLoading: boolean;
    onDetail: (item: CreditSaleListItem) => void;
    onEdit: (item: CreditSaleListItem) => void;
    onMarkSold: (item: CreditSaleListItem) => void;
    onCancel: (item: CreditSaleListItem) => void;
    onAddNew: () => void;
}

const SourceBadge = ({ item, isDark }: { item: CreditSaleListItem; isDark: boolean }) => {
    const { t } = useTranslation();
    const isExisting = normalizeProductSource(item.productSourceType) === "ExistingProduct";
    return (
        <span
            className={cn(
                "inline-flex px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap",
                isExisting
                    ? isDark ? "bg-primary-500/10 text-primary-400 border-primary-500/20" : "bg-primary-50 text-primary-600 border-primary-100"
                    : isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-100"
            )}
        >
            {isExisting ? t("creditSales.source_existing") : t("creditSales.source_manual")}
        </span>
    );
};

const DueDateCell = ({ item, isDark }: { item: CreditSaleListItem; isDark: boolean }) => {
    const { t } = useTranslation();
    const overdue = isOverdue(item);
    const soon = isDueSoon(item);
    const days = daysUntilDue(item.dueDate);
    return (
        <div className="flex flex-col">
            <span
                className={cn(
                    "text-sm whitespace-nowrap tabular-nums",
                    overdue ? "text-red-600 font-semibold" : isDark ? "text-neutral-300" : "text-neutral-700"
                )}
            >
                {formatReportDate(item.dueDate)}
            </span>
            {overdue && days !== null && (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium">
                    <Clock size={11} />
                    {t("creditSales.overdue_days", { count: Math.abs(days) })}
                </span>
            )}
            {!overdue && soon && days !== null && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                    <Clock size={11} />
                    {t("creditSales.due_in_days", { count: days })}
                </span>
            )}
        </div>
    );
};

const RowActions = ({
    item,
    isDark,
    onDetail,
    onEdit,
    onMarkSold,
    onCancel,
}: {
    item: CreditSaleListItem;
    isDark: boolean;
} & Pick<Props, "onDetail" | "onEdit" | "onMarkSold" | "onCancel">) => {
    const { t } = useTranslation();
    const actionable = isActionable(item);

    return (
        <div className="flex items-center gap-1">
            <button
                className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isDark ? "hover:bg-neutral-700 text-neutral-400 hover:text-white" : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                )}
                onClick={() => onDetail(item)}
                title={t("creditSales.action_detail")}
            >
                <Eye size={16} />
            </button>

            {actionable && (
                <>
                    <button
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isDark ? "hover:bg-neutral-700 text-neutral-400 hover:text-white" : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                        )}
                        onClick={() => onEdit(item)}
                        title={t("creditSales.action_edit")}
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className={cn(
                            "inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            isDark ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-green-50 text-green-700 hover:bg-green-100"
                        )}
                        onClick={() => onMarkSold(item)}
                        title={t("creditSales.action_mark_sold")}
                    >
                        <CheckCircle2 size={15} />
                        <span className="hidden lg:inline">{t("creditSales.action_mark_sold")}</span>
                    </button>
                    <button
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-600"
                        )}
                        onClick={() => onCancel(item)}
                        title={t("creditSales.action_cancel")}
                    >
                        <Ban size={16} />
                    </button>
                </>
            )}
        </div>
    );
};

const COLS = 12;

export const CreditSaleTable = ({
    items,
    isLoading,
    onDetail,
    onEdit,
    onMarkSold,
    onCancel,
    onAddNew,
}: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const rowTint = (item: CreditSaleListItem) =>
        isOverdue(item)
            ? isDark ? "bg-red-900/10" : "bg-red-50/60"
            : "";

    const EmptyState = () => (
        <div className="flex flex-col items-center gap-3 py-4">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", isDark ? "bg-neutral-900" : "bg-neutral-100")}>
                <Wallet size={24} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
            </div>
            <p className={cn("text-sm font-medium", isDark ? "text-neutral-300" : "text-neutral-600")}>
                {t("creditSales.empty_title")}
            </p>
            <p className={cn("text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>
                {t("creditSales.empty_subtitle")}
            </p>
            <Button variant="primary" icon={<Plus size={16} />} onClick={onAddNew}>
                {t("creditSales.add")}
            </Button>
        </div>
    );

    return (
        <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[1400px] text-sm">
                    <thead className={cn("border-b", isDark ? "bg-neutral-900 border-neutral-700" : "bg-neutral-50 border-neutral-200")}>
                        <tr>
                            {[
                                { key: "customer", label: t("creditSales.col_customer"), align: "left", sticky: true, w: "min-w-[180px]" },
                                { key: "product", label: t("creditSales.col_product"), align: "left", w: "min-w-[200px]" },
                                { key: "quantity", label: t("creditSales.col_quantity"), align: "right", w: "min-w-[90px]" },
                                { key: "costPrice", label: t("creditSales.col_cost_price"), align: "right", w: "min-w-[110px]" },
                                { key: "salePrice", label: t("creditSales.col_sale_price"), align: "right", w: "min-w-[110px]" },
                                { key: "totalSale", label: t("creditSales.col_total_sale"), align: "right", w: "min-w-[130px]" },
                                { key: "expenses", label: t("creditSales.col_expenses"), align: "right", w: "min-w-[110px]" },
                                { key: "netProfit", label: t("creditSales.col_net_profit"), align: "right", w: "min-w-[120px]" },
                                { key: "creditDate", label: t("creditSales.col_credit_date"), align: "left", w: "min-w-[110px]" },
                                { key: "dueDate", label: t("creditSales.col_due_date"), align: "left", w: "min-w-[120px]" },
                                { key: "status", label: t("common.status"), align: "left", w: "min-w-[110px]" },
                                { key: "actions", label: t("common.actions"), align: "left", w: "min-w-[160px]" },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap",
                                        col.align === "right" ? "text-right" : "text-left",
                                        col.w,
                                        col.sticky && "sticky left-0 z-10",
                                        col.sticky ? (isDark ? "bg-neutral-900" : "bg-neutral-50") : "",
                                        isDark ? "text-neutral-300" : "text-neutral-600"
                                    )}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-neutral-800" : "divide-neutral-200")}>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, rowIdx) => (
                                <tr key={rowIdx}>
                                    {Array.from({ length: COLS }).map((_, colIdx) => (
                                        <td key={colIdx} className="px-4 py-4">
                                            <div className={cn("h-3 rounded animate-pulse", colIdx === 0 ? "w-32" : "w-16", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={COLS} className="px-4 py-16 text-center">
                                    <EmptyState />
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className={cn("group/row transition-colors", rowTint(item), isDark ? "hover:bg-neutral-800/60" : "hover:bg-neutral-50")}>
                                    {/* Customer */}
                                    <td className={cn("sticky left-0 z-10 px-4 py-3", isDark ? "bg-neutral-800 group-hover/row:bg-neutral-800/60" : "bg-white group-hover/row:bg-neutral-50", isOverdue(item) && (isDark ? "!bg-red-900/10" : "!bg-red-50/60"))}>
                                        <div className="min-w-[160px]">
                                            <div className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-neutral-900")}>
                                                {item.customerName || "—"}
                                            </div>
                                            <div className={cn("text-[11px] mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                {formatPhone(item.customerPhone)}
                                            </div>
                                        </div>
                                    </td>
                                    {/* Product */}
                                    <td className="px-4 py-3">
                                        <div className="min-w-0">
                                            <div className={cn("text-sm truncate", isDark ? "text-neutral-200" : "text-neutral-800")}>
                                                {item.productName}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {item.sku && (
                                                    <span className={cn("text-[11px] font-mono", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                        {item.sku}
                                                    </span>
                                                )}
                                                <SourceBadge item={item} isDark={isDark} />
                                            </div>
                                        </div>
                                    </td>
                                    {/* Quantity */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn("text-sm tabular-nums", isDark ? "text-neutral-300" : "text-neutral-700")}>{item.quantity}</span>
                                    </td>
                                    {/* Cost price */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn("text-sm tabular-nums whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-700")}>{formatCurrency(item.costPrice)}</span>
                                    </td>
                                    {/* Sale price */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn("text-sm tabular-nums whitespace-nowrap", isDark ? "text-white" : "text-neutral-900")}>{formatCurrency(item.salePrice)}</span>
                                    </td>
                                    {/* Total sale */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn("text-sm font-medium tabular-nums whitespace-nowrap", isDark ? "text-white" : "text-neutral-900")}>{formatCurrency(item.totalSaleAmount)}</span>
                                    </td>
                                    {/* Expenses */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn("text-sm tabular-nums whitespace-nowrap", isDark ? "text-neutral-300" : "text-neutral-700")}>{formatCurrency(item.totalExpenses)}</span>
                                    </td>
                                    {/* Net profit */}
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn("text-sm font-semibold tabular-nums whitespace-nowrap", getProfitColor(item.netProfit))}>
                                            {`${item.netProfit >= 0 ? "+" : ""}${formatCurrency(item.netProfit)}`}
                                        </span>
                                    </td>
                                    {/* Credit date */}
                                    <td className="px-4 py-3">
                                        <span className={cn("text-sm whitespace-nowrap tabular-nums", isDark ? "text-neutral-400" : "text-neutral-600")}>{formatReportDate(item.creditDate)}</span>
                                    </td>
                                    {/* Due date */}
                                    <td className="px-4 py-3">
                                        <DueDateCell item={item} isDark={isDark} />
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <CreditSaleStatusBadge status={effectiveStatus(item)} />
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <RowActions item={item} isDark={isDark} onDetail={onDetail} onEdit={onEdit} onMarkSold={onMarkSold} onCancel={onCancel} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
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
                ) : items.length === 0 ? (
                    <div className="px-4 py-16 text-center">
                        <EmptyState />
                    </div>
                ) : (
                    <div className={cn("divide-y", isDark ? "divide-neutral-800" : "divide-neutral-200")}>
                        {items.map((item) => (
                            <div key={item.id} className={cn("p-4 space-y-3", rowTint(item))}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className={cn("text-sm font-semibold truncate", isDark ? "text-white" : "text-neutral-900")}>
                                            {item.customerName || "—"}
                                        </div>
                                        <div className={cn("text-[11px] mt-0.5", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                            {formatPhone(item.customerPhone)}
                                        </div>
                                    </div>
                                    <CreditSaleStatusBadge status={effectiveStatus(item)} />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn("text-sm truncate", isDark ? "text-neutral-200" : "text-neutral-800")}>{item.productName}</span>
                                    {item.sku && <span className={cn("text-[11px] font-mono", isDark ? "text-neutral-500" : "text-neutral-400")}>{item.sku}</span>}
                                    <SourceBadge item={item} isDark={isDark} />
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("creditSales.col_quantity")}</span>
                                        <span className={cn("text-sm tabular-nums", isDark ? "text-neutral-300" : "text-neutral-700")}>{item.quantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("creditSales.col_total_sale")}</span>
                                        <span className={cn("text-sm font-medium tabular-nums", isDark ? "text-white" : "text-neutral-900")}>{formatCurrency(item.totalSaleAmount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("creditSales.col_expenses")}</span>
                                        <span className={cn("text-sm tabular-nums", isDark ? "text-neutral-300" : "text-neutral-700")}>{formatCurrency(item.totalExpenses)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{t("creditSales.col_net_profit")}</span>
                                        <span className={cn("text-sm font-semibold tabular-nums", getProfitColor(item.netProfit))}>
                                            {`${item.netProfit >= 0 ? "+" : ""}${formatCurrency(item.netProfit)}`}
                                        </span>
                                    </div>
                                </div>

                                <div className={cn("flex items-center justify-between gap-2 pt-2 border-t", isDark ? "border-neutral-800" : "border-neutral-100")}>
                                    <div className="flex flex-col">
                                        <span className={cn("text-[11px]", isDark ? "text-neutral-500" : "text-neutral-400")}>{t("creditSales.col_due_date")}</span>
                                        <DueDateCell item={item} isDark={isDark} />
                                    </div>
                                    <RowActions item={item} isDark={isDark} onDetail={onDetail} onEdit={onEdit} onMarkSold={onMarkSold} onCancel={onCancel} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
