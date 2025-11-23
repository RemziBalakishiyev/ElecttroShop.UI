import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "../components/commons/Button";
import { Table } from "../components/commons/Table";
import { Pagination } from "../components/commons/Pagination";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Input } from "../components/commons/Input";
import { Modal } from "../components/commons/Modal";
import { categoriesApi } from "../core/api/categories.api";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "../core/api/categories.api";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

export const CategoriesPage = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();

  // State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
  });

  // Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["categories", page, pageSize, searchTerm],
    queryFn: () => {
      return categoriesApi.getCategories({
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
      });
    },
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CreateCategoryRequest | UpdateCategoryRequest) => {
      if (editingCategory) {
        return categoriesApi.updateCategory(editingCategory.id, data as UpdateCategoryRequest);
      } else {
        return categoriesApi.createCategory(data as CreateCategoryRequest);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", slug: "", parentId: "" });
      toast.success(editingCategory ? t('categories.update_success') : t('categories.create_success'));
    },
    onError: (err) => {
      console.error("Failed to save category:", err);
      toast.error(editingCategory ? t('categories.update_error') : t('categories.create_error'));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSelectedItems(new Set());
      toast.success(t('categories.delete_success'));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    },
    onError: (err) => {
      console.error("Failed to delete category:", err);
      toast.error(t('categories.delete_error'));
    },
  });

  // Handlers
  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    const items = data?.value || [];
    if (selected && items.length > 0) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || "",
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", parentId: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", slug: "", parentId: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateCategoryRequest | UpdateCategoryRequest = {
      name: formData.name,
      slug: formData.slug || undefined,
      parentId: formData.parentId || null,
    };
    saveMutation.mutate(submitData);
  };

  const columns = [
    {
      key: "name",
      label: t('categories.name'),
      sortable: true,
      render: (item: Category) => (
        <div className="flex flex-col">
          <span className={cn(
            "font-medium",
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>{item.name}</span>
          {item.parentName && (
            <span className={cn(
              "text-xs",
              theme === "light" ? "text-neutral-500" : "text-neutral-400"
            )}>{t('categories.parent')}: {item.parentName}</span>
          )}
        </div>
      ),
    },
    {
      key: "slug",
      label: t('categories.slug'),
      render: (item: Category) => (
        <span className={cn(
          "text-sm font-mono",
          theme === "light" ? "text-neutral-600" : "text-neutral-400"
        )}>{item.slug}</span>
      ),
    },
    {
      key: "discountPercent",
      label: t('categories.discount'),
      render: (item: Category) => (
        item.discountPercent ? (
          <span className="text-sm font-medium text-primary-600">
            %{item.discountPercent}
          </span>
        ) : (
          <span className="text-sm text-neutral-400">-</span>
        )
      ),
    },
    {
      key: "createdAt",
      label: t('common.created_at'),
      render: (item: Category) => (
        <span className={cn(
          "text-sm",
          theme === "light" ? "text-neutral-600" : "text-neutral-400"
        )}>
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: t('common.actions'),
      render: (item: Category) => (
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "p-1 rounded transition-colors",
              theme === "light"
                ? "hover:bg-neutral-100 text-neutral-600"
                : "hover:bg-neutral-700 text-neutral-400"
            )}
            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
            title={t('common.edit')}
          >
            <Edit size={16} />
          </button>
          <button
            className={cn(
              "p-1 rounded transition-colors",
              theme === "light"
                ? "hover:bg-red-50 text-red-600"
                : "hover:bg-red-900/20 text-red-400"
            )}
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-8 text-center text-red-600">
        {t('common.error')}: {(error as any)?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-2xl font-bold",
            theme === "light" ? "text-neutral-900" : "text-white"
          )}>{t('categories.title')}</h1>
          <p className={cn(
            "text-sm mt-1",
            theme === "light" ? "text-neutral-600" : "text-neutral-400"
          )}>{t('categories.subtitle')}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border",
        theme === "light"
          ? "bg-white border-neutral-200"
          : "bg-neutral-800 border-neutral-700"
      )}>
        <div className="relative flex-1 max-w-md">
          <Search size={18} className={cn(
            "absolute top-2.5 left-3",
            theme === "light" ? "text-neutral-400" : "text-neutral-500"
          )} />
          <input
            type="text"
            placeholder={t('categories.search_placeholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className={cn(
              "w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none",
              theme === "light"
                ? "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400"
                : "border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            )}
          />
        </div>

        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={handleAddNew}
        >
          {t('categories.add_category')}
        </Button>
      </div>

      {/* Table */}
      <div className={cn(
        "rounded-lg border overflow-hidden",
        theme === "light"
          ? "bg-white border-neutral-200"
          : "bg-neutral-800 border-neutral-700"
      )}>
        <Table
          columns={columns}
          data={data?.value || []}
          selectable
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {data && data.page !== undefined && (
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            itemsPerPage={data.pageSize}
            totalItems={data.totalCount}
            onPageChange={setPage}
            onItemsPerPageChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? t('categories.edit_category') : t('categories.add_category')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('categories.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('categories.slug')}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder={t('categories.slug_placeholder')}
          />
          <Input
            label={t('categories.parent_id')}
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            placeholder={t('categories.parent_id_placeholder')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveMutation.isPending}
            >
              {editingCategory ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        title={t('categories.delete_title')}
        message={t('categories.delete_message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

