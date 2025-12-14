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

export async function getStockMovementByIdAction(input: { id: string }) {
  try {
    const { getStockMovementById } = await import("@/data/stock/stock.dal");
    const movement = await getStockMovementById(input.id);
    
    if (!movement) {
      return {
        data: null,
        error: "Mouvement de stock non trouvé",
      };
    }

    // Only allow modification of adjustment movements
    if (movement.movementSource !== "adjustment") {
      return {
        data: null,
        error: "Seuls les mouvements d'ajustement peuvent être modifiés",
      };
    }

    return {
      data: movement,
      error: null,
    };
  } catch (err) {
    console.error("Error getting stock movement by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateStockMovement(input: {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  movementDate: Date;
  movementType: "in" | "out" | "adjustment";
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get the old movement
    const { getStockMovementById } = await import("@/data/stock/stock.dal");
    const oldMovement = await getStockMovementById(input.id);
    
    if (!oldMovement) {
      return {
        data: null,
        error: "Mouvement de stock non trouvé",
      };
    }

    // Only allow modification of adjustment movements
    if (oldMovement.movementSource !== "adjustment") {
      return {
        data: null,
        error: "Seuls les mouvements d'ajustement peuvent être modifiés",
      };
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const movementDateStr = formatDateLocal(input.movementDate);

    await db.transaction(async (tx) => {
      // Get current stock
      const existingStock = await tx
        .select()
        .from(stockCurrent)
        .where(eq(stockCurrent.productId, input.productId))
        .limit(1);

      // Reverse the old movement's impact on stock
      const oldQuantity = oldMovement.quantity;
      const oldMovementType = oldMovement.movementType;
      const oldQuantityChange = oldMovementType === "out" ? -oldQuantity : oldQuantity;

      if (existingStock.length > 0) {
        const currentStock = existingStock[0];
        const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
        const currentAverageCost = parseFloat(currentStock.averageCost || "0");
        
        // Reverse old movement
        const reversedQuantity = currentQuantity - oldQuantityChange;
        
        if (reversedQuantity < 0) {
          throw new Error(
            `Impossible d'annuler l'ancien mouvement. Le stock serait négatif (${reversedQuantity})`
          );
        }

        // Apply new movement
        const newQuantityChange = input.movementType === "out" ? -input.quantity : input.quantity;
        const newQuantity = reversedQuantity + newQuantityChange;

        if (newQuantity < 0) {
          throw new Error(
            `Quantité insuffisante en stock. Stock après annulation: ${reversedQuantity}, Tentative d'ajout: ${newQuantityChange}`
          );
        }

        let newAverageCost = currentAverageCost;
        
        if (input.movementType === "in" && input.quantity > 0) {
          // Calculate new average cost using weighted average
          const reversedTotalCost = reversedQuantity * currentAverageCost;
          const newItemTotalCost = input.quantity * input.unitCost;
          newAverageCost = newQuantity > 0 
            ? (reversedTotalCost + newItemTotalCost) / newQuantity 
            : input.unitCost;
        }

        // Update stock_current
        await tx
          .update(stockCurrent)
          .set({
            quantityAvailable: newQuantity.toString(),
            averageCost: newAverageCost.toFixed(2),
            lastMovementDate: movementDateStr,
            lastUpdated: new Date(),
          })
          .where(eq(stockCurrent.productId, input.productId));
      } else {
        // No existing stock - can only add (in)
        if (input.movementType !== "in") {
          throw new Error("Impossible de créer un mouvement de sortie pour un produit sans stock");
        }

        // Create new stock_current entry
        const stockId = generateId();
        await tx.insert(stockCurrent).values({
          id: stockId,
          productId: input.productId,
          quantityAvailable: input.quantity.toString(),
          averageCost: input.unitCost.toFixed(2),
          lastMovementDate: movementDateStr,
        });
      }

      // Update the movement
      await tx
        .update(stockMovement)
        .set({
          productId: input.productId,
          movementType: input.movementType,
          quantity: input.quantity.toString(),
          unitCost: input.unitCost.toString(),
          movementDate: movementDateStr,
          notes: input.notes || null,
        })
        .where(eq(stockMovement.id, input.id));
    });

    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating stock movement", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteStockMovement(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get the movement
    const { getStockMovementById } = await import("@/data/stock/stock.dal");
    const movement = await getStockMovementById(input.id);
    
    if (!movement) {
      return {
        data: null,
        error: "Mouvement de stock non trouvé",
      };
    }

    // Only allow deletion of adjustment movements
    if (movement.movementSource !== "adjustment") {
      return {
        data: null,
        error: "Seuls les mouvements d'ajustement peuvent être supprimés",
      };
    }

    await db.transaction(async (tx) => {
      // Get current stock
      const existingStock = await tx
        .select()
        .from(stockCurrent)
        .where(eq(stockCurrent.productId, movement.productId))
        .limit(1);

      // Reverse the movement's impact on stock
      const quantity = movement.quantity;
      const movementType = movement.movementType;
      const quantityChange = movementType === "out" ? -quantity : quantity;

      if (existingStock.length > 0) {
        const currentStock = existingStock[0];
        const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
        const newQuantity = currentQuantity - quantityChange;

        if (newQuantity < 0) {
          throw new Error(
            `Impossible de supprimer ce mouvement. Le stock serait négatif (${newQuantity})`
          );
        }

        // Update stock_current
        await tx
          .update(stockCurrent)
          .set({
            quantityAvailable: newQuantity.toString(),
            lastUpdated: new Date(),
          })
          .where(eq(stockCurrent.productId, movement.productId));
      } else {
        throw new Error("Impossible de supprimer un mouvement pour un produit sans stock");
      }

      // Delete the movement
      await tx
        .delete(stockMovement)
        .where(eq(stockMovement.id, input.id));
    });

    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting stock movement", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

