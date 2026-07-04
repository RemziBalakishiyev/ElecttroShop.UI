import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  X,
  ShoppingBag,
  Plus,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  FileText,
  Hash,
  Layers,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "../components/commons/Pagination";
import { productsApi } from "../core/api/products.api";
import type { PopularProduct, Product } from "../core/api/products.api";
import { resolveImageUrl } from "../utils/imageUrl";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

const MAX_POPULAR = 4;
const ORDERS = [1, 2, 3, 4] as const;

function buildPopularSlots(products: PopularProduct[]): (PopularProduct | null)[] {
  const slots: (PopularProduct | null)[] = Array(MAX_POPULAR).fill(null);
  for (const product of products) {
    const order = product.displayOrder;
    if (order >= 1 && order <= MAX_POPULAR) {
      slots[order - 1] = product;
    }
  }
  return slots;
}

interface OrderPickerProps {
  productId: string;
  currentOrder?: number;
  disabled?: boolean;
  pending?: boolean;
  onSelect: (productId: string, order: number) => void;
}

function OrderPicker({
  productId,
  currentOrder,
  disabled,
  pending,
  onSelect,
}: OrderPickerProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex rounded-lg p-0.5 border",
        theme === "light"
          ? "bg-neutral-100 border-neutral-200"
          : "bg-neutral-900 border-neutral-600"
      )}
      role="group"
      aria-label="Sıra seçimi"
    >
      {ORDERS.map((order) => {
        const isActive = currentOrder === order;
        return (
          <button
            key={order}
            type="button"
            disabled={disabled || (pending && !isActive)}
            onClick={() => {
              if (!isActive) onSelect(productId, order);
            }}
            className={cn(
              "relative min-w-[2.25rem] h-8 px-2.5 text-sm font-semibold rounded-md transition-all",
              isActive
                ? "bg-primary-500 text-white shadow-sm"
                : theme === "light"
                ? "text-neutral-600 hover:text-primary-600 hover:bg-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {pending && !isActive ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-3.5 w-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              </span>
            ) : (
              order
            )}
          </button>
        );
      })}
    </div>
  );
}

export const PopularProductsPage = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const { data: popularProducts = [], isLoading: isPopularLoading } = useQuery({
    queryKey: ["popular-products"],
    queryFn: () => productsApi.getPopularProducts(),
  });

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products", page, pageSize, searchTerm, "popular-manager"],
    queryFn: () =>
      productsApi.getProducts({
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
      }),
  });

  const popularSlots = useMemo(
    () => buildPopularSlots(popularProducts),
    [popularProducts]
  );

  const popularByProductId = useMemo(() => {
    const map = new Map<string, PopularProduct>();
    popularProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [popularProducts]);

  const filledCount = popularProducts.length;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["popular-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const setPopularMutation = useMutation({
    mutationFn: ({ productId, displayOrder }: { productId: string; displayOrder: number }) =>
      productsApi.setPopular(productId, displayOrder),
    onSuccess: () => {
      toast.success(t("popular.set_success"));
      invalidateAll();
    },
    onError: (err: { error?: { message?: string }; message?: string }) => {
      toast.error(err?.error?.message || err?.message || t("popular.error"));
    },
    onSettled: () => setPendingProductId(null),
  });

  const removePopularMutation = useMutation({
    mutationFn: (productId: string) => productsApi.removePopular(productId),
    onSuccess: () => {
      toast.success(t("popular.remove_success"));
      invalidateAll();
    },
    onError: (err: { error?: { message?: string }; message?: string }) => {
      toast.error(err?.error?.message || err?.message || t("popular.error"));
    },
    onSettled: () => setPendingProductId(null),
  });

  const handleSetOrder = (productId: string, displayOrder: number) => {
    setPendingProductId(productId);
    setPopularMutation.mutate({ productId, displayOrder });
  };

  const handleRemove = (productId: string) => {
    setPendingProductId(productId);
    removePopularMutation.mutate(productId);
  };

  const isMutating = setPopularMutation.isPending || removePopularMutation.isPending;

  const rules = [
    { icon: Layers, label: t("popular.rules.max_count"), desc: t("popular.rules.max_count_desc") },
    { icon: Hash, label: t("popular.rules.order_range"), desc: t("popular.rules.order_range_desc") },
    { icon: Sparkles, label: t("popular.rules.unique_order"), desc: t("popular.rules.unique_order_desc") },
    { icon: ImageIcon, label: t("popular.rules.image"), desc: t("popular.rules.image_desc") },
    { icon: FileText, label: t("popular.rules.description"), desc: t("popular.rules.description_desc") },
    { icon: CheckCircle2, label: t("popular.rules.active"), desc: t("popular.rules.active_desc") },
  ];

  const cardShell = cn(
    "rounded-xl border shadow-sm",
    theme === "light" ? "bg-white border-neutral-200" : "bg-neutral-800 border-neutral-700"
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border p-6 sm:p-8",
          theme === "light"
            ? "bg-gradient-to-br from-primary-50 via-white to-violet-50 border-primary-100"
            : "bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-neutral-700"
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600">
              <TrendingUp size={14} />
              {t("popular.preview_label")}
            </div>
            <h1
              className={cn(
                "text-2xl sm:text-3xl font-bold tracking-tight",
                theme === "light" ? "text-neutral-900" : "text-white"
              )}
            >
              {t("popular.title")}
            </h1>
            <p
              className={cn(
                "text-sm sm:text-base max-w-2xl",
                theme === "light" ? "text-neutral-600" : "text-neutral-400"
              )}
            >
              {t("popular.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div
              className={cn(
                "rounded-xl px-5 py-4 border min-w-[140px]",
                theme === "light"
                  ? "bg-white/80 border-neutral-200 backdrop-blur-sm"
                  : "bg-neutral-800/80 border-neutral-600"
              )}
            >
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {t("popular.current_products")}
              </p>
              <p className="text-3xl font-bold mt-1 text-primary-600">
                {isPopularLoading ? "—" : t("popular.slots_filled", { count: filledCount, max: MAX_POPULAR })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Rules */}
      <div className={cardShell}>
        <button
          type="button"
          onClick={() => setRulesOpen((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between px-5 py-4 text-left transition-colors rounded-xl",
            theme === "light" ? "hover:bg-neutral-50" : "hover:bg-neutral-700/50"
          )}
        >
          <span className="font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-primary-500" />
            {t("popular.rules_title")}
          </span>
          <span className="text-sm text-neutral-500 flex items-center gap-1">
            {rulesOpen ? t("popular.hide_rules") : t("popular.show_rules")}
            {rulesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>
        {rulesOpen && (
          <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 border-t border-neutral-100 dark:border-neutral-700 pt-4">
            {rules.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className={cn(
                  "flex gap-3 p-3 rounded-lg",
                  theme === "light" ? "bg-neutral-50" : "bg-neutral-900/60"
                )}
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <Icon size={16} className="text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slot Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            className={cn(
              "text-lg font-semibold",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}
          >
            {t("popular.current_products")}
          </h2>
          <span className="text-xs text-neutral-500 hidden sm:inline">
            {t("popular.preview_label")}
          </span>
        </div>

        {isPopularLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {ORDERS.map((order) => (
              <div
                key={order}
                className={cn(cardShell, "h-56 animate-pulse bg-neutral-100 dark:bg-neutral-700")}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {popularSlots.map((product, index) => {
              const order = index + 1;
              const imageUrl = product ? resolveImageUrl(product.imageUrl) : null;
              const isRemoving = isMutating && product && pendingProductId === product.id;

              return (
                <article
                  key={order}
                  className={cn(
                    cardShell,
                    "group overflow-hidden transition-all duration-200",
                    product
                      ? "hover:shadow-md hover:border-primary-200"
                      : "border-dashed",
                    !product &&
                      (theme === "light"
                        ? "bg-neutral-50/50 border-neutral-300"
                        : "bg-neutral-900/30 border-neutral-600")
                  )}
                >
                  {product ? (
                    <>
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={40} className="text-neutral-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                          {order}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(product.id)}
                          disabled={isMutating}
                          className={cn(
                            "absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-sm transition-colors",
                            "bg-white/90 text-red-600 hover:bg-red-50",
                            isRemoving && "opacity-70"
                          )}
                          title={t("popular.remove")}
                        >
                          {isRemoving ? (
                            <span className="block h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      </div>
                      <div className="p-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${product.id}`)}
                          className={cn(
                            "font-semibold text-sm text-left line-clamp-2 hover:text-primary-600 transition-colors flex items-start gap-1 w-full",
                            theme === "light" ? "text-neutral-900" : "text-white"
                          )}
                        >
                          <span className="flex-1">{product.name}</span>
                          <ExternalLink size={14} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-60" />
                        </button>
                        {product.shortDescription ? (
                          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                            {product.shortDescription}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600">{t("popular.no_description_warning")}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 min-h-[220px]">
                      <span
                        className={cn(
                          "w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center mb-4",
                          theme === "light"
                            ? "bg-neutral-200 text-neutral-500"
                            : "bg-neutral-700 text-neutral-400"
                        )}
                      >
                        {order}
                      </span>
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border-2 border-dashed",
                          theme === "light" ? "border-neutral-300 text-neutral-400" : "border-neutral-600 text-neutral-500"
                        )}
                      >
                        <Plus size={24} />
                      </div>
                      <p className="text-sm font-medium text-neutral-500">{t("popular.empty_slot")}</p>
                      <p className="text-xs text-neutral-400 mt-1">{t("popular.empty_slot_hint")}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Picker */}
      <section className={cn(cardShell, "overflow-hidden")}>
        <div
          className={cn(
            "px-5 py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
            theme === "light" ? "border-neutral-100 bg-neutral-50/50" : "border-neutral-700 bg-neutral-900/30"
          )}
        >
          <div>
            <h2
              className={cn(
                "text-lg font-semibold",
                theme === "light" ? "text-neutral-900" : "text-white"
              )}
            >
              {t("popular.all_products")}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">{t("popular.assign_to_slot")}</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none",
                theme === "light" ? "text-neutral-400" : "text-neutral-500"
              )}
            />
            <input
              type="text"
              placeholder={t("products.search_placeholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none transition-shadow",
                theme === "light"
                  ? "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 shadow-sm"
                  : "border-neutral-600 bg-neutral-800 text-white placeholder:text-neutral-500"
              )}
            />
          </div>
        </div>

        {isProductsLoading ? (
          <div className="p-12 flex flex-col items-center gap-3 text-neutral-500">
            <span className="h-8 w-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{t("common.loading")}</span>
          </div>
        ) : (productsData?.value ?? []).length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag size={40} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-500">{t("popular.no_products")}</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {(productsData?.value ?? []).map((product: Product) => {
                const popularEntry = popularByProductId.get(product.id);
                const imageUrl = resolveImageUrl(product.primaryImageUrl || product.imageUrl);
                const hasDescription = !!product.description?.trim();
                const hasImage = !!imageUrl;
                const isPending = isMutating && pendingProductId === product.id;
                const warnings = [
                  !product.isActive && t("products.inactive"),
                  !hasImage && t("popular.no_image_warning"),
                  !hasDescription && t("popular.no_description_warning"),
                ].filter(Boolean) as string[];

                return (
                  <li
                    key={product.id}
                    className={cn(
                      "px-5 py-4 transition-colors",
                      popularEntry
                        ? theme === "light"
                          ? "bg-primary-50/40"
                          : "bg-primary-900/10"
                        : theme === "light"
                        ? "hover:bg-neutral-50"
                        : "hover:bg-neutral-700/30"
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden border",
                            theme === "light" ? "bg-neutral-100 border-neutral-200" : "bg-neutral-900 border-neutral-600"
                          )}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={20} className="text-neutral-400" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => navigate(`/products/${product.id}`)}
                              className={cn(
                                "font-semibold text-sm hover:text-primary-600 text-left truncate max-w-full transition-colors",
                                theme === "light" ? "text-neutral-900" : "text-white"
                              )}
                            >
                              {product.name}
                            </button>
                            {popularEntry && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500 text-white">
                                <CheckCircle2 size={12} />
                                {t("popular.assigned")} · {popularEntry.displayOrder}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 font-mono">{product.sku}</p>
                          {warnings.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {warnings.map((w) => (
                                <span
                                  key={w}
                                  className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100"
                                >
                                  {w}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 lg:shrink-0 pl-[4.5rem] lg:pl-0">
                        <OrderPicker
                          productId={product.id}
                          currentOrder={popularEntry?.displayOrder}
                          disabled={isMutating}
                          pending={isPending}
                          onSelect={handleSetOrder}
                        />
                        {popularEntry && (
                          <button
                            type="button"
                            onClick={() => handleRemove(product.id)}
                            disabled={isMutating}
                            className={cn(
                              "h-8 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5",
                              "text-red-600 border-red-200 hover:bg-red-50",
                              theme === "dark" && "border-red-900/50 hover:bg-red-900/20"
                            )}
                          >
                            {isPending ? (
                              <span className="h-3.5 w-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                            {t("popular.remove")}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {productsData && (
              <div className={theme === "light" ? "bg-neutral-50/50" : "bg-neutral-900/30"}>
                <Pagination
                  currentPage={productsData.page}
                  totalPages={productsData.totalPages}
                  itemsPerPage={productsData.pageSize}
                  totalItems={productsData.totalCount}
                  onPageChange={setPage}
                  onItemsPerPageChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
