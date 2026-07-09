/**
 * Hesabat səhifəsi üçün yenidən istifadə olunan format helper-ləri.
 */

/** AZN formatı: `4,700.00 ₼` */
export function formatCurrency(value: number | null | undefined): string {
    const n = value ?? 0;
    return (
        n.toLocaleString("az-AZ", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }) + " ₼"
    );
}

/** Faiz formatı: `25.4%` */
export function formatPercent(value: number | null | undefined): string {
    const n = value ?? 0;
    return `${n.toLocaleString("az-AZ", { maximumFractionDigits: 1 })}%`;
}

/** Miqdar formatı (lazımsız onluqları atır): `12` / `12.5` */
export function formatQuantity(value: number | null | undefined): string {
    const n = value ?? 0;
    return n.toLocaleString("az-AZ", { maximumFractionDigits: 2 });
}

/** Tarix formatı: `dd.MM.yyyy` */
export function formatReportDate(value: string | null | undefined): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

/**
 * Mənfəət/zərər üçün mətn rəngi: müsbət (>=0) yaşıl, mənfi qırmızı.
 * `green-600` / `red-600` hər iki temada (açıq və tünd fon) oxunaqlıdır.
 */
export function getProfitColor(value: number | null | undefined): string {
    const n = value ?? 0;
    return n >= 0 ? "text-green-600" : "text-red-600";
}
