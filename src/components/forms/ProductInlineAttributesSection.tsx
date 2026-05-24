import React from "react";
import { Plus, Trash2, ListTree } from "lucide-react";
import { Button } from "../commons/Button";
import { Input } from "../commons/Input";
import { Select } from "../commons/Select";
import { Checkbox } from "../commons/Checkbox";
import type { CategoryAttribute } from "../../core/api/categories.api";
import type { InlineProductAttribute } from "../../core/api/products.api";
import {
  attributeTypeKey,
  registerCanonicalAttributeType,
  type AttributeTypeRegistry,
} from "../../utils/productAttributes";

interface ProductInlineAttributesSectionProps {
  inlineAttributes: InlineProductAttribute[];
  onChange: (attrs: InlineProductAttribute[]) => void;
  categoryAttributes: CategoryAttribute[];
  registry: AttributeTypeRegistry;
}

const newInlineAttribute = (
  categoryAttr?: CategoryAttribute
): InlineProductAttribute => {
  if (categoryAttr) {
    return {
      name: categoryAttr.name,
      displayName: categoryAttr.displayName,
      attributeType: categoryAttr.attributeType,
      isRequired: categoryAttr.isRequired,
      displayOrder: categoryAttr.displayOrder ?? 0,
      values: (categoryAttr.values || []).map((v, i) => ({
        value: v.value,
        displayValue: v.displayValue,
        displayOrder: v.displayOrder ?? i,
        colorCode: v.colorCode ?? undefined,
      })),
    };
  }
  return {
    name: "",
    displayName: "",
    attributeType: "",
    isRequired: false,
    displayOrder: 0,
    values: [{ value: "", displayOrder: 0 }],
  };
};

export const ProductInlineAttributesSection: React.FC<
  ProductInlineAttributesSectionProps
> = ({ inlineAttributes, onChange, categoryAttributes, registry }) => {
  const usedTypeKeys = new Set(
    inlineAttributes.map((a) => attributeTypeKey(a.attributeType || ""))
  );

  const availableCategoryAttrs = categoryAttributes.filter(
    (ca) => !usedTypeKeys.has(attributeTypeKey(ca.attributeType))
  );

  const addFromCategory = (categoryAttrId: string) => {
    const attr = categoryAttributes.find((a) => a.id === categoryAttrId);
    if (!attr) return;
    const canonical = registerCanonicalAttributeType(
      registry,
      attr.attributeType
    );
    if (
      inlineAttributes.some(
        (a) => attributeTypeKey(a.attributeType) === attributeTypeKey(canonical)
      )
    ) {
      return;
    }
    onChange([
      ...inlineAttributes,
      {
        ...newInlineAttribute(attr),
        attributeType: canonical,
        displayOrder: inlineAttributes.length,
      },
    ]);
  };

  const updateAttr = (
    index: number,
    patch: Partial<InlineProductAttribute>
  ) => {
    const next = [...inlineAttributes];
    const current = { ...next[index], ...patch };

    if (patch.attributeType !== undefined) {
      const canonical = registerCanonicalAttributeType(
        registry,
        patch.attributeType
      );
      const key = attributeTypeKey(canonical);
      const duplicate = inlineAttributes.some(
        (a, i) => i !== index && attributeTypeKey(a.attributeType) === key
      );
      if (duplicate) return;
      current.attributeType = canonical;
      current.name = current.name || canonical;
      current.displayName = current.displayName || canonical;
    }

    next[index] = current;
    onChange(next);
  };

  const removeAttr = (index: number) => {
    onChange(inlineAttributes.filter((_, i) => i !== index));
  };

  const updateValue = (
    attrIndex: number,
    valueIndex: number,
    patch: Partial<InlineProductAttribute["values"][0]>
  ) => {
    const attr = inlineAttributes[attrIndex];
    const values = [...attr.values];
    values[valueIndex] = { ...values[valueIndex], ...patch };
    updateAttr(attrIndex, { values });
  };

  const addValue = (attrIndex: number) => {
    const attr = inlineAttributes[attrIndex];
    updateAttr(attrIndex, {
      values: [
        ...attr.values,
        { value: "", displayOrder: attr.values.length },
      ],
    });
  };

  const removeValue = (attrIndex: number, valueIndex: number) => {
    const attr = inlineAttributes[attrIndex];
    updateAttr(attrIndex, {
      values: attr.values.filter((_, i) => i !== valueIndex),
    });
  };

  return (
    <section className="rounded-xl border border-neutral-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListTree size={16} className="text-neutral-500" />
          <span className="text-sm font-semibold text-neutral-800">
            Inline atributlar
          </span>
          <span className="text-xs text-neutral-500">(optional)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableCategoryAttrs.length > 0 && (
            <Select
              options={[
                { label: "Kateqoriyadan əlavə et…", value: "" },
                ...availableCategoryAttrs.map((a) => ({
                  label: a.displayName,
                  value: a.id,
                })),
              ]}
              value=""
              onChange={(e) => {
                if (e.target.value) addFromCategory(e.target.value);
              }}
              className="min-w-[180px]"
            />
          )}
          <Button
            type="button"
            variant="outline"
            icon={<Plus size={16} />}
            onClick={() =>
              onChange([
                ...inlineAttributes,
                {
                  ...newInlineAttribute(),
                  displayOrder: inlineAttributes.length,
                },
              ])
            }
          >
            Yeni atribut
          </Button>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Tam admin rejimi: atribut metadata (displayValue, rəng kodu) ilə birlikdə
        saxlanır. Yalnız variant göndərsəniz, backend variant açarlarından schema
        yaradır.
      </p>

      {inlineAttributes.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-4 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
          Inline atribut yoxdur. Kateqoriya atributlarından seçin və ya yenisini
          əlavə edin.
        </p>
      ) : (
        <div className="space-y-4">
          {inlineAttributes.map((attr, attrIndex) => (
            <div
              key={`inline-${attrIndex}-${attr.attributeType}`}
              className="p-4 bg-neutral-50/80 border border-neutral-200 rounded-xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-neutral-800">
                  Atribut {attrIndex + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeAttr(attrIndex)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                  aria-label="Atributu sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="attributeType (canonical açar)"
                  required
                  value={attr.attributeType}
                  onChange={(e) =>
                    updateAttr(attrIndex, { attributeType: e.target.value })
                  }
                  placeholder="RAM, Color…"
                />
                <Input
                  label="displayName"
                  required
                  value={attr.displayName}
                  onChange={(e) =>
                    updateAttr(attrIndex, {
                      displayName: e.target.value,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <Checkbox
                label="Tələb olunur (isRequired)"
                checked={attr.isRequired}
                onChange={(checked) =>
                  updateAttr(attrIndex, { isRequired: checked })
                }
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-600">
                    Value-lar (case-sensitive: 16GB ≠ 16gb)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    icon={<Plus size={14} />}
                    onClick={() => addValue(attrIndex)}
                  >
                    Value
                  </Button>
                </div>
                {attr.values.map((val, valueIndex) => (
                  <div
                    key={valueIndex}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end"
                  >
                    <Input
                      label="value"
                      required
                      value={val.value}
                      onChange={(e) =>
                        updateValue(attrIndex, valueIndex, {
                          value: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="displayValue"
                      value={val.displayValue || ""}
                      onChange={(e) =>
                        updateValue(attrIndex, valueIndex, {
                          displayValue: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="colorCode"
                      value={val.colorCode || ""}
                      onChange={(e) =>
                        updateValue(attrIndex, valueIndex, {
                          colorCode: e.target.value,
                        })
                      }
                      placeholder="#000000"
                    />
                    <div className="flex gap-2 pb-1">
                      <button
                        type="button"
                        onClick={() => removeValue(attrIndex, valueIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Value sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
