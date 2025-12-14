"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { stockCurrent, stockMovement, product, category } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";

export interface StockEntryItem {
  productId: string;
  quantity: number;
  unitCost: number;
  movementDate: Date;
  notes?: string;
}

export async function addStockEntry(input: {
  items: StockEntryItem[];
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    if (!input.items || input.items.length === 0) {
      return {
        data: null,
        error: "Veuillez ajouter au moins un produit",
      };
    }

    // Process each item in a transaction
    await db.transaction(async (tx) => {
      for (const item of input.items) {
        // Check if product exists
        const productExists = await tx
          .select({ id: product.id })
          .from(product)
          .where(eq(product.id, item.productId))
          .limit(1);

        if (productExists.length === 0) {
          throw new Error(`Produit avec l'ID ${item.productId} non trouvé`);
        }

        // Check if stock_current entry exists for this product
        const existingStock = await tx
          .select()
          .from(stockCurrent)
          .where(eq(stockCurrent.productId, item.productId))
          .limit(1);

        const movementId = generateId();
        // Format date using local time components to avoid timezone shifts
        const formatDateLocal = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const movementDateStr = formatDateLocal(item.movementDate);

        // Create stock movement
        await tx.insert(stockMovement).values({
          id: movementId,
          productId: item.productId,
          movementType: "in",
          movementSource: "adjustment",
          quantity: item.quantity.toString(),
          unitCost: item.unitCost.toString(),
          movementDate: movementDateStr,
          notes: item.notes || null,
          createdBy: user.id,
        });

        if (existingStock.length > 0) {
          // Update existing stock_current
          const currentStock = existingStock[0];
          const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
          const currentAverageCost = parseFloat(currentStock.averageCost || "0");
          const newQuantity = currentQuantity + item.quantity;
          
          // Calculate new average cost using weighted average
          const currentTotalCost = currentQuantity * currentAverageCost;
          const newItemTotalCost = item.quantity * item.unitCost;
          const newAverageCost = newQuantity > 0 
            ? (currentTotalCost + newItemTotalCost) / newQuantity 
            : item.unitCost;

          await tx
            .update(stockCurrent)
            .set({
              quantityAvailable: newQuantity.toString(),
              averageCost: newAverageCost.toFixed(2),
              lastMovementDate: movementDateStr,
              lastUpdated: new Date(),
            })
            .where(eq(stockCurrent.productId, item.productId));
        } else {
          // Create new stock_current entry
          const stockId = generateId();
          await tx.insert(stockCurrent).values({
            id: stockId,
            productId: item.productId,
            quantityAvailable: item.quantity.toString(),
            averageCost: item.unitCost.toFixed(2),
            lastMovementDate: movementDateStr,
          });
        }
      }
    });

    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    console.error("Error adding stock entry", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getAllActiveProducts() {
  try {
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        code: product.code,
        purchasePrice: product.purchasePrice,
        unitOfMeasure: product.unitOfMeasure,
      })
      .from(product)
      .where(eq(product.isActive, true))
      .orderBy(product.name);

    return {
      data: products,
      error: null,
    };
  } catch (err) {
    console.error("Error getting active products", err);
    return {
      data: [],
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

