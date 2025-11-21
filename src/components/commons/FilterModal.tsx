import React, { useState } from "react";
import { Button } from "./Button";
import { Select } from "./Select";
import { X } from "lucide-react";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: {
    selectedStores: string[];
    storeLocation: string | null;
  }) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onApply,
}) => {
  const [selectedStores, setSelectedStores] = useState<string[]>(["hq"]);
  const [storeLocation, setStoreLocation] = useState<string | null>(null);

  if (!open) return null;

  const handleStoreCheckboxChange = (storeValue: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeValue)
        ? prev.filter((s) => s !== storeValue)
        : [...prev, storeValue]
    );
  };

  const handleApply = () => {
    onApply({ selectedStores, storeLocation });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const storeOptions = [
    { label: "HQ Main Store", value: "hq" },
    { label: "22 House Store", value: "22h" },
    { label: "Tafo House Store", value: "tafo" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 relative w-full max-w-md">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-neutral-900 mb-6">Filter</h2>

        <div className="space-y-6">
          {/* Store Section */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Store</h3>
            
            {/* Select Dropdown */}
            <div className="mb-4">
              <Select
                options={storeOptions}
                placeholder="Select store"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              {storeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2 cursor-pointer"
                    checked={selectedStores.includes(option.value)}
                    onChange={() => handleStoreCheckboxChange(option.value)}
                  />
                  <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Select Store Location Section */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-3">
              Select store
            </h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="storeLocation"
                  className="w-4 h-4 border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2 cursor-pointer"
                  checked={storeLocation === "office"}
                  onChange={() => setStoreLocation("office")}
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Office
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="storeLocation"
                  className="w-4 h-4 border-neutral-300 text-primary-500 focus:ring-primary-400 focus:ring-2 cursor-pointer"
                  checked={storeLocation === "wfh"}
                  onChange={() => setStoreLocation("wfh")}
                />
                <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                  Work from Home
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
          <Button variant="outline" onClick={handleCancel} className="px-6">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} className="px-6">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

