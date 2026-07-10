import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "../commons/Modal";
import { Button } from "../commons/Button";
import { DateInput } from "../commons/DateInput";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { formatCurrency, formatReportDate, getProfitColor } from "../../utils/reportFormat";
import { todayIso } from "./creditSaleHelpers";
import type { CreditSaleListItem } from "../../core/api/creditSales.api";

interface Props {
    open: boolean;
    item: CreditSaleListItem | null;
    isLoading: boolean;
    onConfirm: (soldAt: string) => void;
    onCancel: () => void;
}

export const ConfirmMarkAsSoldModal = ({ open, item, isLoading, onConfirm, onCancel }: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [soldAt, setSoldAt] = useState(todayIso());

    useEffect(() => {
        if (open) setSoldAt(todayIso());
    }, [open]);

    const Row = ({ label, value, valueCls }: { label: string; value: React.ReactNode; valueCls?: string }) => (
        <div className="flex items-center justify-between gap-3 py-1">
            <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{label}</span>
            <span className={cn("text-sm font-medium text-right", valueCls ?? (isDark ? "text-white" : "text-neutral-900"))}>{value}</span>
        </div>
    );

    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={t("creditSales.mark_sold_title")}
            width="max-w-md"
            footer={
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        icon={<CheckCircle2 size={18} />}
                        loading={isLoading}
                        onClick={() => onConfirm(soldAt)}
                    >
                        {t("creditSales.mark_sold_confirm")}
                    </Button>
                </div>
            }
        >
            {item && (
                <div className="space-y-4">
                    <p className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-600")}>
                        {t("creditSales.mark_sold_message")}
                    </p>

                    <div className={cn("rounded-lg border p-3", isDark ? "border-neutral-700 bg-neutral-900/40" : "border-neutral-200 bg-neutral-50")}>
                        <Row label={t("creditSales.customer_name")} value={item.customerName} />
                        <Row label={t("creditSales.product_name")} value={item.productName} />
                        <Row label={t("creditSales.col_total_sale")} value={formatCurrency(item.totalSaleAmount)} />
                        <Row
                            label={t("creditSales.col_net_profit")}
                            value={`${item.netProfit >= 0 ? "+" : ""}${formatCurrency(item.netProfit)}`}
                            valueCls={getProfitColor(item.netProfit)}
                        />
                        <Row label={t("creditSales.due_date")} value={formatReportDate(item.dueDate)} />
                    </div>

                    <DateInput
                        label={t("creditSales.payment_date")}
                        value={soldAt}
                        onChange={setSoldAt}
                        required
                    />
                </div>
            )}
        </Modal>
    );
};
