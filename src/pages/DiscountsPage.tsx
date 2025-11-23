import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "../components/commons/Button";
import { Table } from "../components/commons/Table";
import { Pagination } from "../components/commons/Pagination";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { Input } from "../components/commons/Input";
import { Select } from "../components/commons/Select";
import { DateInput } from "../components/commons/DateInput";
import { Checkbox } from "../components/commons/Checkbox";
import { Modal } from "../components/commons/Modal";
import { discountsApi } from "../core/api/discounts.api";
import type { DiscountListItem, Discount, CreateDiscountRequest, UpdateDiscountRequest, DiscountType } from "../core/api/discounts.api";
import { productsApi } from "../core/api/products.api";
import { brandsApi } from "../core/api/brands.api";
import { categoriesApi } from "../core/api/categories.api";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

export const DiscountsPage = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();

  // State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<DiscountType | "">("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: "" as DiscountType | "",
    productId: "",
    brandId: "",
    categoryId: "",
    percent: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Fetch options for selects
  const { data: products } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsApi.getProducts({ pageSize: 100 }),
    enabled: formData.type === "Product" && isModalOpen,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => brandsApi.getBrands({ pageSize: 100 }),
    enabled: (formData.type === "Brand" || formData.type === "") && isModalOpen,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoriesApi.getCategories({ pageSize: 100 }),
    enabled: (formData.type === "Category" || formData.type === "") && isModalOpen,
  });

  // Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["discounts", page, pageSize, searchTerm, filterType, filterActive],
    queryFn: () => {
      return discountsApi.getDiscounts({
        page,
        pageSize,
        searchTerm: searchTerm || undefined,
        type: filterType || undefined,
        isActive: filterActive,
      });
    },
  });

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CreateDiscountRequest | UpdateDiscountRequest) => {
      if (editingDiscount) {
        return discountsApi.updateDiscount(editingDiscount.id, data as UpdateDiscountRequest);
      } else {
        return discountsApi.createDiscount(data as CreateDiscountRequest);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setIsModalOpen(false);
      setEditingDiscount(null);
      resetForm();
      toast.success(editingDiscount ? t('discounts.update_success') : t('discounts.create_success'));
    },
    onError: (err) => {
      console.error("Failed to save discount:", err);
      toast.error(editingDiscount ? t('discounts.update_error') : t('discounts.create_error'));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => discountsApi.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setSelectedItems(new Set());
      toast.success(t('discounts.delete_success'));
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    },
    onError: (err) => {
      console.error("Failed to delete discount:", err);
      toast.error(t('discounts.delete_error'));
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
    const items = data?.value || data?.items || [];
    if (selected && items.length > 0) {
      setSelectedItems(new Set(items.map((item: DiscountListItem) => item.id)));
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

  const handleEdit = async (discountId: string) => {
    try {
      const response = await discountsApi.getDiscountById(discountId);
      
      // Handle both wrapped (ApiResponse) and unwrapped (Discount) responses
      const discount = (response as any).value || response;
      
      if (discount && discount.id) {
        setEditingDiscount(discount);
        setFormData({
          type: discount.type,
          productId: discount.productId || "",
          brandId: discount.brandId || "",
          categoryId: discount.categoryId || "",
          percent: discount.percent.toString(),
          startDate: discount.startDate.split('T')[0],
          endDate: discount.endDate ? discount.endDate.split('T')[0] : "",
          isActive: discount.isActive,
        });
        setIsModalOpen(true);
      } else {
        toast.error(t('discounts.load_error'));
      }
    } catch (err) {
      console.error("Failed to load discount:", err);
      toast.error(t('discounts.load_error'));
    }
  };

  const handleAddNew = () => {
    setEditingDiscount(null);
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type: "",
      productId: "",
      brandId: "",
      categoryId: "",
      percent: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDiscount(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDiscount) {
      // Update
      const updateData: UpdateDiscountRequest = {
        percent: Number(formData.percent),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        isActive: formData.isActive,
      };
      saveMutation.mutate(updateData);
    } else {
      // Create
      if (!formData.type) {
        toast.error(t('discounts.type_required'));
        return;
      }

      const createData: CreateDiscountRequest = {
        type: formData.type as DiscountType,
        productId: formData.type === "Product" ? formData.productId || null : null,
        brandId: formData.type === "Brand" ? formData.brandId || null : null,
        categoryId: formData.type === "Category" ? formData.categoryId || null : null,
        percent: Number(formData.percent),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };
      saveMutation.mutate(createData);
    }
  };

  const getTypeOptions = () => [
    { label: t('discounts.type_product'), value: "Product" },
    { label: t('discounts.type_brand'), value: "Brand" },
    { label: t('discounts.type_category'), value: "Category" },
  ];

  const getProductOptions = () => {
    const items = products?.value || [];
    return items.map((p) => ({ label: p.name, value: p.id }));
  };

  const getBrandOptions = () => {
    const items = brands?.value || [];
    return items.map((b) => ({ label: b.name, value: b.id }));
  };

  const getCategoryOptions = () => {
    const items = categories?.value || [];
    return items.map((c) => ({ label: c.name, value: c.id }));
  };

  const columns = [
    {
      key: "type",
      label: t('discounts.type'),
      render: (item: DiscountListItem) => (
        <span className={cn(
          "text-sm font-medium",
          theme === "light" ? "text-neutral-900" : "text-white"
        )}>
          {t(`discounts.type_${item.type.toLowerCase()}`)}
        </span>
      ),
    },
    {
      key: "targetName",
      label: t('discounts.target'),
      sortable: true,
    },
    {
      key: "percent",
      label: t('discounts.percent'),
      render: (item: DiscountListItem) => (
        <span className="text-sm font-medium text-primary-600">
          %{item.percent}
        </span>
      ),
    },
    {
      key: "startDate",
      label: t('discounts.start_date'),
      render: (item: DiscountListItem) => (
        <span className={cn(
          "text-sm",
          theme === "light" ? "text-neutral-600" : "text-neutral-400"
        )}>
          {new Date(item.startDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "endDate",
      label: t('discounts.end_date'),
      render: (item: DiscountListItem) => (
        <span className={cn(
          "text-sm",
          theme === "light" ? "text-neutral-600" : "text-neutral-400"
        )}>
          {item.endDate ? new Date(item.endDate).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: t('common.status'),
      render: (item: DiscountListItem) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            item.isActive
              ? "bg-success/10 text-success"
              : "bg-neutral/10 text-neutral-500"
          }`}
        >
          {item.isActive ? t('discounts.active') : t('discounts.inactive')}
        </span>
      ),
    },
    {
      key: "actions",
      label: t('common.actions'),
      render: (item: DiscountListItem) => (
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "p-1 rounded transition-colors",
              theme === "light"
                ? "hover:bg-neutral-100 text-neutral-600"
                : "hover:bg-neutral-700 text-neutral-400"
            )}
            onClick={(e) => { e.stopPropagation(); handleEdit(item.id); }}
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
          )}>{t('discounts.title')}</h1>
          <p className={cn(
            "text-sm mt-1",
            theme === "light" ? "text-neutral-600" : "text-neutral-400"
          )}>{t('discounts.subtitle')}</p>
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
            placeholder={t('discounts.search_placeholder')}
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

        <div className="flex items-center gap-3">
          <div className="w-40">
            <Select
              options={[
                { label: t('discounts.filter_all_types'), value: "" },
                { label: t('discounts.type_product'), value: "Product" },
                { label: t('discounts.type_brand'), value: "Brand" },
                { label: t('discounts.type_category'), value: "Category" },
              ]}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as DiscountType | "");
                setPage(1);
              }}
              placeholder={t('discounts.filter_type')}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { label: t('discounts.filter_all_status'), value: "" },
                { label: t('discounts.active'), value: "true" },
                { label: t('discounts.inactive'), value: "false" },
              ]}
              value={filterActive === undefined ? "" : filterActive.toString()}
              onChange={(e) => {
                setFilterActive(e.target.value === "" ? undefined : e.target.value === "true");
                setPage(1);
              }}
              placeholder={t('discounts.filter_status')}
            />
          </div>
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={handleAddNew}
          >
            {t('discounts.add_discount')}
          </Button>
        </div>
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
          data={data?.value || data?.items || []}
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
            totalItems={data.totalCount || (data.value || data.items || []).length}
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
        title={editingDiscount ? t('discounts.edit_discount') : t('discounts.add_discount')}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingDiscount && (
            <Select
              label={t('discounts.type')}
              options={getTypeOptions()}
              value={formData.type}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  type: e.target.value as DiscountType | "",
                  productId: "",
                  brandId: "",
                  categoryId: "",
                });
              }}
              required
            />
          )}

          {editingDiscount && (
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="text-sm font-medium text-neutral-700 mb-2">{t('discounts.type')}</div>
              <div className="text-base font-semibold text-neutral-900">
                {t(`discounts.type_${editingDiscount.type.toLowerCase()}`)}
              </div>
              {(editingDiscount.productName || editingDiscount.brandName || editingDiscount.categoryName) && (
                <>
                  <div className="text-sm font-medium text-neutral-700 mt-3 mb-2">{t('discounts.target')}</div>
                  <div className="text-base font-semibold text-neutral-900">
                    {editingDiscount.productName || editingDiscount.brandName || editingDiscount.categoryName}
                  </div>
                </>
              )}
            </div>
          )}

          {formData.type === "Product" && !editingDiscount && (
            <Select
              label={t('discounts.product')}
              options={getProductOptions()}
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            />
          )}

          {formData.type === "Brand" && !editingDiscount && (
            <Select
              label={t('discounts.brand')}
              options={getBrandOptions()}
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
              required
            />
          )}

          {formData.type === "Category" && !editingDiscount && (
            <Select
              label={t('discounts.category')}
              options={getCategoryOptions()}
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            />
          )}

          <Input
            label={t('discounts.percent')}
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.percent}
            onChange={(e) => setFormData({ ...formData, percent: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <DateInput
              label={t('discounts.start_date')}
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
              required
            />
            <DateInput
              label={t('discounts.end_date')}
              value={formData.endDate}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
            />
          </div>

          {editingDiscount && (
            <Checkbox
              label={t('discounts.is_active')}
              checked={formData.isActive}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          )}

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
              {editingDiscount ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        title={t('discounts.delete_title')}
        message={t('discounts.delete_message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

