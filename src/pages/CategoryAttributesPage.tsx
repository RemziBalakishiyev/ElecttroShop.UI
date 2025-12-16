import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "../components/commons/Button";
import { Input } from "../components/commons/Input";
import { Select } from "../components/commons/Select";
import { Modal } from "../components/commons/Modal";
import { ConfirmationModal } from "../components/commons/ConfirmationModal";
import { categoriesApi } from "../core/api/categories.api";
import type {
  CategoryAttribute,
  CategoryAttributeValue,
  CreateCategoryAttributeRequest,
  UpdateCategoryAttributeRequest,
  CreateAttributeValueRequest,
  UpdateAttributeValueRequest,
} from "../core/api/categories.api";
import { useToast } from "../core/providers/ToastContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../core/context/ThemeContext";
import { cn } from "../utils/cn";

export const CategoryAttributesPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();

  // State
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [editingValue, setEditingValue] = useState<{ value: CategoryAttributeValue; attributeId: string } | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null);
  const [isDeleteValueModalOpen, setIsDeleteValueModalOpen] = useState(false);

  // Form states
  const [attributeForm, setAttributeForm] = useState({
    name: "",
    displayName: "",
    attributeType: "",
    isRequired: false,
    displayOrder: 0,
  });

  const [valueForm, setValueForm] = useState({
    value: "",
    displayValue: "",
    displayOrder: 0,
    colorCode: "",
  });

  // Fetch category info
  const { data: categoryData } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => categoriesApi.getCategoryById(categoryId!),
    enabled: !!categoryId,
  });

  const category = (categoryData as any)?.value || categoryData;

  // Fetch attributes
  const { data: attributesData, isLoading } = useQuery({
    queryKey: ["category-attributes", categoryId],
    queryFn: () => categoriesApi.getCategoryAttributes(categoryId!),
    enabled: !!categoryId,
  });

  // Process and sort attributes by displayOrder
  const rawAttributes: CategoryAttribute[] =
    (attributesData as any)?.value || attributesData || [];
  
  const attributes: CategoryAttribute[] = rawAttributes
    .map(attr => ({
      ...attr,
      // Sort values by displayOrder
      values: [...(attr.values || [])].sort((a, b) => 
        (a.displayOrder || 0) - (b.displayOrder || 0)
      ),
    }))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Attribute mutations
  const createAttributeMutation = useMutation({
    mutationFn: (data: CreateCategoryAttributeRequest) =>
      categoriesApi.createCategoryAttribute(categoryId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setIsAttributeModalOpen(false);
      setAttributeForm({
        name: "",
        displayName: "",
        attributeType: "",
        isRequired: false,
        displayOrder: 0,
      });
      toast.success("Atribut uğurla yaradıldı");
    },
    onError: (err: any) => {
      console.error("Failed to create attribute:", err);
      toast.error(err?.message || "Atribut yaradıla bilmədi");
    },
  });

  const updateAttributeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryAttributeRequest }) =>
      categoriesApi.updateCategoryAttribute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setIsAttributeModalOpen(false);
      setEditingAttribute(null);
      setAttributeForm({
        name: "",
        displayName: "",
        attributeType: "",
        isRequired: false,
        displayOrder: 0,
      });
      toast.success("Atribut uğurla yeniləndi");
    },
    onError: (err: any) => {
      console.error("Failed to update attribute:", err);
      toast.error(err?.message || "Atribut yenilənə bilmədi");
    },
  });

  const deleteAttributeMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategoryAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      toast.success("Atribut silindi");
    },
    onError: (err: any) => {
      console.error("Failed to delete attribute:", err);
      toast.error(err?.message || "Atribut silinə bilmədi");
    },
  });

  // Value mutations
  const createValueMutation = useMutation({
    mutationFn: ({ attributeId, data }: { attributeId: string; data: CreateAttributeValueRequest }) =>
      categoriesApi.addAttributeValue(attributeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setIsValueModalOpen(false);
      setSelectedAttributeId(null);
      setValueForm({
        value: "",
        displayValue: "",
        displayOrder: 0,
        colorCode: "",
      });
      toast.success("Dəyər uğurla əlavə edildi");
    },
    onError: (err: any) => {
      console.error("Failed to create value:", err);
      toast.error(err?.message || "Dəyər əlavə edilə bilmədi");
    },
  });

  const updateValueMutation = useMutation({
    mutationFn: ({ valueId, data }: { valueId: string; data: UpdateAttributeValueRequest }) =>
      categoriesApi.updateAttributeValue(valueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setIsValueModalOpen(false);
      setEditingValue(null);
      setValueForm({
        value: "",
        displayValue: "",
        displayOrder: 0,
        colorCode: "",
      });
      toast.success("Dəyər uğurla yeniləndi");
    },
    onError: (err: any) => {
      console.error("Failed to update value:", err);
      toast.error(err?.message || "Dəyər yenilənə bilmədi");
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: (valueId: string) => categoriesApi.deleteAttributeValue(valueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-attributes", categoryId] });
      setIsDeleteValueModalOpen(false);
      setDeleteValueId(null);
      toast.success("Dəyər silindi");
    },
    onError: (err: any) => {
      console.error("Failed to delete value:", err);
      toast.error(err?.message || "Dəyər silinə bilmədi");
    },
  });

  // Handlers
  const handleAddAttribute = () => {
    setEditingAttribute(null);
    setAttributeForm({
      name: "",
      displayName: "",
      attributeType: "",
      isRequired: false,
      displayOrder: attributes.length,
    });
    setIsAttributeModalOpen(true);
  };

  const handleEditAttribute = (attribute: CategoryAttribute) => {
    setEditingAttribute(attribute);
    setAttributeForm({
      name: attribute.name,
      displayName: attribute.displayName,
      attributeType: attribute.attributeType,
      isRequired: attribute.isRequired,
      displayOrder: attribute.displayOrder,
    });
    setIsAttributeModalOpen(true);
  };

  const handleDeleteAttribute = (id: string) => {
    if (confirm("Bu atributu silmək istədiyinizə əminsiniz? Bütün dəyərlər də silinəcək.")) {
      deleteAttributeMutation.mutate(id);
    }
  };

  const handleAddValue = (attributeId: string) => {
    setEditingValue(null);
    setSelectedAttributeId(attributeId);
    const attribute = attributes.find((a) => a.id === attributeId);
    setValueForm({
      value: "",
      displayValue: "",
      displayOrder: attribute?.values.length || 0,
      colorCode: "",
    });
    setIsValueModalOpen(true);
  };

  const handleEditValue = (value: CategoryAttributeValue, attributeId: string) => {
    setEditingValue({ value, attributeId });
    setSelectedAttributeId(attributeId);
    setValueForm({
      value: value.value,
      displayValue: value.displayValue || "",
      displayOrder: value.displayOrder || 0,
      colorCode: value.colorCode || "",
    });
    setIsValueModalOpen(true);
  };

  const handleDeleteValue = (valueId: string) => {
    setDeleteValueId(valueId);
    setIsDeleteValueModalOpen(true);
  };

  const handleSubmitAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAttribute) {
      updateAttributeMutation.mutate({
        id: editingAttribute.id,
        data: attributeForm,
      });
    } else {
      createAttributeMutation.mutate(attributeForm);
    }
  };

  const handleSubmitValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttributeId) return;

    const valueData: CreateAttributeValueRequest | UpdateAttributeValueRequest = {
      value: valueForm.value,
      displayValue: valueForm.displayValue || undefined,
      displayOrder: valueForm.displayOrder,
      colorCode: valueForm.colorCode || null,
    };

    if (editingValue) {
      updateValueMutation.mutate({
        valueId: editingValue.value.id!,
        data: valueData,
      });
    } else {
      createValueMutation.mutate({
        attributeId: selectedAttributeId,
        data: valueData,
      });
    }
  };

  const attributeTypeOptions = [
    { label: "Yaddaş", value: "Storage" },
    { label: "Rəng", value: "Color" },
    { label: "RAM", value: "RAM" },
    { label: "Ekran", value: "Screen" },
    { label: "Prosessor", value: "Processor" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/categories")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              theme === "light"
                ? "hover:bg-neutral-100 text-neutral-600"
                : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={cn(
              "text-2xl font-bold",
              theme === "light" ? "text-neutral-900" : "text-white"
            )}>
              Kateqoriya Atributları
            </h1>
            <p className={cn(
              "text-sm mt-1",
              theme === "light" ? "text-neutral-600" : "text-neutral-400"
            )}>
              {category?.name || "Kateqoriya"}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={handleAddAttribute}
        >
          Yeni Atribut Əlavə Et
        </Button>
      </div>

      {/* Attributes List */}
      {attributes.length === 0 ? (
        <div className={cn(
          "text-center py-12 rounded-lg border-2 border-dashed",
          theme === "light"
            ? "bg-white border-neutral-300 text-neutral-500"
            : "bg-neutral-800 border-neutral-600 text-neutral-400"
        )}>
          <p>Hələ atribut yoxdur</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attributes.map((attribute) => (
            <div
              key={attribute.id}
              className={cn(
                "rounded-lg border p-6",
                theme === "light"
                  ? "bg-white border-neutral-200"
                  : "bg-neutral-800 border-neutral-700"
              )}
            >
              {/* Attribute Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={cn(
                      "text-lg font-semibold",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>
                      {attribute.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAttribute(attribute)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          theme === "light"
                            ? "hover:bg-neutral-100 text-neutral-600"
                            : "hover:bg-neutral-700 text-neutral-400"
                        )}
                        title="Redaktə et"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteAttribute(attribute.id)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          theme === "light"
                            ? "hover:bg-red-50 text-red-600"
                            : "hover:bg-red-900/20 text-red-400"
                        )}
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className={cn(
                      "text-sm",
                      theme === "light" ? "text-neutral-600" : "text-neutral-400"
                    )}>
                      Göstərilən: <span className="font-medium">{attribute.displayName}</span>
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={cn(
                        theme === "light" ? "text-neutral-600" : "text-neutral-400"
                      )}>
                        Tip: <span className="font-medium">{attribute.attributeType}</span>
                      </span>
                      <span className={cn(
                        theme === "light" ? "text-neutral-600" : "text-neutral-400"
                      )}>
                        Tələb olunur:{" "}
                        <span className="font-medium">
                          {attribute.isRequired ? "Bəli" : "Xeyr"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Values Section */}
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={cn(
                    "text-sm font-medium",
                    theme === "light" ? "text-neutral-700" : "text-neutral-300"
                  )}>
                    Dəyərlər ({attribute.values.length})
                  </h4>
                  <Button
                    variant="outline"
                    icon={<Plus size={14} />}
                    onClick={() => handleAddValue(attribute.id)}
                    className="text-xs px-2 py-1"
                  >
                    Dəyər Əlavə Et
                  </Button>
                </div>

                {attribute.values.length === 0 ? (
                  <p className={cn(
                    "text-sm text-center py-4",
                    theme === "light" ? "text-neutral-400" : "text-neutral-500"
                  )}>
                    Hələ dəyər yoxdur
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attribute.values.map((value) => (
                      <div
                        key={value.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded border",
                          theme === "light"
                            ? "bg-neutral-50 border-neutral-200"
                            : "bg-neutral-900 border-neutral-700"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className={cn(
                            "font-medium",
                            theme === "light" ? "text-neutral-900" : "text-white"
                          )}>
                            {value.value}
                          </span>
                          {value.displayValue && (
                            <span className={cn(
                              "text-sm",
                              theme === "light" ? "text-neutral-600" : "text-neutral-400"
                            )}>
                              ({value.displayValue})
                            </span>
                          )}
                          {value.colorCode && (
                            <>
                              <span
                                className="w-5 h-5 rounded border border-neutral-300"
                                style={{ backgroundColor: value.colorCode }}
                              />
                              <span className={cn(
                                "text-xs font-mono",
                                theme === "light" ? "text-neutral-500" : "text-neutral-400"
                              )}>
                                {value.colorCode}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditValue(value, attribute.id)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              theme === "light"
                                ? "hover:bg-neutral-100 text-neutral-600"
                                : "hover:bg-neutral-700 text-neutral-400"
                            )}
                            title="Redaktə et"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteValue(value.id!)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              theme === "light"
                                ? "hover:bg-red-50 text-red-600"
                                : "hover:bg-red-900/20 text-red-400"
                            )}
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attribute Modal */}
      <Modal
        open={isAttributeModalOpen}
        onClose={() => {
          setIsAttributeModalOpen(false);
          setEditingAttribute(null);
          setAttributeForm({
            name: "",
            displayName: "",
            attributeType: "",
            isRequired: false,
            displayOrder: 0,
          });
        }}
        title={editingAttribute ? "Atribut Redaktə Et" : "Yeni Atribut"}
      >
        <form onSubmit={handleSubmitAttribute} className="space-y-4">
          <Input
            label="Atribut adı"
            required
            placeholder="Storage, Color, RAM"
            value={attributeForm.name}
            onChange={(e) =>
              setAttributeForm({ ...attributeForm, name: e.target.value })
            }
          />
          <Input
            label="Göstərilən ad"
            required
            placeholder="Yaddaş seçin, Rəng seçin"
            value={attributeForm.displayName}
            onChange={(e) =>
              setAttributeForm({ ...attributeForm, displayName: e.target.value })
            }
          />
          <Select
            label="Atribut tipi"
            required
            options={attributeTypeOptions}
            placeholder="Seçin"
            value={attributeForm.attributeType}
            onChange={(e) =>
              setAttributeForm({ ...attributeForm, attributeType: e.target.value })
            }
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={attributeForm.isRequired}
              onChange={(e) =>
                setAttributeForm({ ...attributeForm, isRequired: e.target.checked })
              }
              className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
            />
            <label
              htmlFor="isRequired"
              className={cn(
                "text-sm",
                theme === "light" ? "text-neutral-700" : "text-neutral-300"
              )}
            >
              Məcburi
            </label>
          </div>
          <Input
            label="Göstərilmə sırası"
            type="number"
            value={attributeForm.displayOrder}
            onChange={(e) =>
              setAttributeForm({
                ...attributeForm,
                displayOrder: Number(e.target.value),
              })
            }
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAttributeModalOpen(false);
                setEditingAttribute(null);
              }}
            >
              Ləğv et
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={
                createAttributeMutation.isPending ||
                updateAttributeMutation.isPending
              }
            >
              {editingAttribute ? "Yenilə" : "Yarat"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Value Modal */}
      <Modal
        open={isValueModalOpen}
        onClose={() => {
          setIsValueModalOpen(false);
          setEditingValue(null);
          setSelectedAttributeId(null);
          setValueForm({
            value: "",
            displayValue: "",
            displayOrder: 0,
            colorCode: "",
          });
        }}
        title={editingValue ? "Dəyər Redaktə Et" : "Yeni Dəyər"}
      >
        <form onSubmit={handleSubmitValue} className="space-y-4">
          <Input
            label="Dəyər"
            required
            placeholder="128GB, Black"
            value={valueForm.value}
            onChange={(e) =>
              setValueForm({ ...valueForm, value: e.target.value })
            }
          />
          <Input
            label="Göstərilən dəyər"
            placeholder="128 GB, Qara"
            value={valueForm.displayValue}
            onChange={(e) =>
              setValueForm({ ...valueForm, displayValue: e.target.value })
            }
          />
          {selectedAttributeId &&
            attributes.find((a) => a.id === selectedAttributeId)?.attributeType ===
              "Color" && (
              <div className="space-y-2">
                <label className={cn(
                  "text-sm font-medium",
                  theme === "light" ? "text-neutral-700" : "text-neutral-300"
                )}>
                  Rəng kodu
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={valueForm.colorCode || "#000000"}
                    onChange={(e) =>
                      setValueForm({ ...valueForm, colorCode: e.target.value })
                    }
                    className="w-16 h-10"
                  />
                  <Input
                    placeholder="#000000"
                    value={valueForm.colorCode}
                    onChange={(e) =>
                      setValueForm({ ...valueForm, colorCode: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          <Input
            label="Göstərilmə sırası"
            type="number"
            value={valueForm.displayOrder}
            onChange={(e) =>
              setValueForm({
                ...valueForm,
                displayOrder: Number(e.target.value),
              })
            }
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsValueModalOpen(false);
                setEditingValue(null);
                setSelectedAttributeId(null);
              }}
            >
              Ləğv et
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={
                createValueMutation.isPending || updateValueMutation.isPending
              }
            >
              {editingValue ? "Yenilə" : "Əlavə et"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Value Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteValueModalOpen}
        title="Dəyər sil"
        message="Bu dəyəri silmək istədiyinizə əminsiniz?"
        confirmLabel="Sil"
        variant="danger"
        onConfirm={() => {
          if (deleteValueId) {
            deleteValueMutation.mutate(deleteValueId);
          }
        }}
        onCancel={() => {
          setIsDeleteValueModalOpen(false);
          setDeleteValueId(null);
        }}
        isLoading={deleteValueMutation.isPending}
      />
    </div>
  );
};

