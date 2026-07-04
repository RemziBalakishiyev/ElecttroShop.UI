import React, { useState } from "react";
import { Plus, Trash2, ListTree, Info, FileText, X } from "lucide-react";
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
import { parseProductSpecText } from "../../utils/parseProductSpec";

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
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  const handleImport = () => {
    const parsed = parseProductSpecText(importText);
    if (parsed.length === 0) return;

    const existingKeys = new Set(
      inlineAttributes.map((a) => attributeTypeKey(a.attributeType))
    );
    const newAttrs = parsed.filter(
      (a) => !existingKeys.has(attributeTypeKey(a.attributeType))
    );
    const baseOrder = inlineAttributes.length;
    onChange([
      ...inlineAttributes,
      ...newAttrs.map((a, i) => ({ ...a, displayOrder: baseOrder + i })),
    ]);
    setImportText("");
    setShowImport(false);
  };

  const usedTypeKeys = new Set(
    inlineAttributes.map((a) => attributeTypeKey(a.attributeType || ""))
  );

  const availableCategoryAttrs = categoryAttributes.filter(
    (ca) => !usedTypeKeys.has(attributeTypeKey(ca.attributeType))
  );

  const addFromCategory = (categoryAttrId: string) => {
    const attr = categoryAttributes.find((a) => a.id === categoryAttrId);
    if (!attr) return;
    const canonical = registerCanonicalAttributeType(registry, attr.attributeType);
    if (
      inlineAttributes.some(
        (a) => attributeTypeKey(a.attributeType) === attributeTypeKey(canonical)
      )
    ) return;
    onChange([
      ...inlineAttributes,
      { ...newInlineAttribute(attr), attributeType: canonical, displayOrder: inlineAttributes.length },
    ]);
  };

  const updateAttr = (index: number, patch: Partial<InlineProductAttribute>) => {
    const next = [...inlineAttributes];
    const current = { ...next[index], ...patch };

    if (patch.attributeType !== undefined) {
      const canonical = registerCanonicalAttributeType(registry, patch.attributeType);
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
      values: [...attr.values, { value: "", displayOrder: attr.values.length }],
    });
  };

  const removeValue = (attrIndex: number, valueIndex: number) => {
    const attr = inlineAttributes[attrIndex];
    updateAttr(attrIndex, {
      values: attr.values.filter((_, i) => i !== valueIndex),
    });
  };

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <ListTree size={14} className="text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-neutral-800">Inline atributlar</span>
          <span className="text-xs text-neutral-400 font-normal">(optional)</span>
          <div
            className="group relative"
            title="Atribut metadata (displayValue, rəng kodu) ilə birlikdə saxlanır. Yalnız variant göndərsəniz, backend variant açarlarından schema yaradır."
          >
            <Info size={13} className="text-neutral-400 cursor-help" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {availableCategoryAttrs.length > 0 && (
            <Select
              options={[
                { label: "Kateqoriyadan seç…", value: "" },
                ...availableCategoryAttrs.map((a) => ({
                  label: a.displayName,
                  value: a.id,
                })),
              ]}
              value=""
              onChange={(e) => { if (e.target.value) addFromCategory(e.target.value); }}
              className="text-sm min-w-[170px]"
            />
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImport((v) => !v)}
            className="gap-1.5 text-sm px-3 py-1.5"
          >
            <FileText size={14} />
            Mətndən import
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange([
                ...inlineAttributes,
                { ...newInlineAttribute(), displayOrder: inlineAttributes.length },
              ])
            }
            className="gap-1.5 text-sm px-3 py-1.5"
          >
            <Plus size={14} />
            Yeni atribut
          </Button>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-700">Spesifikasiya mətni yapışdırın</p>
            <button
              type="button"
              onClick={() => { setShowImport(false); setImportText(""); }}
              className="p-1 rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder={"Texniki Xüsusiyyətlər\n\n* Model: BR-7010\n* Yuma tutumu: 7.0 kq\n🔻\nƏsas üstünlükləri\n\n* 7 kq yuma tutumu\n* A+++ enerji səmərəliliyi"}
            className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y font-mono"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-indigo-500">
              Mövcud atributlarla üst-üstə düşənlər atlanacaq.
            </p>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="gap-1.5 text-sm px-4 py-1.5"
            >
              <Plus size={14} />
              İmport et
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {inlineAttributes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-2">
            <ListTree size={18} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 font-medium">Atribut yoxdur</p>
          <p className="text-xs text-neutral-400 mt-0.5">Kateqoriyadan seçin və ya yenisini əlavə edin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inlineAttributes.map((attr, attrIndex) => (
            /* KEY uses only attrIndex — NOT attr.attributeType.
               Including attributeType in the key caused remount on every keystroke → focus loss. */
            <div
              key={`attr-${attrIndex}`}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {attrIndex + 1}
                  </span>
                  <span className="text-sm font-semibold text-neutral-700">
                    {attr.displayName || attr.attributeType || `Atribut ${attrIndex + 1}`}
                  </span>
                  {attr.isRequired && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Tələb
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAttr(attrIndex)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Atributu sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Card body */}
              <div className="px-4 py-4 space-y-4">
                {/* attributeType + displayName */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="attributeType (canonical açar)"
                    required
                    value={attr.attributeType}
                    onChange={(e) =>
                      updateAttr(attrIndex, { attributeType: e.target.value })
                    }
                    placeholder="RAM, Color, Size…"
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
                    placeholder="Yaddaş, Rəng, Ölçü…"
                  />
                </div>

                <Checkbox
                  label="Tələb olunur (isRequired)"
                  checked={attr.isRequired}
                  onChange={(checked) => updateAttr(attrIndex, { isRequired: checked })}
                />

                {/* Values */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Dəyərlər
                      <span className="ml-1 font-normal text-neutral-400 normal-case">(case-sensitive: 16GB ≠ 16gb)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addValue(attrIndex)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus size={12} />
                      Dəyər əlavə et
                    </button>
                  </div>

                  {attr.values.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Hələ dəyər yoxdur</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Column headers */}
                      <div className="grid grid-cols-12 gap-2 px-1">
                        <span className="col-span-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">value *</span>
                        <span className="col-span-4 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">displayValue</span>
                        <span className="col-span-3 text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">colorCode</span>
                      </div>

                      {attr.values.map((val, valueIndex) => (
                        <div
                          key={valueIndex}
                          className="grid grid-cols-12 gap-2 items-center bg-neutral-50 rounded-lg px-2 py-2 border border-neutral-100"
                        >
                          <div className="col-span-4">
                            <input
                              type="text"
                              required
                              value={val.value}
                              onChange={(e) =>
                                updateValue(attrIndex, valueIndex, { value: e.target.value })
                              }
                              placeholder="16GB"
                              className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-colors"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={val.displayValue || ""}
                              onChange={(e) =>
                                updateValue(attrIndex, valueIndex, { displayValue: e.target.value })
                              }
                              placeholder="16 GB"
                              className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-colors"
                            />
                          </div>
                          <div className="col-span-3 flex items-center gap-1.5">
                            {val.colorCode ? (
                              <div
                                className="w-5 h-5 rounded-full border border-neutral-300 shrink-0 shadow-sm"
                                style={{ backgroundColor: val.colorCode }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-dashed border-neutral-300 shrink-0 bg-white" />
                            )}
                            <input
                              type="text"
                              value={val.colorCode || ""}
                              onChange={(e) =>
                                updateValue(attrIndex, valueIndex, { colorCode: e.target.value })
                              }
                              placeholder="#3B82F6"
                              className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-colors font-mono"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeValue(attrIndex, valueIndex)}
                              disabled={attr.values.length === 1}
                              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Dəyəri sil"
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
