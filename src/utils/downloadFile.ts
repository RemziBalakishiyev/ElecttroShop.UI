/**
 * File download helpers for server-generated blobs (Excel, PDF, ...).
 */

/** Azerbaijani month names (index 0 = Yanvar) for display in month pickers. */
export const AZ_MONTHS = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
    "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
] as const;

/** ASCII-safe month names (index 0 = YANVAR) for use in fallback file names. */
export const SAFE_MONTHS = [
    "YANVAR", "FEVRAL", "MART", "APREL", "MAY", "IYUN",
    "IYUL", "AVQUST", "SENTYABR", "OKTYABR", "NOYABR", "DEKABR",
] as const;

/**
 * Extract the file name from a `Content-Disposition` header.
 * Supports both `filename="..."` and RFC 5987 `filename*=UTF-8''...`.
 * Returns `undefined` when no name can be parsed.
 */
export function parseFilenameFromContentDisposition(header?: string): string | undefined {
    if (!header) return undefined;

    // RFC 5987: filename*=UTF-8''encoded-name
    const extendedMatch = header.match(/filename\*\s*=\s*[^']*''([^;]+)/i);
    if (extendedMatch?.[1]) {
        try {
            return decodeURIComponent(extendedMatch[1].trim().replace(/^"|"$/g, ""));
        } catch {
            // fall through to the plain filename below
        }
    }

    // Plain: filename="name" or filename=name
    const plainMatch = header.match(/filename\s*=\s*"?([^";]+)"?/i);
    if (plainMatch?.[1]) {
        return plainMatch[1].trim();
    }

    return undefined;
}

/**
 * Trigger a browser download for a blob using a temporary object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
