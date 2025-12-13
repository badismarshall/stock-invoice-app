"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { product, category } from "@/db/schema";
import { eq, inArray, and, ne } from "drizzle-orm";
import { asc } from "drizzle-orm";

export async function addProduct(input: {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitOfMeasure: string;
  purchasePrice?: string;
  salePriceLocal?: string;
  salePriceExport?: string;
  taxRate?: string;
  isActive?: boolean;
}) {
  try {
    // Check if product code already exists
    const existingProduct = await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.code, input.code))
      .limit(1)
      .execute();

    if (existingProduct.length > 0) {
      return {
        data: null,
        error: `Le code produit "${input.code}" existe déjà. Veuillez utiliser un code différent.`,
      };
    }

    const id = generateId();

    await db.insert(product).values({
      id,
      code: input.code,
      name: input.name,
      description: input.description || null,
      categoryId: input.categoryId || null,
      unitOfMeasure: input.unitOfMeasure,
      purchasePrice: input.purchasePrice || "0",
      salePriceLocal: input.salePriceLocal || "0",
      salePriceExport: input.salePriceExport || null,
      taxRate: input.taxRate || "0",
      isActive: input.isActive ?? true,
    });

    updateTag("products");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding product", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteProduct(input: { id: string }) {
  try {
    await db.delete(product).where(eq(product.id, input.id));

    updateTag("products");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting product", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteProducts(input: { ids: string[] }) {
  try {
    await db.delete(product).where(inArray(product.id, input.ids));

    updateTag("products");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting products", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getProductById(input: { id: string }) {
  try {
    const { getProductById: getProductByIdDal } = await import("@/data/product/product.dal");
    const product = await getProductByIdDal(input.id);

    if (!product) {
      return {
        data: null,
        error: "Produit non trouvé",
      };
    }

    return {
      data: product,
      error: null,
    };
  } catch (err) {
    console.error("Error getting product by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateProduct(input: {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitOfMeasure: string;
  purchasePrice?: string;
  salePriceLocal?: string;
  salePriceExport?: string;
  taxRate?: string;
  isActive?: boolean;
}) {
  try {
    // Check if product code already exists (excluding current product)
    const existingProduct = await db
      .select({ id: product.id })
      .from(product)
      .where(and(
        eq(product.code, input.code),
        ne(product.id, input.id)
      ))
      .limit(1)
      .execute();

    if (existingProduct.length > 0) {
      return {
        data: null,
        error: `Le code produit "${input.code}" existe déjà. Veuillez utiliser un code différent.`,
      };
    }

    await db
      .update(product)
      .set({
        code: input.code,
        name: input.name,
        description: input.description || null,
        categoryId: input.categoryId || null,
        unitOfMeasure: input.unitOfMeasure,
        purchasePrice: input.purchasePrice || "0",
        salePriceLocal: input.salePriceLocal || "0",
        salePriceExport: input.salePriceExport || null,
        taxRate: input.taxRate || "0",
        isActive: input.isActive ?? true,
      })
      .where(eq(product.id, input.id));

    updateTag("products");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating product", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getAllActiveCategories() {
  try {
    const categories = await db
      .select({
        id: category.id,
        name: category.name,
      })
      .from(category)
      .where(eq(category.isActive, true))
      .orderBy(asc(category.name));

    return {
      data: categories,
      error: null,
    };
  } catch (err) {
    console.error("Error getting active categories", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

