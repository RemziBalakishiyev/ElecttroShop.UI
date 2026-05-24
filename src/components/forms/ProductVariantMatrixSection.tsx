import React from "react";
import { Plus, Trash2, Grid3x3, ImagePlus } from "lucide-react";
import { Button } from "../commons/Button";
import { Select } from "../commons/Select";
import { Checkbox } from "../commons/Checkbox";
import { FileUpload } from "../commons/FileUpload";
import type {
  EffectiveAttribute,
  FormVariantRow,
  AttributeTypeRegistry,
} from "../../utils/productAttributes";
import {
  generateVariantCombinations,
  normalizeVariantAttributes,
  registerCanonicalAttributeType,
  variantCombinationKey,
} from "../../utils/productAttributes";

interface ProductVariantMatrixSectionProps {
  variants: FormVariantRow[];
  onChange: (variants: FormVariantRow[]) => void;
  effectiveAttributes: EffectiveAttribute[];
  registry: AttributeTypeRegistry;
}

const newLocalKey = () =>
  `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const ProductVariantMatrixSection: React.FC<
  ProductVariantMatrixSectionProps
> = ({ variants, onChange, effectiveAttributes, registry }) => {
  const updateVariant = (index: number, patch: Partial<FormVariantRow>) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const updateVariantAttribute = (
    index: number,
    attributeType: string,
    value: string
  ) => {
    const variant = variants[index];
    const canonical = registerCanonicalAttributeType(registry, attributeType);
    const attrs = { ...(variant.attributes || {}) };
    if (value) {
      attrs[canonical] = value;
    } else {
      delete attrs[canonical];
    }
    updateVariant(index, {
      attributes: normalizeVariantAttributes(attrs, registry),
    });
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const addEmptyVariant = () => {
    onChange([
      ...variants,
      {
        _localKey: newLocalKey(),
        attributes: {},
        isActive: true,
        imageId: null,
      },
    ]);
  };

  const generateCombinations = () => {
    const combos = generateVariantCombinations(effectiveAttributes);
    if (combos.length === 0) return;

    const existingActive = new Set(
      variants
        .filter((v) => v.isActive !== false)
        .map((v) =>
          variantCombinationKey(
            normalizeVariantAttributes(v.attributes || {}, registry)
          )
        )
    );

    const toAdd: FormVariantRow[] = [];
    for (const attrs of combos) {
      const normalized = normalizeVariantAttributes(attrs, registry);
      const key = variantCombinationKey(normalized);
      if (existingActive.has(key)) continue;
      existingActive.add(key);
      toAdd.push({
        _localKey: newLocalKey(),
        attributes: normalized,
        isActive: true,
        imageId: null,
      });
    }

    onChange([...variants, ...toAdd]);
  };

  return (
    <section className="rounded-xl border border-neutral-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">Variantlar</span>
          <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {variants.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {effectiveAttributes.some((a) => a.values.length > 0) && (
            <Button
              type="button"
              variant="outline"
              icon={<Grid3x3 size={16} />}
              onClick={generateCombinations}
            >
              Kombinasiyalar yarat
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            icon={<Plus size={16} />}
            onClick={addEmptyVariant}
          >
            Variant əlavə et
          </Button>
        </div>
      </div>

      {effectiveAttributes.length > 0 && (
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
          <p className="text-xs font-semibold text-neutral-600 mb-2">
            Effektiv atributlar
          </p>
          <div className="flex flex-wrap gap-2">
            {effectiveAttributes.map((attr) => (
              <span
                key={attr.attributeType}
                className="text-xs px-2.5 py-1 bg-white border border-neutral-200 rounded-full text-neutral-700"
              >
                {attr.displayName}
                {attr.isRequired && (
                  <span className="text-red-500 ml-1">*</span>
                )}
                :{" "}
                {attr.values.length > 0
                  ? attr.values
                      .map((v) => v.displayValue || v.value)
                      .join(", ")
                  : "—"}
              </span>
            ))}
          </div>
        </div>
      )}

      {variants.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
          Variant yoxdur. Kombinasiya yaradın və ya əl ilə əlavə edin.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[640px] text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                <th className="py-2 pr-2 w-8">#</th>
                {effectiveAttributes.map((attr) => (
                  <th key={attr.attributeType} className="py-2 pr-2 font-medium">
                    {attr.displayName}
                    {attr.isRequired && (
                      <span className="text-red-500"> *</span>
                    )}
                  </th>
                ))}
                <th className="py-2 pr-2">Aktiv</th>
                <th className="py-2 pr-2">Şəkil</th>
                <th className="py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, idx) => (
                <tr
                  key={variant.id || variant._localKey || `row-${idx}`}
                  className="border-b border-neutral-100 align-top"
                >
                  <td className="py-3 pr-2 text-neutral-400">{idx + 1}</td>
                  {effectiveAttributes.map((attr) => (
                    <td key={attr.attributeType} className="py-2 pr-2 min-w-[120px]">
                      {attr.values.length > 0 ? (
                        <Select
                          options={[
                            { label: "—", value: "" },
                            ...attr.values.map((v) => ({
                              label: v.displayValue || v.value,
                              value: v.value,
                            })),
                          ]}
                          value={
                            variant.attributes?.[attr.attributeType] || ""
                          }
                          onChange={(e) =>
                            updateVariantAttribute(
                              idx,
                              attr.attributeType,
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg"
                          value={
                            variant.attributes?.[attr.attributeType] || ""
                          }
                          onChange={(e) =>
                            updateVariantAttribute(
                              idx,
                              attr.attributeType,
                              e.target.value
                            )
                          }
                          placeholder={attr.attributeType}
                        />
                      )}
                    </td>
                  ))}
                  <td className="py-3 pr-2">
                    <Checkbox
                      label=""
                      checked={variant.isActive !== false}
                      onChange={(checked) =>
                        updateVariant(idx, { isActive: checked })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2 min-w-[140px]">
                    <FileUpload
                      accept="image/*"
                      placeholder="Şəkil"
                      className="[&>div]:py-2 [&>div]:text-xs"
                      onChange={(file) =>
                        updateVariant(idx, {
                          imageFile: file,
                          imageId: file ? variant.imageId : variant.imageId,
                        })
                      }
                    />
                    {variant.imageId && !variant.imageFile && (
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-1">
                        <ImagePlus size={12} /> mövcud şəkil
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label="Variantı sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Edit zamanı saxlanılmayan variantlar deaktiv olunur. Deaktiv variantların
        id-si saxlanılmalıdır — siyahıdan silməyin, yalnız &quot;Aktiv&quot;
        söndürün.
      </p>
    </section>
  );
};
