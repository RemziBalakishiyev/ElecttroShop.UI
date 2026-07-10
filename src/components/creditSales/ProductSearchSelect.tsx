import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, X, Package } from "lucide-react";
import { productsApi } from "../../core/api/products.api";
import type { Product } from "../../core/api/products.api";
import { useTheme } from "../../core/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/reportFormat";

interface ProductSearchSelectProps {
    label?: string;
    required?: boolean;
    /** Seçilmiş məhsulun görünən adı (varsa çip kimi göstərilir). */
    selectedLabel?: string | null;
    onSelect: (product: Product) => void;
    onClear?: () => void;
    disabled?: boolean;
}

/**
 * Axtarışa əsaslanan məhsul seçimi. Backend `/Products/search` endpointini
 * (productsApi.searchProducts) istifadə edir. Layihədə hazır searchable
 * komponent olmadığı üçün burada qurulub.
 */
export const ProductSearchSelect = ({
    label,
    required,
    selectedLabel,
    onSelect,
    onClear,
    disabled,
}: ProductSearchSelectProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const isDark = theme === "dark";

    const [term, setTerm] = useState("");
    const [debounced, setDebounced] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce
    useEffect(() => {
        const id = setTimeout(() => setDebounced(term.trim()), 350);
        return () => clearTimeout(id);
    }, [term]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const { data, isFetching } = useQuery({
        queryKey: ["products-search", debounced],
        queryFn: () => productsApi.searchProducts(debounced, 1, 20),
        enabled: open && debounced.length >= 2,
        staleTime: 30 * 1000,
    });

    const results = data?.value ?? [];

    const handleSelect = (product: Product) => {
        onSelect(product);
        setTerm("");
        setDebounced("");
        setOpen(false);
    };

    return (
        <div className="flex flex-col gap-1 w-full" ref={containerRef}>
            {label && (
                <label className={cn("text-sm font-medium", isDark ? "text-neutral-300" : "text-neutral-700")}>
                    {label}
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            {/* Selected chip */}
            {selectedLabel ? (
                <div
                    className={cn(
                        "flex items-center justify-between gap-2 border rounded-lg px-3 py-2 text-sm",
                        isDark ? "border-neutral-700 bg-neutral-800 text-white" : "border-neutral-300 bg-white text-neutral-900"
                    )}
                >
                    <span className="flex items-center gap-2 min-w-0">
                        <Package size={16} className={isDark ? "text-primary-400" : "text-primary-600"} />
                        <span className="truncate">{selectedLabel}</span>
                    </span>
                    {!disabled && onClear && (
                        <button
                            type="button"
                            onClick={onClear}
                            className={cn(
                                "p-1 rounded transition-colors shrink-0",
                                isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-neutral-100 text-neutral-500"
                            )}
                            aria-label={t("common.close")}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="relative">
                    <Search
                        size={18}
                        className={cn("absolute top-2.5 left-3", isDark ? "text-neutral-500" : "text-neutral-400")}
                    />
                    <input
                        type="text"
                        disabled={disabled}
                        value={term}
                        onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        placeholder={t("creditSales.product_search_placeholder")}
                        className={cn(
                            "w-full pl-10 pr-9 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-primary-400 focus:border-primary-400",
                            isDark
                                ? "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
                                : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                        )}
                    />
                    {isFetching && (
                        <Loader2 size={16} className={cn("absolute top-2.5 right-3 animate-spin", isDark ? "text-neutral-500" : "text-neutral-400")} />
                    )}

                    {open && (
                        <div
                            className={cn(
                                "absolute z-30 mt-1 w-full max-h-64 overflow-y-auto custom-scrollbar rounded-lg border shadow-lg",
                                isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"
                            )}
                        >
                            {debounced.length < 2 ? (
                                <p className={cn("px-3 py-3 text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                    {t("creditSales.product_search_hint")}
                                </p>
                            ) : isFetching ? (
                                <p className={cn("px-3 py-3 text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                    {t("common.loading")}
                                </p>
                            ) : results.length === 0 ? (
                                <p className={cn("px-3 py-3 text-xs", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                    {t("creditSales.product_search_empty")}
                                </p>
                            ) : (
                                results.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelect(p)}
                                        className={cn(
                                            "w-full text-left px-3 py-2 transition-colors border-b last:border-b-0",
                                            isDark
                                                ? "hover:bg-neutral-700/60 border-neutral-700"
                                                : "hover:bg-neutral-50 border-neutral-100"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-neutral-900")}>
                                                {p.name}
                                            </span>
                                            <span className={cn("text-xs tabular-nums shrink-0", isDark ? "text-neutral-300" : "text-neutral-700")}>
                                                {formatCurrency(p.price)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn("text-[11px] font-mono", isDark ? "text-neutral-500" : "text-neutral-400")}>
                                                {p.sku}
                                            </span>
                                            <span className={cn("text-[11px]", isDark ? "text-neutral-500" : "text-neutral-400")}>•</span>
                                            <span className={cn(
                                                "text-[11px]",
                                                p.stock > 0
                                                    ? isDark ? "text-neutral-400" : "text-neutral-500"
                                                    : "text-red-500"
                                            )}>
                                                {t("creditSales.in_stock", { count: p.stock })}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
