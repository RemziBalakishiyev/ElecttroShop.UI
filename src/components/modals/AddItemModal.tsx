import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { FileUpload } from "../commons/FileUpload";
import { DateInput } from "../commons/DateInput";
import { Textarea } from "../commons/Textarea";
import { Checkbox } from "../commons/Checkbox";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    // Left Column
    groupItem: false,
    consumableItem: false,
    type: "",
    image: null as File | null,
    serialNumber: "",
    unitOfMeasurement: "",
    price: "",
    currency: "",
    store: "",
    department: "",
    warranty: null as File | null,
    description: "",
    fixedAsset: false,
    
    // Right Column
    itemName: "",
    status: "",
    itemNumber: "",
    amount: "",
    dateOfPurchased: "",
    piDocument: null as File | null,
    project: "",
    category: "",
    manufacturer: "",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Sample options for selects
  const typeOptions = [
    { label: "Electronics", value: "electronics" },
    { label: "Furniture", value: "furniture" },
    { label: "Office Supplies", value: "office_supplies" },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Pending", value: "pending" },
  ];

  const unitOptions = [
    { label: "Piece (pcs)", value: "pcs" },
    { label: "Box", value: "box" },
    { label: "Set", value: "set" },
  ];

  const currencyOptions = [
    { label: "USD ($)", value: "usd" },
    { label: "EUR (€)", value: "eur" },
    { label: "AZN (₼)", value: "azn" },
  ];

  const storeOptions = [
    { label: "HQ Main Store", value: "hq" },
    { label: "22 House Store", value: "22h" },
    { label: "Tafo House Store", value: "tafo" },
  ];

  const departmentOptions = [
    { label: "IT Department", value: "it" },
    { label: "HR Department", value: "hr" },
    { label: "Finance Department", value: "finance" },
  ];

  const projectOptions = [
    { label: "Project Alpha", value: "alpha" },
    { label: "Project Beta", value: "beta" },
    { label: "Project Gamma", value: "gamma" },
  ];

  const categoryOptions = [
    { label: "IE Project Items", value: "ie_project" },
    { label: "Office Equipment", value: "office_equipment" },
    { label: "IT Equipment", value: "it_equipment" },
  ];

  const manufacturerOptions = [
    { label: "Apple", value: "apple" },
    { label: "Dell", value: "dell" },
    { label: "HP", value: "hp" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl relative w-full max-w-5xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">Add New Item</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Checkboxes */}
              <div className="flex gap-6">
                <Checkbox
                  label="Group Item"
                  checked={formData.groupItem}
                  onChange={(checked) =>
                    setFormData({ ...formData, groupItem: checked })
                  }
                />
                <Checkbox
                  label="Consumable Item"
                  checked={formData.consumableItem}
                  onChange={(checked) =>
                    setFormData({ ...formData, consumableItem: checked })
                  }
                />
              </div>

              <Select
                label="Type"
                required
                options={typeOptions}
                placeholder="Choose type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              />

              <FileUpload
                label="Image"
                required
                accept="image/*"
                onChange={(file) => setFormData({ ...formData, image: file })}
              />

              <Input
                label="Serial Number"
                required
                placeholder="Enter serial number"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />

              <Select
                label="Unit of Measurement"
                required
                options={unitOptions}
                placeholder="Choose unit of Measurement"
                value={formData.unitOfMeasurement}
                onChange={(e) =>
                  setFormData({ ...formData, unitOfMeasurement: e.target.value })
                }
              />

              <Input
                label="Price"
                required
                type="number"
                placeholder="Enter price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />

              <Select
                label="Currency"
                required
                options={currencyOptions}
                placeholder="Choose Currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
              />

              <Select
                label="Store"
                required
                options={storeOptions}
                placeholder="Choose Store"
                value={formData.store}
                onChange={(e) =>
                  setFormData({ ...formData, store: e.target.value })
                }
              />

              <Select
                label="Department"
                required
                options={departmentOptions}
                placeholder="Choose department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />

              <FileUpload
                label="Warranty"
                required
                accept=".pdf,.doc,.docx"
                onChange={(file) => setFormData({ ...formData, warranty: file })}
              />

              <Textarea
                label="Description"
                required
                placeholder="Input description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <Checkbox
                label="Fixed Asset"
                checked={formData.fixedAsset}
                onChange={(checked) =>
                  setFormData({ ...formData, fixedAsset: checked })
                }
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Input
                label="Item Name"
                required
                placeholder="Enter item name"
                value={formData.itemName}
                onChange={(e) =>
                  setFormData({ ...formData, itemName: e.target.value })
                }
              />

              <Select
                label="Status"
                required
                options={statusOptions}
                placeholder="Choose Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              />

              <Input
                label="Item Number"
                required
                placeholder="Enter item number"
                value={formData.itemNumber}
                onChange={(e) =>
                  setFormData({ ...formData, itemNumber: e.target.value })
                }
              />

              <Input
                label="Amount"
                required
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />

              <DateInput
                label="Date of Purchased"
                required
                value={formData.dateOfPurchased}
                onChange={(value) =>
                  setFormData({ ...formData, dateOfPurchased: value })
                }
              />

              <FileUpload
                label="PI Document"
                required
                accept=".pdf,.doc,.docx"
                onChange={(file) =>
                  setFormData({ ...formData, piDocument: file })
                }
              />

              <Select
                label="Project"
                required
                options={projectOptions}
                placeholder="Choose project"
                value={formData.project}
                onChange={(e) =>
                  setFormData({ ...formData, project: e.target.value })
                }
              />

              <Select
                label="Category"
                required
                options={categoryOptions}
                placeholder="Choose category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />

              <Select
                label="Manufacturer"
                required
                options={manufacturerOptions}
                placeholder="Choose manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
            <Button variant="outline" onClick={handleCancel} className="px-8">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="px-8">
              Add
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};



