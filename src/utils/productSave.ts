import { imagesApi } from "../core/api/images.api";
import type {
  CreateProductRequest,
  InlineProductAttribute,
  Product,
  ProductVariantRequest,
  UpdateProductRequest,
} from "../core/api/products.api";
import { buildProductImageIdsForSave } from "../core/api/products.api";
import type { CategoryAttribute } from "../core/api/categories.api";
import { unwrapApiData } from "./apiResponse";
import {
  buildAttributeTypeRegistry,
  type FormVariantRow,
  normalizeVariantAttributes,
  prepareInlineAttributesForApi,
  validateCategoryChangeForSave,
  validateInlineAttributes,
  validateVariantsForSave,
  getRequiredAttributeTypes,
} from "./productAttributes";

export interface ProductFormSubmitData {
  itemName: string;
  description?: string;
  price: string | number;
  currency?: string;
  itemNumber?: string;
  category: string;
  manufacturer: string;
  amount: string | number;
  images?: File[];
  existingImageIds?: string[];
  inlineAttributes?: InlineProductAttribute[];
  variants?: FormVariantRow[];
  rowVersion?: number;
  originalCategoryId?: string;
}

export interface ProductSaveValidationResult {
  valid: boolean;
  message?: string;
}

export function validateProductFormForSave(
  formData: ProductFormSubmitData,
  categoryAttributes: CategoryAttribute[]
): ProductSaveValidationResult {
  const inlineAttributes = formData.inlineAttributes ?? [];
  const variants = formData.variants ?? [];
  const registry = buildAttributeTypeRegistry(categoryAttributes, inlineAttributes);

  const inlineResult = validateInlineAttributes(inlineAttributes);
  if (!inlineResult.valid) return inlineResult;

  const requiredTypes = getRequiredAttributeTypes(
    categoryAttributes,
    inlineAttributes,
    registry
  );
  const variantsResult = validateVariantsForSave(
    variants,
    requiredTypes,
    registry
  );
  if (!variantsResult.valid) return variantsResult;

  const categoryResult = validateCategoryChangeForSave(
    formData.originalCategoryId,
    formData.category,
    variants
  );
  if (!categoryResult.valid) return categoryResult;

  return { valid: true };
}

export async function processVariantsForSave(
  variants: FormVariantRow[],
  registry: ReturnType<typeof buildAttributeTypeRegistry>
): Promise<ProductVariantRequest[]> {
  const processed: ProductVariantRequest[] = [];

  for (const variant of variants) {
    let variantImageId = variant.imageId ?? null;

    if (variant.imageFile) {
      try {
        const imageResponse = await imagesApi.uploadImage(variant.imageFile);
        const imageData = unwrapApiData<{ imageId?: string; id?: string }>(
          imageResponse
        );
        variantImageId = imageData?.imageId || imageData?.id || null;
      } catch {
        // Continue without variant image if upload fails
      }
    }

    const attributes = normalizeVariantAttributes(
      variant.attributes || {},
      registry
    );

    const payload: ProductVariantRequest = {
      attributes,
      isActive: variant.isActive !== false,
      ...(variantImageId ? { imageId: variantImageId } : { imageId: null }),
    };

    if (variant.id) {
      payload.id = variant.id;
    }

    processed.push(payload);
  }

  return processed;
}

export async function buildCreateProductPayload(
  formData: ProductFormSubmitData,
  categoryAttributes: CategoryAttribute[],
  imageIds: string[]
): Promise<CreateProductRequest> {
  const inlineAttributes = formData.inlineAttributes ?? [];
  const registry = buildAttributeTypeRegistry(categoryAttributes, inlineAttributes);
  const processedVariants = await processVariantsForSave(
    formData.variants ?? [],
    registry
  );
  const preparedInline = prepareInlineAttributesForApi(
    inlineAttributes,
    registry
  );

  return {
    name: formData.itemName,
    description: formData.description || null,
    price: Number(formData.price),
    currency: formData.currency || "AZN",
    sku: formData.itemNumber || "",
    categoryId: formData.category,
    brandId: formData.manufacturer,
    stock: Number(formData.amount),
    vatRate: 0.18,
    ...(imageIds.length > 0 && { imageIds }),
    inlineAttributes: preparedInline,
    ...(processedVariants.length > 0 && { variants: processedVariants }),
  };
}

export async function buildUpdateProductPayload(
  formData: ProductFormSubmitData,
  categoryAttributes: CategoryAttribute[],
  product?: Pick<Product, "images" | "imageId"> | null
): Promise<UpdateProductRequest> {
  if (formData.rowVersion === undefined || formData.rowVersion === null) {
    throw new Error("rowVersion tələb olunur");
  }

  const inlineAttributes = formData.inlineAttributes ?? [];
  const registry = buildAttributeTypeRegistry(categoryAttributes, inlineAttributes);
  const processedVariants = await processVariantsForSave(
    formData.variants ?? [],
    registry
  );
  const preparedInline = prepareInlineAttributesForApi(
    inlineAttributes,
    registry
  );

  const imageIds = await buildProductImageIdsForSave(
    formData.existingImageIds,
    formData.images,
    product
  );

  return {
    name: formData.itemName,
    description: formData.description || null,
    price: Number(formData.price),
    currency: formData.currency || "AZN",
    categoryId: formData.category,
    brandId: formData.manufacturer,
    stock: Number(formData.amount),
    vatRate: 0.18,
    rowVersion: formData.rowVersion,
    ...(imageIds.length > 0 && { imageIds }),
    inlineAttributes: preparedInline,
    variants: processedVariants,
  };
}
