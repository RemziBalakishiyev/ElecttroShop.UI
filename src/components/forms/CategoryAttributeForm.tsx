import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '../commons/Button';
import { Input } from '../commons/Input';
import { Select } from '../commons/Select';
import { categoriesApi } from '../../core/api/categories.api';
import type { CreateAttributeValueRequest } from '../../core/api/categories.api';
import { useToast } from '../../core/providers/ToastContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useTheme } from '../../core/context/ThemeContext';

interface CategoryAttributeFormProps {
  categoryId: string;
  onSuccess?: (attribute: any) => void;
  onCancel?: () => void;
}

interface AttributeValue {
  value: string;
  displayValue: string;
  displayOrder: number;
  colorCode?: string | null;
}

export const CategoryAttributeForm: React.FC<CategoryAttributeFormProps> = ({
  categoryId,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const toast = useToast();

  const [attribute, setAttribute] = useState({
    name: '',
    displayName: '',
    type: '',
    isRequired: false,
    displayOrder: 0,
  });

  const [values, setValues] = useState<AttributeValue[]>([]);
  const [newValue, setNewValue] = useState<AttributeValue>({
    value: '',
    displayValue: '',
    displayOrder: 0,
    colorCode: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const attributeTypeOptions = [
    { label: 'Yaddaş', value: 'Storage' },
    { label: 'Rəng', value: 'Color' },
    { label: 'RAM', value: 'RAM' },
    { label: 'Ekran', value: 'Screen' },
    { label: 'Prosessor', value: 'Processor' },
  ];

  const handleAddValue = () => {
    if (!newValue.value.trim()) {
      toast.warning('Dəyər daxil edin');
      return;
    }

    setValues([
      ...values,
      {
        ...newValue,
        displayOrder: values.length,
        displayValue: newValue.displayValue || newValue.value,
      },
    ]);
    setNewValue({
      value: '',
      displayValue: '',
      displayOrder: 0,
      colorCode: null,
    });
  };

  const handleRemoveValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleCreateAttribute = async () => {
    if (!attribute.name.trim() || !attribute.displayName.trim() || !attribute.type) {
      toast.warning('Zəhmət olmasa bütün məcburi sahələri doldurun');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Atribut yarat
      const createdAttribute = await categoriesApi.createCategoryAttribute(categoryId, {
        name: attribute.name,
        displayName: attribute.displayName,
        attributeType: attribute.type,
        isRequired: attribute.isRequired,
        displayOrder: attribute.displayOrder,
      });

      const attributeId = (createdAttribute as any).value?.id || (createdAttribute as any).id;

      if (!attributeId) {
        throw new Error('Atribut ID alına bilmədi');
      }

      // 2. Dəyərləri əlavə et
      for (const val of values) {
        const valueData: CreateAttributeValueRequest = {
          value: val.value,
          displayValue: val.displayValue,
          displayOrder: val.displayOrder,
          colorCode: val.colorCode || null,
        };
        await categoriesApi.addAttributeValue(attributeId, valueData);
      }

      toast.success('Atribut uğurla yaradıldı');
      onSuccess?.(createdAttribute);

      // Reset form
      setAttribute({
        name: '',
        displayName: '',
        type: '',
        isRequired: false,
        displayOrder: 0,
      });
      setValues([]);
    } catch (error: any) {
      console.error('Atribut yaratma xətası:', error);
      toast.error(error?.message || 'Atribut yaradıla bilmədi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "space-y-6 p-6 rounded-lg border",
      theme === "light"
        ? "bg-white border-neutral-200"
        : "bg-neutral-800 border-neutral-700"
    )}>
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-semibold",
          theme === "light" ? "text-neutral-900" : "text-white"
        )}>
          Yeni Atribut
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className={cn(
              "text-neutral-400 hover:text-neutral-600 transition-colors",
              theme === "light" ? "hover:text-neutral-600" : "hover:text-neutral-300"
            )}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Atribut Məlumatları */}
      <div className="space-y-4">
        <h4 className={cn(
          "text-sm font-medium",
          theme === "light" ? "text-neutral-700" : "text-neutral-300"
        )}>
          Atribut Məlumatları
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Atribut adı"
            required
            placeholder="Storage, Color, RAM"
            value={attribute.name}
            onChange={(e) => setAttribute({ ...attribute, name: e.target.value })}
          />

          <Input
            label="Göstərilən ad"
            required
            placeholder="Yaddaş seçin, Rəng seçin"
            value={attribute.displayName}
            onChange={(e) => setAttribute({ ...attribute, displayName: e.target.value })}
          />

          <Select
            label="Atribut tipi"
            required
            options={attributeTypeOptions}
            placeholder="Seçin"
            value={attribute.type}
            onChange={(e) => setAttribute({ ...attribute, type: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isRequired"
              checked={attribute.isRequired}
              onChange={(e) => setAttribute({ ...attribute, isRequired: e.target.checked })}
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
        </div>
      </div>

      {/* Dəyərlər */}
      <div className="space-y-4">
        <h4 className={cn(
          "text-sm font-medium",
          theme === "light" ? "text-neutral-700" : "text-neutral-300"
        )}>
          Dəyərlər
        </h4>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Dəyər (128GB, Black)"
              value={newValue.value}
              onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
            />
            <Input
              placeholder="Göstərilən dəyər (128 GB, Qara)"
              value={newValue.displayValue}
              onChange={(e) => setNewValue({ ...newValue, displayValue: e.target.value })}
            />
            {attribute.type === 'Color' && (
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  placeholder="Rəng kodu"
                  value={newValue.colorCode || '#000000'}
                  onChange={(e) => setNewValue({ ...newValue, colorCode: e.target.value })}
                  className="h-10"
                />
                <Input
                  placeholder="#000000"
                  value={newValue.colorCode || ''}
                  onChange={(e) => setNewValue({ ...newValue, colorCode: e.target.value })}
                />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              icon={<Plus size={16} />}
              onClick={handleAddValue}
              className="w-full"
            >
              Dəyər Əlavə Et
            </Button>
          </div>

          {values.length > 0 && (
            <div className="space-y-2">
              {values.map((val, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded border",
                    theme === "light"
                      ? "bg-neutral-50 border-neutral-200"
                      : "bg-neutral-900 border-neutral-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-sm font-medium",
                      theme === "light" ? "text-neutral-900" : "text-white"
                    )}>
                      {val.displayValue || val.value}
                    </span>
                    {val.colorCode && (
                      <span
                        className="w-6 h-6 rounded border border-neutral-300"
                        style={{ backgroundColor: val.colorCode }}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(index)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} type="button">
            Ləğv et
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleCreateAttribute}
          disabled={isSubmitting}
          type="button"
        >
          {isSubmitting ? 'Yaradılır...' : 'Atribut Yarat'}
        </Button>
      </div>
    </div>
  );
};


