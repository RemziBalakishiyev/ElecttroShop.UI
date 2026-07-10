import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { getStatusBadgeVariant } from "../../utils/reportFormat";
import { STATUS_TINTS } from "./creditSaleHelpers";
import type { CreditSaleStatus } from "../../core/api/creditSales.api";

const STATUS_LABEL_KEY: Record<CreditSaleStatus, string> = {
    Pending: "creditSales.status_pending",
    Overdue: "creditSales.status_overdue",
    Sold: "creditSales.status_sold",
    Cancelled: "creditSales.status_cancelled",
};

export const CreditSaleStatusBadge = ({ status }: { status: CreditSaleStatus }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const variant = getStatusBadgeVariant(status);
    const tint = STATUS_TINTS[variant];

    return (
        <span
            className={cn(
                "inline-flex px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                isDark ? tint.dark : tint.light
            )}
        >
            {t(STATUS_LABEL_KEY[status])}
        </span>
    );
};
