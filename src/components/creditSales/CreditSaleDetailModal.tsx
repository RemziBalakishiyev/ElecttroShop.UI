import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { Modal } from "../commons/Modal";
import { Button } from "../commons/Button";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { formatCurrency, formatReportDate, formatPhone, getProfitColor } from "../../utils/reportFormat";
import { CreditSaleStatusBadge } from "./CreditSaleStatusBadge";
import { effectiveStatus } from "./creditSaleHelpers";
import { normalizeProductSource, type CreditSaleDetail, type ExpenseType } from "../../core/api/creditSales.api";

const expenseTypeLabel = (type: ExpenseType, t: (k: string) => string): string => {
    const map: Record<ExpenseType, string> = {
        Installation: t("creditSales.expense_type_installation"),
        Delivery: t("creditSales.expense_type_delivery"),
        Service: t("creditSales.expense_type_service"),
        Commission: t("creditSales.expense_type_commission"),
        Other: t("creditSales.expense_type_other"),
    };
    return map[type];
};

interface Props {
    open: boolean;
    item: CreditSaleDetail | null;
    isLoading?: boolean;
    onClose: () => void;
    onViewSale?: (saleId: string) => void;
}

const Row = ({ label, value, valueCls, isDark }: { label: string; value: React.ReactNode; valueCls?: string; isDark: boolean }) => (
    <div className="flex items-center justify-between gap-3 py-1.5">
        <span className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{label}</span>
        <span className={cn("text-sm font-medium text-right", valueCls ?? (isDark ? "text-white" : "text-neutral-900"))}>{value}</span>
    </div>
);

export const CreditSaleDetailModal = ({ open, item, isLoading, onClose, onViewSale }: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const sectionTitle = cn("text-xs font-semibold uppercase tracking-wide mb-1", isDark ? "text-neutral-400" : "text-neutral-500");
    const dividerCls = cn("border-t my-2", isDark ? "border-neutral-700" : "border-neutral-200");

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t("creditSales.detail_title")}
            width="max-w-lg"
            mobileFullScreen
            footer={
                <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("common.close")}
                    </Button>
                </div>
            }
        >
            {isLoading || !item ? (
                <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={cn("h-4 rounded animate-pulse", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className={cn("text-base font-semibold", isDark ? "text-white" : "text-neutral-900")}>{item.customerName || "—"}</p>
                            <p className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>{formatPhone(item.customerPhone)}</p>
                        </div>
                        <CreditSaleStatusBadge status={effectiveStatus(item)} />
                    </div>

                    <div className={dividerCls} />

                    <div>
                        <p className={sectionTitle}>{t("creditSales.section_product")}</p>
                        <Row label={t("creditSales.product_name")} value={item.productName} isDark={isDark} />
                        {item.sku && <Row label={t("creditSales.sku")} value={item.sku} isDark={isDark} />}
                        {item.categoryName && <Row label={t("creditSales.category")} value={item.categoryName} isDark={isDark} />}
                        <Row
                            label={t("creditSales.sale_source")}
                            value={normalizeProductSource(item.productSourceType) === "ExistingProduct" ? t("creditSales.source_existing") : t("creditSales.source_manual")}
                            isDark={isDark}
                        />
                    </div>

                    <div className={dividerCls} />

                    <div>
                        <p className={sectionTitle}>{t("creditSales.section_prices")}</p>
                        <Row label={t("creditSales.cost_price")} value={formatCurrency(item.costPrice)} isDark={isDark} />
                        <Row label={t("creditSales.sale_price")} value={formatCurrency(item.salePrice)} isDark={isDark} />
                        <Row label={t("creditSales.col_quantity")} value={item.quantity} isDark={isDark} />
                        <Row label={t("creditSales.preview_total_cost")} value={formatCurrency(item.totalCost)} isDark={isDark} />
                        <Row label={t("creditSales.col_total_sale")} value={formatCurrency(item.totalSaleAmount)} isDark={isDark} />
                        <Row label={t("creditSales.expenses")} value={formatCurrency(item.totalExpenses)} isDark={isDark} />
                        <Row
                            label={t("creditSales.col_net_profit")}
                            value={`${item.netProfit >= 0 ? "+" : ""}${formatCurrency(item.netProfit)}`}
                            valueCls={getProfitColor(item.netProfit)}
                            isDark={isDark}
                        />
                    </div>

                    {item.expenses && item.expenses.length > 0 && (
                        <>
                            <div className={dividerCls} />
                            <div>
                                <p className={sectionTitle}>{t("creditSales.expenses")}</p>
                                <div className="space-y-1.5">
                                    {item.expenses.map((exp) => (
                                        <div key={exp.id} className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <span className={cn("text-sm", isDark ? "text-neutral-200" : "text-neutral-800")}>
                                                    {expenseTypeLabel(exp.expenseType, t)}
                                                </span>
                                                {exp.description && (
                                                    <span className={cn("text-xs ml-2", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                        {exp.description}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cn("text-sm font-medium tabular-nums shrink-0", isDark ? "text-white" : "text-neutral-900")}>
                                                {formatCurrency(exp.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className={dividerCls} />

                    <div>
                        <p className={sectionTitle}>{t("creditSales.section_credit")}</p>
                        <Row label={t("creditSales.credit_date")} value={formatReportDate(item.creditDate)} isDark={isDark} />
                        <Row label={t("creditSales.due_date")} value={formatReportDate(item.dueDate)} isDark={isDark} />
                        {item.convertedAt && (
                            <Row label={t("creditSales.converted_at")} value={formatReportDate(item.convertedAt)} isDark={isDark} />
                        )}
                    </div>

                    {item.note && (
                        <>
                            <div className={dividerCls} />
                            <div>
                                <p className={sectionTitle}>{t("creditSales.note")}</p>
                                <p className={cn("text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>{item.note}</p>
                            </div>
                        </>
                    )}

                    {item.convertedSaleId && onViewSale && (
                        <Button
                            type="button"
                            variant="secondary"
                            icon={<ExternalLink size={16} />}
                            onClick={() => onViewSale(item.convertedSaleId as string)}
                            className="w-full"
                        >
                            {t("creditSales.view_sale")}
                        </Button>
                    )}
                </div>
            )}
        </Modal>
    );
};
