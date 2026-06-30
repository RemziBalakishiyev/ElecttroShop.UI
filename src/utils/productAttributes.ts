import type { CategoryAttribute } from "../core/api/categories.api";
import type {
  InlineProductAttribute,
  InlineProductAttributeValue,
  ProductVariantRequest,
} from "../core/api/products.api";

export type AttributeTypeRegistry = Map<string, string>;

export function attributeTypeKey(type: string): string {
  return type.trim().toLowerCase();
}

/** First-seen casing wins for a given attribute type key. */
export function registerCanonicalAttributeType(
  registry: AttributeTypeRegistry,
  attributeType: string
): string {
  const trimmed = attributeType.trim();
  if (!trimmed) return "";
  const key = attributeTypeKey(trimmed);
  const existing = registry.get(key);
  if (existing) return existing;
  registry.set(key, trimmed);
  return trimmed;
}

export function normalizeVariantAttributes(
  attributes: Record<string, string>,
  registry: AttributeTypeRegistry
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(attributes)) {
    const canonicalKey = registerCanonicalAttributeType(registry, rawKey);
    if (!canonicalKey) continue;
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (value) result[canonicalKey] = value;
  }
  return result;
}

export function variantCombinationKey(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}\x00${v}`)
    .join("\x01");
}

export interface EffectiveAttribute {
  attributeType: string;
  displayName: string;
  isRequired: boolean;
  values: { value: string; displayValue?: string; colorCode?: string | null }[];
  source: "category" | "inline";
}

export function mapCategoryAttributesToInline(
  categoryAttributes: CategoryAttribute[]
): InlineProductAttribute[] {
  return categoryAttributes.map((attr, index) => ({
    name: attr.name,
    displayName: attr.displayName,
    attributeType: attr.attributeType,
    isRequired: attr.isRequired,
    displayOrder: attr.displayOrder ?? index,
    values: (attr.values || []).map((v, valueIndex) => ({
      value: v.value,
      displayValue: v.displayValue,
      displayOrder: v.displayOrder ?? valueIndex,
      colorCode: v.colorCode ?? undefined,
    })),
  }));
}

export function buildEffectiveAttributes(
  categoryAttributes: CategoryAttribute[],
  inlineAttributes: InlineProductAttribute[]
): EffectiveAttribute[] {
  const registry: AttributeTypeRegistry = new Map();
  const byKey = new Map<string, EffectiveAttribute>();

  for (const attr of categoryAttributes) {
    const canonical = registerCanonicalAttributeType(registry, attr.attributeType);
    if (!canonical) continue;
    const key = attributeTypeKey(canonical);
    byKey.set(key, {
      attributeType: canonical,
      displayName: attr.displayName || attr.name || canonical,
      isRequired: attr.isRequired,
      values: (attr.values || []).map((v) => ({
        value: v.value,
        displayValue: v.displayValue,
        colorCode: v.colorCode,
      })),
      source: "category",
    });
  }

  for (const attr of inlineAttributes) {
    const canonical = registerCanonicalAttributeType(registry, attr.attributeType);
    if (!canonical) continue;
    const key = attributeTypeKey(canonical);
    const values = (attr.values || [])
      .filter((v) => v.value.trim())
      .map((v) => ({
        value: v.value.trim(),
        displayValue: v.displayValue,
        colorCode: v.colorCode,
      }));

    const existing = byKey.get(key);
    if (existing) {
      const seen = new Set(existing.values.map((v) => v.value));
      for (const v of values) {
        if (!seen.has(v.value)) {
          existing.values.push(v);
          seen.add(v.value);
        }
      }
      existing.isRequired = existing.isRequired || attr.isRequired;
      existing.displayName = attr.displayName || existing.displayName;
      existing.source = "inline";
    } else {
      byKey.set(key, {
        attributeType: canonical,
        displayName: attr.displayName || attr.name || canonical,
        isRequired: attr.isRequired,
        values,
        source: "inline",
      });
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => a.attributeType.localeCompare(b.attributeType)
  );
}

export function buildAttributeTypeRegistry(
  categoryAttributes: CategoryAttribute[],
  inlineAttributes: InlineProductAttribute[]
): AttributeTypeRegistry {
  const registry: AttributeTypeRegistry = new Map();
  for (const attr of categoryAttributes) {
    registerCanonicalAttributeType(registry, attr.attributeType);
  }
  for (const attr of inlineAttributes) {
    registerCanonicalAttributeType(registry, attr.attributeType);
  }
  return registry;
}

export interface FormValidationResult {
  valid: boolean;
  message?: string;
}

export function validateInlineAttributes(
  inlineAttributes: InlineProductAttribute[]
): FormValidationResult {
  const seenTypes = new Set<string>();

  for (const attr of inlineAttributes) {
    const type = attr.attributeType?.trim();
    const name = attr.name?.trim();
    if (!type || !name) {
      return {
        valid: false,
        message: "Inline atribut üçün ad və attributeType doldurulmalıdır.",
      };
    }

    const typeKey = attributeTypeKey(type);
    if (seenTypes.has(typeKey)) {
      return {
        valid: false,
        message: `"${type}" attributeType təkrarlanır (eyni tip, fərqli yazılış).`,
      };
    }
    seenTypes.add(typeKey);

    const validValues = (attr.values || []).filter((v) => v.value?.trim());
    if (validValues.length === 0) {
      return {
        valid: false,
        message: `"${attr.displayName || type}" atributu üçün ən azı bir dəyər daxil edilməlidir.`,
      };
    }

    const seenValues = new Set<string>();
    for (const val of validValues) {
      const v = val.value.trim();
      if (seenValues.has(v)) {
        return {
          valid: false,
          message: `"${attr.displayName || type}" atributunda "${v}" value təkrarlanır.`,
        };
      }
      seenValues.add(v);
    }
  }

  return { valid: true };
}

export function getRequiredAttributeTypes(
  categoryAttributes: CategoryAttribute[],
  inlineAttributes: InlineProductAttribute[],
  registry: AttributeTypeRegistry
): string[] {
  const required = new Set<string>();
  for (const attr of categoryAttributes) {
    if (attr.isRequired) {
      required.add(registerCanonicalAttributeType(registry, attr.attributeType));
    }
  }
  for (const attr of inlineAttributes) {
    if (attr.isRequired) {
      required.add(registerCanonicalAttributeType(registry, attr.attributeType));
    }
  }
  return Array.from(required).filter(Boolean);
}

export interface FormVariantRow extends ProductVariantRequest {
  imageFile?: File | null;
  _localKey?: string;
}

export function validateVariantsForSave(
  variants: FormVariantRow[],
  requiredTypes: string[],
  registry: AttributeTypeRegistry
): FormValidationResult {
  if (variants.length === 0) return { valid: true };

  const activeKeys = new Set<string>();

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const isActive = variant.isActive !== false;
    const attrs = normalizeVariantAttributes(variant.attributes || {}, registry);

    if (Object.keys(attrs).length === 0) {
      return {
        valid: false,
        message: `Variant ${i + 1}: atributlar boş ola bilməz.`,
      };
    }

    if (isActive) {
      for (const req of requiredTypes) {
        if (!attrs[req]) {
          return {
            valid: false,
            message: `Variant ${i + 1}: "${req}" tələb olunan atributdur.`,
          };
        }
      }

      const key = variantCombinationKey(attrs);
      if (activeKeys.has(key)) {
        return {
          valid: false,
          message: `Variant ${i + 1}: eyni aktiv kombinasiya artıq mövcuddur.`,
        };
      }
      activeKeys.add(key);
    }
  }

  return { valid: true };
}

export function validateCategoryChangeForSave(
  originalCategoryId: string | undefined,
  newCategoryId: string,
  variants: FormVariantRow[]
): FormValidationResult {
  if (!originalCategoryId || originalCategoryId === newCategoryId) {
    return { valid: true };
  }

  const hasActiveVariants = variants.some((v) => v.isActive !== false);
  if (hasActiveVariants && variants.length === 0) {
    return {
      valid: false,
      message:
        "Kateqoriya dəyişdirildikdə aktiv variantlar varsa, variantlar yenidən təyin edilməlidir.",
    };
  }

  return { valid: true };
}

export function prepareInlineAttributesForApi(
  inlineAttributes: InlineProductAttribute[],
  registry: AttributeTypeRegistry
): InlineProductAttribute[] {
  const result: InlineProductAttribute[] = [];

  inlineAttributes.forEach((attr, attrIndex) => {
    const attributeType = registerCanonicalAttributeType(
      registry,
      attr.attributeType
    );
    if (!attributeType) return;

    const values: InlineProductAttributeValue[] = [];
    (attr.values || []).forEach((v, valueIndex) => {
      const value = v.value.trim();
      if (!value) return;
      const entry: InlineProductAttributeValue = {
        value,
        displayOrder: v.displayOrder ?? valueIndex,
      };
      const displayValue = v.displayValue?.trim();
      if (displayValue) entry.displayValue = displayValue;
      const colorCode = v.colorCode?.trim();
      if (colorCode) entry.colorCode = colorCode;
      values.push(entry);
    });

    if (values.length === 0) return;

    result.push({
      name: attr.name.trim(),
      displayName: (attr.displayName || attr.name).trim(),
      attributeType,
      isRequired: attr.isRequired,
      displayOrder: attr.displayOrder ?? attrIndex,
      values,
    });
  });

  return result;
}

export function generateVariantCombinations(
  effectiveAttributes: EffectiveAttribute[]
): Record<string, string>[] {
  const attrsWithValues = effectiveAttributes.filter((a) => a.values.length > 0);
  if (attrsWithValues.length === 0) return [];

  const results: Record<string, string>[] = [];

  function recurse(
    index: number,
    current: Record<string, string>
  ): void {
    if (index >= attrsWithValues.length) {
      results.push({ ...current });
      return;
    }
    const attr = attrsWithValues[index];
    for (const val of attr.values) {
      recurse(index + 1, {
        ...current,
        [attr.attributeType]: val.value,
      });
    }
  }

  recurse(0, {});
  return results;
}

const PRODUCT_VARIANT_ERROR_MESSAGES: Record<string, string> = {
  "ProductVariant.AttributeDuplicateConstraint": "Bu attribute artıq kateqoriyada mövcuddur",
  "ProductVariant.AttributeAlreadyExists": "Bu attribute artıq kateqoriyada mövcuddur",
  "ProductVariant.ValueDuplicateConstraint": "Bu value artıq attribute üçün mövcuddur",
  "ProductVariant.ValueAlreadyExists": "Bu value artıq attribute üçün mövcuddur",
  "ProductVariant.DuplicateCombination": "Bu variant kombinasiyası artıq mövcuddur",
  "ProductVariant.CategoryChangeIncompatible":
    "Kateqoriya dəyişdirilə bilməz: aktiv variantlar mövcuddur. Variantları yenidən təyin edin və ya deaktiv edin.",
  "Product.ConcurrencyConflict":
    "Məhsul başqa istifadəçi tərəfindən yenilənib. Zəhmət olmasa səhifəni yeniləyib yenidən cəhd edin.",
  "Entity.ConcurrencyConflict":
    "Məhsul başqa istifadəçi tərəfindən yenilənib. Zəhmət olmasa səhifəni yeniləyib yenidən cəhd edin.",
};

export function mapProductSaveErrorMessage(err: unknown): string {
  const apiErr = err as {
    error?: { code?: string; message?: string };
    isSuccess?: boolean;
  };

  const code = apiErr?.error?.code;
  if (code) {
    if (code === "ProductVariant.RequiredAttributeMissing") {
      return apiErr.error?.message || "Tələb olunan atribut çatışmır.";
    }
    const mapped = PRODUCT_VARIANT_ERROR_MESSAGES[code];
    if (mapped) return mapped;
  }

  if (apiErr?.error?.message) return apiErr.error.message;
  if (err instanceof Error) return err.message;
  return "Məhsul saxlanıla bilmədi.";
}

export function isConcurrencyConflictError(err: unknown): boolean {
  const code = (err as { error?: { code?: string } })?.error?.code;
  return (
    code === "Product.ConcurrencyConflict" ||
    code === "Entity.ConcurrencyConflict"
  );
}
