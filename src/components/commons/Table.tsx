import React from "react";
import { cn } from "../../utils/cn";

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
}: TableProps<T>) {
  const allSelected = data.length > 0 && data.every((item) => selectedItems.has(getItemId(item)));

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
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
                className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <svg
                      className="w-3 h-3 text-neutral-400"
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
        <tbody className="bg-white divide-y divide-neutral-200">
          {data.map((item) => {
            const itemId = getItemId(item);
            const isSelected = selectedItems.has(itemId);

            return (
              <tr
                key={itemId}
                className={cn(
                  "hover:bg-neutral-50 transition-colors",
                  isSelected && "bg-primary-50"
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
                  <td key={column.key} className="px-4 py-4 text-sm text-neutral-900">
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] || "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

