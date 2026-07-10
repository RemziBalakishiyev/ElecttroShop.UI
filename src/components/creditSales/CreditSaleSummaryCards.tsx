import {
    Wallet,
    AlertTriangle,
    Banknote,
    TrendingUp,
    CheckCircle2,
    Coins,
    type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/reportFormat";
import type { CreditSaleSummary } from "../../core/api/creditSales.api";

const TINTS: Record<string, { light: string; dark: string }> = {
    blue: { light: "bg-blue-50 text-blue-600", dark: "bg-blue-500/10 text-blue-400" },
    red: { light: "bg-red-50 text-red-600", dark: "bg-red-500/10 text-red-400" },
    amber: { light: "bg-amber-50 text-amber-600", dark: "bg-amber-500/10 text-amber-400" },
    violet: { light: "bg-violet-50 text-violet-600", dark: "bg-violet-500/10 text-violet-400" },
    green: { light: "bg-green-50 text-green-600", dark: "bg-green-500/10 text-green-400" },
    teal: { light: "bg-teal-50 text-teal-600", dark: "bg-teal-500/10 text-teal-400" },
};

interface CardDef {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    tint: keyof typeof TINTS;
    highlight?: boolean;
}

const StatCard = ({
    def,
    isDark,
    isLoading,
}: {
    def: CardDef;
    isDark: boolean;
    isLoading: boolean;
}) => (
    <div
        className={cn(
            "rounded-xl border shadow-sm p-5 transition-all hover:shadow-md",
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-100",
            def.highlight && (isDark ? "ring-1 ring-red-500/40" : "ring-1 ring-red-300")
        )}
    >
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className={cn("text-xs font-medium truncate", isDark ? "text-neutral-400" : "text-neutral-500")}>
                    {def.title}
                </p>
                {isLoading ? (
                    <div className={cn("h-7 w-28 rounded mt-2 animate-pulse", isDark ? "bg-neutral-700" : "bg-neutral-200")} />
                ) : (
                    <h3
                        className={cn(
                            "text-xl font-bold mt-2 tracking-tight tabular-nums break-words",
                            def.highlight ? "text-red-600" : isDark ? "text-white" : "text-neutral-900"
                        )}
                    >
                        {def.value}
                    </h3>
                )}
                {def.subtitle && !isLoading && (
                    <p className={cn("text-xs mt-1 truncate", isDark ? "text-neutral-500" : "text-neutral-400")}>
                        {def.subtitle}
                    </p>
                )}
            </div>
            <div className={cn("p-2.5 rounded-xl shrink-0", isDark ? TINTS[def.tint].dark : TINTS[def.tint].light)}>
                <def.icon size={20} />
            </div>
        </div>
    </div>
);

interface Props {
    summary: CreditSaleSummary | null | undefined;
    isLoading: boolean;
}

export const CreditSaleSummaryCards = ({ summary, isLoading }: Props) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const s = summary;
    const overdueCount = s?.overdueCount ?? 0;

    const cards: CardDef[] = [
        {
            title: t("creditSales.summary_open"),
            value: formatCurrency(s?.openAmount ?? 0),
            subtitle: t("creditSales.summary_open_count", { count: s?.openCount ?? 0 }),
            icon: Wallet,
            tint: "blue",
        },
        {
            title: t("creditSales.summary_overdue"),
            value: formatCurrency(s?.overdueAmount ?? 0),
            subtitle: t("creditSales.summary_overdue_count", { count: overdueCount }),
            icon: AlertTriangle,
            tint: "red",
            highlight: overdueCount > 0,
        },
        {
            title: t("creditSales.summary_total_debt"),
            value: formatCurrency(s?.totalDebtAmount ?? 0),
            icon: Banknote,
            tint: "amber",
        },
        {
            title: t("creditSales.summary_expected_profit"),
            value: formatCurrency(s?.expectedProfit ?? 0),
            icon: TrendingUp,
            tint: "violet",
        },
        {
            title: t("creditSales.summary_sold_this_month"),
            value: formatCurrency(s?.soldThisMonthAmount ?? 0),
            subtitle: t("creditSales.summary_sold_count", { count: s?.soldThisMonthCount ?? 0 }),
            icon: CheckCircle2,
            tint: "green",
        },
        {
            title: t("creditSales.summary_net_income"),
            value: formatCurrency(s?.netIncome ?? 0),
            icon: Coins,
            tint: "teal",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            {cards.map((def) => (
                <StatCard key={def.title} def={def} isDark={isDark} isLoading={isLoading} />
            ))}
        </div>
    );
};
