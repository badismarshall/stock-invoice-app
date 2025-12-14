"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { purchaseOrder, purchaseOrderItem, partner, product, stockCurrent, stockMovement } from "@/db/schema";
import { eq, inArray, and, asc, not, or } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import { getPurchaseOrderById } from "@/data/purchase-order/purchase-order.dal";

/**
 * Helper function to update stock when purchase order items are added/received
 * This creates stock movements and updates stock_current
 */
async function updateStockFromPurchaseOrder(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>,
  movementDate: string,
  referenceId: string,
  userId: string,
  isReversal: boolean = false
) {
  for (const item of items) {
    // Check if product exists
    const productExists = await tx
      .select({ id: product.id })
      .from(product)
      .where(eq(product.id, item.productId))
      .limit(1);

    if (productExists.length === 0) {
      throw new Error(`Produit avec l'ID ${item.productId} non trouvé`);
    }

    // Get current stock
    const existingStock = await tx
      .select()
      .from(stockCurrent)
      .where(eq(stockCurrent.productId, item.productId))
      .limit(1);

    const movementId = generateId();
    const quantityChange = isReversal ? -item.quantity : item.quantity;

    // Create stock movement
    await tx.insert(stockMovement).values({
      id: movementId,
      productId: item.productId,
      movementType: isReversal ? "out" : "in",
      movementSource: "purchase",
      referenceType: "purchase_order",
      referenceId: referenceId,
      quantity: Math.abs(quantityChange).toString(),
      unitCost: item.unitCost.toString(),
      movementDate: movementDate,
      notes: isReversal 
        ? `Annulation de la commande d'achat ${referenceId}`
        : `Réception de la commande d'achat ${referenceId}`,
      createdBy: userId,
    });

    if (existingStock.length > 0) {
      // Update existing stock_current
      const currentStock = existingStock[0];
      const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
      const currentAverageCost = parseFloat(currentStock.averageCost || "0");
      const newQuantity = currentQuantity + quantityChange;

      if (newQuantity < 0) {
        throw new Error(
          `Quantité insuffisante en stock pour le produit ${item.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${Math.abs(quantityChange)}`
        );
      }

      let newAverageCost = currentAverageCost;
      
      if (!isReversal && item.quantity > 0) {
        // Calculate new average cost using weighted average for incoming stock
        const currentTotalCost = currentQuantity * currentAverageCost;
        const newItemTotalCost = item.quantity * item.unitCost;
        newAverageCost = newQuantity > 0 
          ? (currentTotalCost + newItemTotalCost) / newQuantity 
          : item.unitCost;
      }
      // For reversal, keep the same average cost

      await tx
        .update(stockCurrent)
        .set({
          quantityAvailable: newQuantity.toString(),
          averageCost: newAverageCost.toFixed(2),
          lastMovementDate: movementDate,
          lastUpdated: new Date(),
        })
        .where(eq(stockCurrent.productId, item.productId));
    } else {
      // Create new stock_current entry (only for incoming stock)
      if (!isReversal && item.quantity > 0) {
        const stockId = generateId();
        await tx.insert(stockCurrent).values({
          id: stockId,
          productId: item.productId,
          quantityAvailable: item.quantity.toString(),
          averageCost: item.unitCost.toFixed(2),
          lastMovementDate: movementDate,
        });
      } else if (isReversal) {
        throw new Error(
          `Impossible de retirer du stock pour le produit ${item.productId} car il n'existe pas en stock`
        );
      }
    }
  }
}

export async function addPurchaseOrder(input: {
  orderNumber: string;
  supplierId: string;
  orderDate: Date;
  receptionDate?: Date;
  status?: string;
  totalAmount?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Check if order number already exists
    const existingOrder = await db
      .select({ id: purchaseOrder.id })
      .from(purchaseOrder)
      .where(eq(purchaseOrder.orderNumber, input.orderNumber))
      .limit(1)
      .execute();

    if (existingOrder.length > 0) {
      return {
        data: null,
        error: `Le numéro de commande "${input.orderNumber}" existe déjà. Veuillez utiliser un numéro différent.`,
      };
    }

    const id = generateId();

    await db.transaction(async (tx) => {
      // Insert purchase order
      // Convert Date to string format YYYY-MM-DD for PostgreSQL date type
      // Use local time components to avoid timezone issues
      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const orderDateValue = input.orderDate instanceof Date 
        ? formatDateLocal(input.orderDate)
        : formatDateLocal(new Date(input.orderDate));
      const receptionDateValue = input.receptionDate 
        ? (input.receptionDate instanceof Date 
            ? formatDateLocal(input.receptionDate)
            : formatDateLocal(new Date(input.receptionDate)))
        : null;

      await tx.insert(purchaseOrder).values({
        id,
        orderNumber: input.orderNumber,
        supplierId: input.supplierId,
        orderDate: orderDateValue,
        receptionDate: receptionDateValue,
        status: (input.status as "pending" | "received" | "cancelled") || "pending",
        totalAmount: input.totalAmount || null,
        notes: input.notes || null,
        createdBy: user.id,
      });

      // Insert purchase order items if provided
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map((item) => ({
          id: generateId(),
          purchaseOrderId: id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitCost: item.unitCost.toString(),
          lineTotal: item.lineTotal.toString(),
        }));

        if (itemsToInsert.length > 0) {
          await tx.insert(purchaseOrderItem).values(itemsToInsert);
        }

        // If status is "received", update stock
        const status = (input.status as "pending" | "received" | "cancelled") || "pending";
        if (status === "received") {
          const movementDate = receptionDateValue || orderDateValue;
          await updateStockFromPurchaseOrder(
            tx,
            input.items,
            movementDate,
            id,
            user.id,
            false
          );
        }
      }
    });

    updateTag("purchaseOrders");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding purchase order", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deletePurchaseOrder(input: { id: string }) {
  try {
    await db.delete(purchaseOrder).where(eq(purchaseOrder.id, input.id));

    updateTag("purchaseOrders");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting purchase order", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deletePurchaseOrders(input: { ids: string[] }) {
  try {
    await db.delete(purchaseOrder).where(inArray(purchaseOrder.id, input.ids));

    updateTag("purchaseOrders");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting purchase orders", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

// Helper function to get all suppliers (partners with type='fournisseur')
export async function getAllSuppliers() {
  try {
    const suppliers = await db
      .select({
        id: partner.id,
        name: partner.name,
      })
      .from(partner)
      .where(eq(partner.type, "fournisseur"))
      .orderBy(partner.name);

    return {
      data: suppliers,
      error: null,
    };
  } catch (err) {
    console.error("Error getting suppliers", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

// Helper function to get all active products for dropdowns
export async function getAllActiveProducts() {
  try {
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        code: product.code,
        purchasePrice: product.purchasePrice,
        taxRate: product.taxRate,
        unitOfMeasure: product.unitOfMeasure,
      })
      .from(product)
      .where(eq(product.isActive, true))
      .orderBy(asc(product.name));

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

export async function getPurchaseOrderByIdAction(input: { id: string }) {
  try {
    const purchaseOrderData = await getPurchaseOrderById(input.id);
    
    if (!purchaseOrderData) {
      return {
        data: null,
        error: "Bon de commande non trouvé",
      };
    }

    return {
      data: purchaseOrderData,
      error: null,
    };
  } catch (err) {
    console.error("Error getting purchase order by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updatePurchaseOrder(input: {
  id: string;
  orderNumber: string;
  supplierId: string;
  orderDate: Date;
  receptionDate?: Date;
  status?: string;
  totalAmount?: string;
  notes?: string;
  items?: Array<{
    id?: string;
    productId: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Check if order number already exists (excluding current purchase order)
    const existingOrder = await db
      .select({ id: purchaseOrder.id })
      .from(purchaseOrder)
      .where(and(
        eq(purchaseOrder.orderNumber, input.orderNumber),
        not(eq(purchaseOrder.id, input.id))
      ))
      .limit(1)
      .execute();

    if (existingOrder.length > 0) {
      return {
        data: null,
        error: `Le numéro de commande "${input.orderNumber}" existe déjà. Veuillez utiliser un numéro différent.`,
      };
    }

    // Get the old purchase order data to compare
    const oldPurchaseOrder = await getPurchaseOrderById(input.id);
    if (!oldPurchaseOrder) {
      return {
        data: null,
        error: "Bon de commande non trouvé",
      };
    }

    const oldStatus = oldPurchaseOrder.status;
    const newStatus = (input.status as "pending" | "received" | "cancelled") || "pending";

    // Convert Date to string format YYYY-MM-DD for PostgreSQL date type
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const orderDateValue = input.orderDate instanceof Date 
      ? formatDateLocal(input.orderDate)
      : formatDateLocal(new Date(input.orderDate));
    const receptionDateValue = input.receptionDate 
      ? (input.receptionDate instanceof Date 
          ? formatDateLocal(input.receptionDate)
          : formatDateLocal(new Date(input.receptionDate)))
      : null;

    await db.transaction(async (tx) => {
      // Handle stock updates based on status changes
      const oldItems = oldPurchaseOrder.items || [];
      const newItems = input.items || [];
      const movementDate = receptionDateValue || orderDateValue;

      // Case 1: Status changed from "received" to "pending" or "cancelled" - delete stock movements
      if (oldStatus === "received" && (newStatus === "pending" || newStatus === "cancelled")) {
        // Get all stock movements for this purchase order
        const movements = await tx
          .select()
          .from(stockMovement)
          .where(
            and(
              eq(stockMovement.referenceType, "purchase_order"),
              eq(stockMovement.referenceId, input.id)
            )
          );

        // Reverse stock for each movement
        for (const movement of movements) {
          const existingStock = await tx
            .select()
            .from(stockCurrent)
            .where(eq(stockCurrent.productId, movement.productId))
            .limit(1);

          if (existingStock.length > 0) {
            const currentStock = existingStock[0];
            const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
            const movementQuantity = parseFloat(movement.quantity || "0");
            const newQuantity = currentQuantity - movementQuantity;

            if (newQuantity < 0) {
              throw new Error(
                `Quantité insuffisante en stock pour le produit ${movement.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${movementQuantity}`
              );
            }

            await tx
              .update(stockCurrent)
              .set({
                quantityAvailable: newQuantity.toString(),
                lastMovementDate: movementDate,
                lastUpdated: new Date(),
              })
              .where(eq(stockCurrent.productId, movement.productId));
          }

          // Delete the movement
          await tx
            .delete(stockMovement)
            .where(eq(stockMovement.id, movement.id));
        }
      }
      // Case 2: Status changed from "pending" to "received" - add all new items to stock
      else if (oldStatus === "pending" && newStatus === "received") {
        if (newItems.length > 0) {
          await updateStockFromPurchaseOrder(
            tx,
            newItems,
            movementDate,
            input.id,
            user.id,
            false
          );
        }
      }
      // Case 3: Status remains "received" - modify existing movements instead of creating new ones
      else if (oldStatus === "received" && newStatus === "received") {
        // Get existing stock movements for this purchase order
        const existingMovements = await tx
          .select()
          .from(stockMovement)
          .where(
            and(
              eq(stockMovement.referenceType, "purchase_order"),
              eq(stockMovement.referenceId, input.id)
            )
          );

        // Create maps for easy comparison
        const oldItemsMap = new Map(
          oldItems.map(item => [item.productId, { quantity: item.quantity, unitCost: item.unitCost }])
        );
        const newItemsMap = new Map(
          newItems.map(item => [item.productId, { quantity: item.quantity, unitCost: item.unitCost }])
        );
        const existingMovementsMap = new Map(
          existingMovements.map(mov => [mov.productId, mov])
        );

        // Process each product
        const allProductIds = new Set([...oldItemsMap.keys(), ...newItemsMap.keys()]);

        for (const productId of allProductIds) {
          const oldItem = oldItemsMap.get(productId);
          const newItem = newItemsMap.get(productId);
          const existingMovement = existingMovementsMap.get(productId);

          // Get current stock
          const existingStock = await tx
            .select()
            .from(stockCurrent)
            .where(eq(stockCurrent.productId, productId))
            .limit(1);

          if (!oldItem && newItem) {
            // New item added - create new movement
            await updateStockFromPurchaseOrder(
              tx,
              [{ productId, quantity: newItem.quantity, unitCost: newItem.unitCost }],
              movementDate,
              input.id,
              user.id,
              false
            );
          } else if (oldItem && !newItem) {
            // Item removed - delete movement and reverse stock
            if (existingMovement) {
              const movementQuantity = parseFloat(existingMovement.quantity || "0");
              
              if (existingStock.length > 0) {
                const currentStock = existingStock[0];
                const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
                const newQuantity = currentQuantity - movementQuantity;

                if (newQuantity < 0) {
                  throw new Error(
                    `Quantité insuffisante en stock pour le produit ${productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${movementQuantity}`
                  );
                }

                await tx
                  .update(stockCurrent)
                  .set({
                    quantityAvailable: newQuantity.toString(),
                    lastMovementDate: movementDate,
                    lastUpdated: new Date(),
                  })
                  .where(eq(stockCurrent.productId, productId));
              }

              // Delete the movement
              await tx
                .delete(stockMovement)
                .where(eq(stockMovement.id, existingMovement.id));
            }
          } else if (oldItem && newItem) {
            // Item modified - update existing movement
            if (existingMovement) {
              const oldQuantity = parseFloat(existingMovement.quantity || "0");
              const oldUnitCost = parseFloat(existingMovement.unitCost || "0");
              const quantityDiff = newItem.quantity - oldQuantity;
              const costDiff = newItem.unitCost - oldUnitCost;

              // Update the movement
              await tx
                .update(stockMovement)
                .set({
                  quantity: newItem.quantity.toString(),
                  unitCost: newItem.unitCost.toString(),
                  movementDate: movementDate,
                })
                .where(eq(stockMovement.id, existingMovement.id));

              // Update stock_current
              if (existingStock.length > 0 && quantityDiff !== 0) {
                const currentStock = existingStock[0];
                const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
                const currentAverageCost = parseFloat(currentStock.averageCost || "0");
                const newQuantity = currentQuantity + quantityDiff;

                if (newQuantity < 0) {
                  throw new Error(
                    `Quantité insuffisante en stock pour le produit ${productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${Math.abs(quantityDiff)}`
                  );
                }

                let newAverageCost = currentAverageCost;
                
                if (quantityDiff > 0) {
                  // Quantity increased - recalculate average cost
                  const currentTotalCost = currentQuantity * currentAverageCost;
                  const addedTotalCost = quantityDiff * newItem.unitCost;
                  newAverageCost = newQuantity > 0 
                    ? (currentTotalCost + addedTotalCost) / newQuantity 
                    : newItem.unitCost;
                } else if (quantityDiff < 0) {
                  // Quantity decreased - keep same average cost
                  newAverageCost = currentAverageCost;
                } else if (costDiff !== 0) {
                  // Only cost changed - need to recalculate
                  // Reverse old cost impact and apply new cost
                  const currentTotalCost = currentQuantity * currentAverageCost;
                  const oldItemTotalCost = oldQuantity * oldUnitCost;
                  const newItemTotalCost = newItem.quantity * newItem.unitCost;
                  const adjustedTotalCost = currentTotalCost - oldItemTotalCost + newItemTotalCost;
                  newAverageCost = newQuantity > 0 
                    ? adjustedTotalCost / newQuantity 
                    : newItem.unitCost;
                }

                await tx
                  .update(stockCurrent)
                  .set({
                    quantityAvailable: newQuantity.toString(),
                    averageCost: newAverageCost.toFixed(2),
                    lastMovementDate: movementDate,
                    lastUpdated: new Date(),
                  })
                  .where(eq(stockCurrent.productId, productId));
              }
            } else {
              // Movement doesn't exist but item exists - create new movement
              await updateStockFromPurchaseOrder(
                tx,
                [{ productId, quantity: newItem.quantity, unitCost: newItem.unitCost }],
                movementDate,
                input.id,
                user.id,
                false
              );
            }
          }
        }
      }

      // Update purchase order
      await tx
        .update(purchaseOrder)
        .set({
          orderNumber: input.orderNumber,
          supplierId: input.supplierId,
          orderDate: orderDateValue,
          receptionDate: receptionDateValue,
          status: newStatus,
          totalAmount: input.totalAmount || null,
          notes: input.notes || null,
        })
        .where(eq(purchaseOrder.id, input.id));

      // Delete existing items
      await tx
        .delete(purchaseOrderItem)
        .where(eq(purchaseOrderItem.purchaseOrderId, input.id));

      // Insert new items if provided
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map((item) => ({
          id: item.id || generateId(),
          purchaseOrderId: input.id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitCost: item.unitCost.toString(),
          lineTotal: item.lineTotal.toString(),
        }));

        if (itemsToInsert.length > 0) {
          await tx.insert(purchaseOrderItem).values(itemsToInsert);
        }
      }
    });

    updateTag("purchaseOrders");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating purchase order", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

