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
      <div className={cn(
        "w-full p-8 flex justify-center items-center",
        theme === "light" ? "text-neutral-500" : "text-neutral-400"
      )}>
        {t('common.loading')}
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
                className={cn(
                  "px-4 py-8 text-center",
                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                )}
              >
                {t('common.no_items_found')}
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

