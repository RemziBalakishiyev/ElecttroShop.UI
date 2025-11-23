import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "../components/commons/Button";
import { Table } from "../components/commons/Table";
import { Pagination } from "../components/commons/Pagination";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Input } from "../components/commons/Input";
import { Modal } from "../components/commons/Modal";
import { brandsApi } from "../core/api/brands.api";
import type { Brand, CreateBrandRequest, UpdateBrandRequest } from "../core/api/brands.api";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

export const BrandsPage = () => {
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
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
  });

  // Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["brands", page, pageSize, searchTerm],
    queryFn: () => {
      return brandsApi.getBrands({
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
      });
    },
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CreateBrandRequest | UpdateBrandRequest) => {
      if (editingBrand) {
        return brandsApi.updateBrand(editingBrand.id, data as UpdateBrandRequest);
      } else {
        return brandsApi.createBrand(data as CreateBrandRequest);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setIsModalOpen(false);
      setEditingBrand(null);
      setFormData({ name: "" });
      toast.success(editingBrand ? t('brands.update_success') : t('brands.create_success'));
    },
    onError: (err) => {
      console.error("Failed to save brand:", err);
      toast.error(editingBrand ? t('brands.update_error') : t('brands.create_error'));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandsApi.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setSelectedItems(new Set());
      toast.success(t('brands.delete_success'));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    },
    onError: (err) => {
      console.error("Failed to delete brand:", err);
      toast.error(t('brands.delete_error'));
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

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBrand(null);
    setFormData({ name: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormData({ name: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateBrandRequest | UpdateBrandRequest = {
      name: formData.name,
    };
    saveMutation.mutate(submitData);
  };

  const columns = [
    {
      key: "name",
      label: t('brands.name'),
      sortable: true,
    },
    {
      key: "discountPercent",
      label: t('brands.discount'),
      render: (item: Brand) => (
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
      render: (item: Brand) => (
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
      render: (item: Brand) => (
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
          )}>{t('brands.title')}</h1>
          <p className={cn(
            "text-sm mt-1",
            theme === "light" ? "text-neutral-600" : "text-neutral-400"
          )}>{t('brands.subtitle')}</p>
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
            placeholder={t('brands.search_placeholder')}
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
          {t('brands.add_brand')}
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
        title={editingBrand ? t('brands.edit_brand') : t('brands.add_brand')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('brands.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
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
              {editingBrand ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        title={t('brands.delete_title')}
        message={t('brands.delete_message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

