import React from "react";
import { cn } from "../../utils/cn";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../core/context/ThemeContext";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  getItemId?: (item: T) => string;
}

export function Table<T>({
  columns,
  data,
  selectable = false,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll,
  getItemId = (item: any) => item.id,
  isLoading = false,
}: TableProps<T> & { isLoading?: boolean }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const allSelected = data.length > 0 && data.every((item) => selectedItems.has(getItemId(item)));

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn(
            "border-b",
            theme === "light"
              ? "bg-neutral-50 border-neutral-200"
              : "bg-neutral-800 border-neutral-700"
          )}>
            <tr>
              {selectable && <th className="px-4 py-3 w-12" />}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  <div className={cn(
                    "h-3 rounded animate-pulse w-20",
                    theme === "light" ? "bg-neutral-200" : "bg-neutral-700"
                  )} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(
            "divide-y",
            theme === "light" ? "bg-white divide-neutral-100" : "bg-neutral-900 divide-neutral-800"
          )}>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {selectable && (
                  <td className="px-4 py-4">
                    <div className={cn(
                      "w-4 h-4 rounded animate-pulse",
                      theme === "light" ? "bg-neutral-200" : "bg-neutral-700"
                    )} />
                  </td>
                )}
                {columns.map((col, colIdx) => (
                  <td key={col.key} className="px-4 py-4">
                    <div className={cn(
                      "h-3 rounded animate-pulse",
                      colIdx === 0 ? "w-32" : colIdx % 3 === 0 ? "w-16" : "w-24",
                      theme === "light" ? "bg-neutral-200" : "bg-neutral-700"
                    )} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className={cn(
          "border-b",
          theme === "light"
            ? "bg-neutral-50 border-neutral-200"
            : "bg-neutral-800 border-neutral-700"
        )}>
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider",
                  theme === "light" ? "text-neutral-600" : "text-neutral-300"
                )}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <svg
                      className={cn(
                        "w-3 h-3",
                        theme === "light" ? "text-neutral-400" : "text-neutral-500"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(
          "divide-y transition-colors",
          theme === "light"
            ? "bg-white divide-neutral-200"
            : "bg-neutral-900 divide-neutral-800"
        )}>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-16 text-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    theme === "light" ? "bg-neutral-100" : "bg-neutral-800"
                  )}>
                    <svg className={cn("w-6 h-6", theme === "light" ? "text-neutral-400" : "text-neutral-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className={cn(
                    "text-sm font-medium",
                    theme === "light" ? "text-neutral-500" : "text-neutral-400"
                  )}>
                    {t('common.no_items_found')}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const itemId = getItemId(item);
              const isSelected = selectedItems.has(itemId);

              return (
                <tr
                  key={itemId}
                  className={cn(
                    "transition-colors",
                    theme === "light"
                      ? "hover:bg-neutral-50"
                      : "hover:bg-neutral-800",
                    isSelected && (theme === "light" ? "bg-primary-50" : "bg-primary-900/20")
                  )}
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectItem?.(itemId)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-4 text-sm",
                        theme === "light" ? "text-neutral-900" : "text-neutral-100"
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] || "")}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

