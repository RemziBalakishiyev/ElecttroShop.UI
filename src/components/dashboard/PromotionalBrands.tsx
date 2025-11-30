import { useQuery } from "@tanstack/react-query";
import { brandsApi } from "../../core/api/brands.api";
import { API_CONFIG } from "../../core/config/api.config";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";
import { cn } from "../../utils/cn";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PromotionalBrands = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ["promotional-brands"],
        queryFn: () => brandsApi.getPromotionalBrands(),
    });

    if (isLoading) {
        return (
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-6",
                theme === "light" ? "bg-white" : "bg-neutral-800"
            )}>
                {[1, 2].map((i) => (
                    <div key={i} className={cn(
                        "rounded-xl p-6 border animate-pulse",
                        theme === "light"
                            ? "bg-neutral-50 border-neutral-200"
                            : "bg-neutral-900 border-neutral-700"
                    )}>
                        <div className="h-48 bg-neutral-200 rounded-lg" />
                    </div>
                ))}
            </div>
        );
    }

    const promotionalBrands = (data as any)?.value || [];

    if (promotionalBrands.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotionalBrands.slice(0, 2).map((item: any) => {
                const { brand, featuredProduct } = item;
                
                if (!featuredProduct) return null;

                const imageUrl = featuredProduct.imageId
                    ? `${API_CONFIG.BASE_URL}/images/${featuredProduct.imageId}`
                    : null;

                return (
                    <div
                        key={brand.id}
                        className={cn(
                            "rounded-xl border transition-all hover:shadow-lg cursor-pointer group",
                            theme === "light"
                                ? "bg-white border-neutral-200"
                                : "bg-neutral-800 border-neutral-700"
                        )}
                        onClick={() => navigate(`/products/${featuredProduct.id}`)}
                    >
                        <div className="p-6 flex items-start gap-6">
                            {/* Product Image */}
                            <div className={cn(
                                "w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                                theme === "light"
                                    ? "bg-neutral-100"
                                    : "bg-neutral-900"
                            )}>
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={featuredProduct.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/96?text=No+Img";
                                        }}
                                    />
                                ) : (
                                    <ShoppingBag size={32} className={theme === "light" ? "text-neutral-400" : "text-neutral-600"} />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className={cn(
                                    "text-2xl font-bold mb-2 group-hover:text-primary-600 transition-colors",
                                    theme === "light" ? "text-neutral-900" : "text-white"
                                )}>
                                    {featuredProduct.name}
                                </h3>
                                
                                {featuredProduct.description && (
                                    <p className={cn(
                                        "text-sm mb-6 line-clamp-3",
                                        theme === "light" ? "text-neutral-600" : "text-neutral-400"
                                    )}>
                                        {featuredProduct.description}
                                    </p>
                                )}

                                <button className={cn(
                                    "px-6 py-2.5 rounded-lg border font-medium transition-all",
                                    theme === "light"
                                        ? "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                                        : "border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                )}>
                                    {t('dashboard.shop_now') || "Alış-veriş et"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

