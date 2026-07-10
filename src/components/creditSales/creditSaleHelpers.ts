import type {
    CreditSaleListItem,
    CreditSaleStatus,
    ProductSourceType,
} from "../../core/api/creditSales.api";
import { getStatusBadgeVariant, type StatusBadgeVariant } from "../../utils/reportFormat";

export const todayIso = () => new Date().toISOString().split("T")[0];

export interface CreditSaleFilterState {
    search: string;
    status: CreditSaleStatus | "";
    productSource: ProductSourceType | "";
    creditDateFrom: string;
    creditDateTo: string;
    dueDateFrom: string;
    dueDateTo: string;
}

export const emptyCreditSaleFilters = (): CreditSaleFilterState => ({
    search: "",
    status: "",
    productSource: "",
    creditDateFrom: "",
    creditDateTo: "",
    dueDateFrom: "",
    dueDateTo: "",
});

/** Verilmiş tarixə (dueDate) qədər qalan gün sayı. Keçmiş üçün mənfi. */
export function daysUntilDue(dueDate: string | null | undefined): number | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Nisyə açıqdırsa (Pending/Overdue) və borcun son tarixi keçibsə `true`.
 * Backend statusu yalnız "Pending" qaytarsa belə, UI-da vaxtı keçmiş kimi işarələnir.
 */
export function isOverdue(item: CreditSaleListItem): boolean {
    if (item.status === "Sold" || item.status === "Cancelled") return false;
    if (item.status === "Overdue") return true;
    const days = daysUntilDue(item.dueDate);
    return days !== null && days < 0;
}

/** Borc son tarixi yaxınlaşırsa (0-3 gün qalıb, hələ keçməyib). */
export function isDueSoon(item: CreditSaleListItem): boolean {
    if (item.status === "Sold" || item.status === "Cancelled") return false;
    const days = daysUntilDue(item.dueDate);
    return days !== null && days >= 0 && days <= 3;
}

/** Backend statusu Pending olsa da, vaxtı keçibsə effektiv status "Overdue". */
export function effectiveStatus(item: CreditSaleListItem): CreditSaleStatus {
    if (item.status === "Pending" && isOverdue(item)) return "Overdue";
    return item.status;
}

/** Status üzərində redaktə/satıldı/ləğv əməliyyatları icazəlidir (Pending/Overdue). */
export function isActionable(item: CreditSaleListItem): boolean {
    const s = effectiveStatus(item);
    return s === "Pending" || s === "Overdue";
}

export const STATUS_TINTS: Record<StatusBadgeVariant, { light: string; dark: string }> = {
    open: { light: "bg-blue-50 text-blue-700 border-blue-100", dark: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    overdue: { light: "bg-red-50 text-red-700 border-red-100", dark: "bg-red-500/10 text-red-400 border-red-500/20" },
    sold: { light: "bg-green-50 text-green-700 border-green-100", dark: "bg-green-500/10 text-green-400 border-green-500/20" },
    cancelled: { light: "bg-neutral-100 text-neutral-500 border-neutral-200", dark: "bg-neutral-700/40 text-neutral-400 border-neutral-600" },
    neutral: { light: "bg-neutral-100 text-neutral-600 border-neutral-200", dark: "bg-neutral-700/40 text-neutral-300 border-neutral-600" },
};

export { getStatusBadgeVariant };
