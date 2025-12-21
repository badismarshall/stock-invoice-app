"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import {
  deliveryNote,
  deliveryNoteItem,
  deliveryNoteCancellation,
  deliveryNoteCancellationItem,
  partner,
  product,
  stockCurrent,
  stockMovement,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import { getClientDeliveryNoteItems, getDeliveryNoteCancellationById } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dal";

/**
 * Helper function to update stock when cancelling delivery note items
 * This creates stock movements (in) and updates stock_current
 */
async function updateStockFromCancellation(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  items: Array<{
    productId: string;
    quantity: number;
    deliveryNoteId: string;
  }>,
  movementDate: string,
  referenceId: string,
  userId: string,
  noteType: "local" | "export",
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

    if (existingStock.length === 0) {
      throw new Error(
        `Produit ${item.productId} n'existe pas en stock`
      );
    }

    const movementId = generateId();
    const currentStock = existingStock[0];
    const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
    const currentAverageCost = parseFloat(currentStock.averageCost || "0");
    const newQuantity = currentQuantity + item.quantity; // Add back to stock

    // Create stock movement (in) - reversal
    await tx.insert(stockMovement).values({
      id: movementId,
      productId: item.productId,
      movementType: "in",
      movementSource: noteType === "local" ? "sale_local" : "sale_export",
      referenceType: "delivery_note_cancellation",
      referenceId: referenceId,
      quantity: item.quantity.toString(),
      unitCost: currentAverageCost.toString(),
      movementDate: movementDate,
      notes: `Annulation partielle - Bon de livraison avoir ${referenceId}`,
      createdBy: userId,
    });

    // Update stock_current
    await tx
      .update(stockCurrent)
      .set({
        quantityAvailable: newQuantity.toString(),
        averageCost: currentAverageCost.toFixed(2),
        lastMovementDate: movementDate,
        lastUpdated: new Date(),
      })
      .where(eq(stockCurrent.productId, item.productId));
  }
}

/**
 * Get all delivery note items for a client that can be cancelled
 */
export async function getClientDeliveryNoteItemsAction(input: { clientId: string }) {
  try {
    const items = await getClientDeliveryNoteItems(input.clientId);
    return {
      data: items,
      error: null,
    };
  } catch (err) {
    console.error("Error getting client delivery note items", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Create a partial delivery note cancellation
 */
export async function createPartialDeliveryNoteCancellation(input: {
  clientId: string;
  cancellationDate: Date;
  reason?: string;
  items: Array<{
    deliveryNoteItemId: string;
    quantity: number;
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

    if (!input.items || input.items.length === 0) {
      return {
        data: null,
        error: "Veuillez sélectionner au moins un produit à annuler",
      };
    }

    // Verify client exists
    const clientExists = await db
      .select({ id: partner.id })
      .from(partner)
      .where(eq(partner.id, input.clientId))
      .limit(1);

    if (clientExists.length === 0) {
      return {
        data: null,
        error: "Client non trouvé",
      };
    }

    // Get all available items for this client to validate quantities
    const availableItems = await getClientDeliveryNoteItems(input.clientId);
    const availableItemsMap = new Map(
      availableItems.map((item) => [item.deliveryNoteItemId, item])
    );

    // Validate quantities
    for (const item of input.items) {
      const availableItem = availableItemsMap.get(item.deliveryNoteItemId);
      if (!availableItem) {
        return {
          data: null,
          error: `L'item ${item.deliveryNoteItemId} n'existe pas ou n'est plus disponible`,
        };
      }
      if (item.quantity <= 0) {
        return {
          data: null,
          error: `La quantité à annuler doit être supérieure à 0 pour l'item ${availableItem.productName || availableItem.productCode}`,
        };
      }
      if (item.quantity > availableItem.availableQuantity) {
        return {
          data: null,
          error: `La quantité à annuler (${item.quantity}) dépasse la quantité disponible (${availableItem.availableQuantity}) pour l'item ${availableItem.productName || availableItem.productCode}`,
        };
      }
    }

    // Helper to format date as YYYY-MM-DD for PostgreSQL date type
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const cancellationId = generateId();
    const { generateCancellationNumber } = await import("@/lib/utils/invoice-number-generator");
    const cancellationNumber = generateCancellationNumber("delivery_note_cancellation", cancellationId.slice(-6));
    const cancellationDateValue = formatDateLocal(input.cancellationDate);

    // Get delivery note info for stock update (need noteType)
    const firstItem = availableItemsMap.get(input.items[0].deliveryNoteItemId);
    if (!firstItem) {
      return {
        data: null,
        error: "Erreur lors de la récupération des informations du bon de livraison",
      };
    }

    const deliveryNoteData = await db
      .select({ noteType: deliveryNote.noteType })
      .from(deliveryNote)
      .where(eq(deliveryNote.id, firstItem.deliveryNoteId))
      .limit(1);

    if (deliveryNoteData.length === 0) {
      return {
        data: null,
        error: "Bon de livraison non trouvé",
      };
    }

    const noteType = deliveryNoteData[0].noteType as "local" | "export";

    await db.transaction(async (tx) => {
      // Create delivery note cancellation
      await tx.insert(deliveryNoteCancellation).values({
        id: cancellationId,
        cancellationNumber,
        originalDeliveryNoteId: null, // Can be null for partial cancellations
        clientId: input.clientId,
        cancellationDate: cancellationDateValue,
        reason: input.reason || null,
        createdBy: user.id,
      });

      // Create cancellation items and collect stock update data
      const stockUpdateItems: Array<{
        productId: string;
        quantity: number;
        deliveryNoteId: string;
      }> = [];

      for (const item of input.items) {
        const availableItem = availableItemsMap.get(item.deliveryNoteItemId)!;
        
        // Calculate line total for cancelled quantity
        const unitPrice = availableItem.unitPrice;
        const discountPercent = availableItem.discountPercent;
        const subtotal = item.quantity * unitPrice;
        const discountAmount = subtotal * (discountPercent / 100);
        const lineSubtotal = subtotal - discountAmount;
        // Assume same tax rate as original (we don't store tax separately in delivery_note_item)
        // For simplicity, we'll use the lineTotal proportionally
        const originalLineTotal = availableItem.lineTotal;
        const originalSubtotal = availableItem.originalQuantity * unitPrice * (1 - discountPercent / 100);
        const taxRate = originalSubtotal > 0 ? (originalLineTotal - originalSubtotal) / originalSubtotal : 0;
        const lineTax = lineSubtotal * taxRate;
        const lineTotal = lineSubtotal + lineTax;

        await tx.insert(deliveryNoteCancellationItem).values({
          id: generateId(),
          deliveryNoteCancellationId: cancellationId,
          deliveryNoteItemId: item.deliveryNoteItemId,
          quantity: item.quantity.toString(),
          unitPrice: unitPrice.toString(),
          discountPercent: discountPercent.toString(),
          lineTotal: lineTotal.toString(),
        });

        // Update delivery note item: decrease quantity and lineTotal proportionally
        const currentItem = await tx
          .select()
          .from(deliveryNoteItem)
          .where(eq(deliveryNoteItem.id, item.deliveryNoteItemId))
          .limit(1);

        if (currentItem.length > 0) {
          const currentQuantity = parseFloat(currentItem[0].quantity);
          const currentLineTotal = parseFloat(currentItem[0].lineTotal);
          const newQuantity = currentQuantity - item.quantity;
          
          // Calculate new lineTotal proportionally
          const quantityRatio = currentQuantity > 0 ? newQuantity / currentQuantity : 0;
          const newLineTotal = currentLineTotal * quantityRatio;

          await tx
            .update(deliveryNoteItem)
            .set({
              quantity: newQuantity.toString(),
              lineTotal: newLineTotal.toFixed(2),
            })
            .where(eq(deliveryNoteItem.id, item.deliveryNoteItemId));
        }

        stockUpdateItems.push({
          productId: availableItem.productId,
          quantity: item.quantity,
          deliveryNoteId: availableItem.deliveryNoteId,
        });
      }

      // Update stock (put products back in stock)
      await updateStockFromCancellation(
        tx,
        stockUpdateItems,
        cancellationDateValue,
        cancellationId,
        user.id,
        noteType
      );
    });

    updateTag("deliveryNoteCancellations");
    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id: cancellationId },
      error: null,
    };
  } catch (err) {
    console.error("Error creating partial delivery note cancellation", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all clients for the cancellation form
 */
export async function getAllClients() {
  try {
    const clients = await db
      .select({
        id: partner.id,
        name: partner.name,
      })
      .from(partner)
      .where(eq(partner.type, "client"));

    return {
      data: clients,
      error: null,
    };
  } catch (err) {
    console.error("Error getting clients", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get delivery note cancellation by ID with items
 */
export async function getDeliveryNoteCancellationByIdAction(input: { id: string }) {
  try {
    const cancellation = await getDeliveryNoteCancellationById(input.id);
    if (!cancellation) {
      return {
        data: null,
        error: "Annulation non trouvée",
      };
    }
    return {
      data: cancellation,
      error: null,
    };
  } catch (err) {
    console.error("Error getting delivery note cancellation by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Update a delivery note cancellation
 * This reverses old stock movements and creates new ones based on updated quantities
 */
export async function updateDeliveryNoteCancellation(input: {
  id: string;
  cancellationDate: Date;
  reason?: string;
  items: Array<{
    cancellationItemId: string;
    deliveryNoteItemId: string;
    quantity: number;
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

    if (!input.items || input.items.length === 0) {
      return {
        data: null,
        error: "Veuillez sélectionner au moins un produit à annuler",
      };
    }

    // Get existing cancellation
    const existingCancellation = await getDeliveryNoteCancellationById(input.id);
    if (!existingCancellation) {
      return {
        data: null,
        error: "Annulation non trouvée",
      };
    }

    // Validate quantities
    for (const item of input.items) {
      const existingItem = existingCancellation.items.find(
        (i) => i.deliveryNoteItemId === item.deliveryNoteItemId
      );
      if (!existingItem) {
        return {
          data: null,
          error: `L'item ${item.deliveryNoteItemId} n'existe pas dans cette annulation`,
        };
      }

      // Get available quantity (original - already cancelled in other cancellations)
      const availableItems = await getClientDeliveryNoteItems(
        existingCancellation.clientId!
      );
      const availableItem = availableItems.find(
        (i) => i.deliveryNoteItemId === item.deliveryNoteItemId
      );

      if (!availableItem) {
        return {
          data: null,
          error: `L'item ${item.deliveryNoteItemId} n'est plus disponible`,
        };
      }

      // Calculate how much was already cancelled in THIS cancellation
      const currentlyCancelledInThis = existingItem.cancelledQuantity;
      // Available = original - cancelled in other cancellations - cancelled in this cancellation + currently cancelled in this
      const availableForThisCancellation =
        availableItem.availableQuantity + currentlyCancelledInThis;

      if (item.quantity <= 0) {
        return {
          data: null,
          error: `La quantité à annuler doit être supérieure à 0 pour l'item ${availableItem.productName || availableItem.productCode}`,
        };
      }

      if (item.quantity > availableForThisCancellation) {
        return {
          data: null,
          error: `La quantité à annuler (${item.quantity}) dépasse la quantité disponible (${availableForThisCancellation}) pour l'item ${availableItem.productName || availableItem.productCode}`,
        };
      }
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const cancellationDateValue = formatDateLocal(input.cancellationDate);
    const noteType = existingCancellation.items[0]?.noteType || "local";

    await db.transaction(async (tx) => {
      // 1) Reverse existing stock movements for this cancellation
      const existingMovements = await tx
        .select()
        .from(stockMovement)
        .where(
          and(
            eq(stockMovement.referenceType, "delivery_note_cancellation"),
            eq(stockMovement.referenceId, input.id)
          )
        );

      for (const movement of existingMovements) {
        const existingStock = await tx
          .select()
          .from(stockCurrent)
          .where(eq(stockCurrent.productId, movement.productId))
          .limit(1);

        if (existingStock.length > 0) {
          const currentStock = existingStock[0];
          const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
          const movementQuantity = parseFloat(movement.quantity || "0");
          const newQuantity = currentQuantity - movementQuantity; // Reverse 'in' movement

          await tx
            .update(stockCurrent)
            .set({
              quantityAvailable: newQuantity.toString(),
              lastMovementDate: cancellationDateValue,
              lastUpdated: new Date(),
            })
            .where(eq(stockCurrent.productId, movement.productId));
        }

        await tx.delete(stockMovement).where(eq(stockMovement.id, movement.id));
      }

      // 2) Restore quantities in delivery_note_item for previously cancelled items
      const existingCancellationItems = await tx
        .select()
        .from(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, input.id));

      for (const cancelledItem of existingCancellationItems) {
        const deliveryNoteItem = await tx
          .select()
          .from(deliveryNoteItem)
          .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId))
          .limit(1);

        if (deliveryNoteItem.length > 0) {
          const currentQuantity = parseFloat(deliveryNoteItem[0].quantity);
          const currentLineTotal = parseFloat(deliveryNoteItem[0].lineTotal);
          const cancelledQuantity = parseFloat(cancelledItem.quantity);
          
          // Restore the previously cancelled quantity
          const restoredQuantity = currentQuantity + cancelledQuantity;
          
          // Restore lineTotal proportionally
          const totalQuantity = restoredQuantity;
          const quantityRatio = totalQuantity > 0 ? totalQuantity / (totalQuantity - cancelledQuantity) : 1;
          const restoredLineTotal = currentLineTotal * quantityRatio;

          await tx
            .update(deliveryNoteItem)
            .set({
              quantity: restoredQuantity.toString(),
              lineTotal: restoredLineTotal.toFixed(2),
            })
            .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId));
        }
      }

      // 3) Delete existing cancellation items
      await tx
        .delete(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, input.id));

      // 4) Update cancellation main fields
      await tx
        .update(deliveryNoteCancellation)
        .set({
          cancellationDate: cancellationDateValue,
          reason: input.reason || null,
        })
        .where(eq(deliveryNoteCancellation.id, input.id));

      // 5) Create new cancellation items and collect stock update data
      const stockUpdateItems: Array<{
        productId: string;
        quantity: number;
        deliveryNoteId: string;
      }> = [];

      for (const item of input.items) {
        const existingItem = existingCancellation.items.find(
          (i) => i.deliveryNoteItemId === item.deliveryNoteItemId
        )!;

        // Calculate line total for cancelled quantity
        const unitPrice = existingItem.unitPrice;
        const discountPercent = existingItem.discountPercent;
        const subtotal = item.quantity * unitPrice;
        const discountAmount = subtotal * (discountPercent / 100);
        const lineSubtotal = subtotal - discountAmount;
        const originalLineTotal = existingItem.lineTotal;
        const originalSubtotal =
          existingItem.originalQuantity * unitPrice * (1 - discountPercent / 100);
        const taxRate =
          originalSubtotal > 0
            ? (originalLineTotal - originalSubtotal) / originalSubtotal
            : 0;
        const lineTax = lineSubtotal * taxRate;
        const lineTotal = lineSubtotal + lineTax;

        await tx.insert(deliveryNoteCancellationItem).values({
          id: generateId(),
          deliveryNoteCancellationId: input.id,
          deliveryNoteItemId: item.deliveryNoteItemId,
          quantity: item.quantity.toString(),
          unitPrice: unitPrice.toString(),
          discountPercent: discountPercent.toString(),
          lineTotal: lineTotal.toString(),
        });

        // Update delivery note item: decrease quantity and lineTotal proportionally
        const currentItem = await tx
          .select()
          .from(deliveryNoteItem)
          .where(eq(deliveryNoteItem.id, item.deliveryNoteItemId))
          .limit(1);

        if (currentItem.length > 0) {
          const currentQuantity = parseFloat(currentItem[0].quantity);
          const currentLineTotal = parseFloat(currentItem[0].lineTotal);
          const newQuantity = currentQuantity - item.quantity;
          
          // Calculate new lineTotal proportionally
          const quantityRatio = currentQuantity > 0 ? newQuantity / currentQuantity : 0;
          const newLineTotal = currentLineTotal * quantityRatio;

          await tx
            .update(deliveryNoteItem)
            .set({
              quantity: newQuantity.toString(),
              lineTotal: newLineTotal.toFixed(2),
            })
            .where(eq(deliveryNoteItem.id, item.deliveryNoteItemId));
        }

        stockUpdateItems.push({
          productId: existingItem.productId,
          quantity: item.quantity,
          deliveryNoteId: existingItem.deliveryNoteId,
        });
      }

      // 6) Re-apply stock movements with new quantities
      await updateStockFromCancellation(
        tx,
        stockUpdateItems,
        cancellationDateValue,
        input.id,
        user.id,
        noteType
      );
    });

    updateTag("deliveryNoteCancellations");
    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating delivery note cancellation", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get cancellation items for display in delete dialog
 */
export async function getCancellationItemsForDelete(input: { id: string }) {
  try {
    const cancellation = await getDeliveryNoteCancellationById(input.id);
    if (!cancellation) {
      return {
        data: null,
        error: "Annulation non trouvée",
      };
    }
    return {
      data: cancellation.items,
      error: null,
    };
  } catch (err) {
    console.error("Error getting cancellation items for delete", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a single cancellation item
 * This reverses the stock movement for that specific item
 */
export async function deleteCancellationItem(input: {
  cancellationId: string;
  itemId: string;
  productId: string;
  quantity: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get cancellation to get the date
    const cancellation = await getDeliveryNoteCancellationById(input.cancellationId);
    if (!cancellation) {
      return {
        data: null,
        error: "Annulation non trouvée",
      };
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const cancellationDateValue = formatDateLocal(cancellation.cancellationDate);

    await db.transaction(async (tx) => {
      // 1) Find and reverse the stock movement for this specific item
      // Stock movements are linked to the cancellation, so we need to find the one for this product
      const movements = await tx
        .select()
        .from(stockMovement)
        .where(
          and(
            eq(stockMovement.referenceType, "delivery_note_cancellation"),
            eq(stockMovement.referenceId, input.cancellationId),
            eq(stockMovement.productId, input.productId)
          )
        );

      // Find the movement that matches the quantity (or use the first one if multiple)
      let movementToDelete = movements.find(
        (m) => parseFloat(m.quantity || "0") === input.quantity
      ) || movements[0];

      if (movementToDelete) {
        const existingStock = await tx
          .select()
          .from(stockCurrent)
          .where(eq(stockCurrent.productId, input.productId))
          .limit(1);

        if (existingStock.length > 0) {
          const currentStock = existingStock[0];
          const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
          const movementQuantity = parseFloat(movementToDelete.quantity || "0");
          const newQuantity = currentQuantity - movementQuantity; // Reverse 'in' movement (remove stock)

          if (newQuantity < 0) {
            throw new Error(
              `Quantité insuffisante en stock pour le produit ${input.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${movementQuantity}`
            );
          }

          await tx
            .update(stockCurrent)
            .set({
              quantityAvailable: newQuantity.toString(),
              lastMovementDate: cancellationDateValue,
              lastUpdated: new Date(),
            })
            .where(eq(stockCurrent.productId, input.productId));
        }

        // Delete the movement
        await tx.delete(stockMovement).where(eq(stockMovement.id, movementToDelete.id));
      }

      // 2) Restore quantity in delivery_note_item before deleting cancellation item
      const cancellationItem = await tx
        .select()
        .from(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.id, input.itemId))
        .limit(1);

      if (cancellationItem.length > 0) {
        const cancelledItem = cancellationItem[0];
        const deliveryNoteItem = await tx
          .select()
          .from(deliveryNoteItem)
          .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId))
          .limit(1);

        if (deliveryNoteItem.length > 0) {
          const currentQuantity = parseFloat(deliveryNoteItem[0].quantity);
          const currentLineTotal = parseFloat(deliveryNoteItem[0].lineTotal);
          const cancelledQuantity = parseFloat(cancelledItem.quantity);
          
          // Restore the cancelled quantity
          const restoredQuantity = currentQuantity + cancelledQuantity;
          
          // Restore lineTotal proportionally based on quantity ratio
          const quantityRatio = currentQuantity > 0 ? restoredQuantity / currentQuantity : 1;
          const restoredLineTotal = currentLineTotal * quantityRatio;

          await tx
            .update(deliveryNoteItem)
            .set({
              quantity: restoredQuantity.toString(),
              lineTotal: restoredLineTotal.toFixed(2),
            })
            .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId));
        }
      }

      // 3) Delete the cancellation item
      await tx
        .delete(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.id, input.itemId));

      // 3) Check if cancellation has no more items, if so, delete the cancellation too
      const remainingItems = await tx
        .select({ id: deliveryNoteCancellationItem.id })
        .from(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, input.cancellationId))
        .limit(1);

      if (remainingItems.length === 0) {
        await tx
          .delete(deliveryNoteCancellation)
          .where(eq(deliveryNoteCancellation.id, input.cancellationId));
      }
    });

    updateTag("deliveryNoteCancellations");
    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { deleted: true },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting cancellation item", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a delivery note cancellation
 * This reverses stock movements (removes the stock that was added back) and deletes all items
 */
export async function deleteDeliveryNoteCancellation(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get cancellation with items
    const cancellation = await getDeliveryNoteCancellationById(input.id);
    if (!cancellation) {
      return {
        data: null,
        error: "Annulation non trouvée",
      };
    }

    // Check if cancellation has items
    if (cancellation.items.length === 0) {
      // No items, just delete the cancellation
      await db
        .delete(deliveryNoteCancellation)
        .where(eq(deliveryNoteCancellation.id, input.id));

      updateTag("deliveryNoteCancellations");
      updateTag("stock");
      updateTag("stockMovements");

      return {
        data: null,
        error: null,
      };
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const cancellationDateValue = formatDateLocal(cancellation.cancellationDate);
    const noteType = cancellation.items[0]?.noteType || "local";

    await db.transaction(async (tx) => {
      // 1) Reverse stock movements (remove the stock that was added back)
      const existingMovements = await tx
        .select()
        .from(stockMovement)
        .where(
          and(
            eq(stockMovement.referenceType, "delivery_note_cancellation"),
            eq(stockMovement.referenceId, input.id)
          )
        );

      for (const movement of existingMovements) {
        const existingStock = await tx
          .select()
          .from(stockCurrent)
          .where(eq(stockCurrent.productId, movement.productId))
          .limit(1);

        if (existingStock.length > 0) {
          const currentStock = existingStock[0];
          const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
          const movementQuantity = parseFloat(movement.quantity || "0");
          const newQuantity = currentQuantity - movementQuantity; // Reverse 'in' movement (remove stock)

          if (newQuantity < 0) {
            throw new Error(
              `Quantité insuffisante en stock pour le produit ${movement.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${movementQuantity}`
            );
          }

          await tx
            .update(stockCurrent)
            .set({
              quantityAvailable: newQuantity.toString(),
              lastMovementDate: cancellationDateValue,
              lastUpdated: new Date(),
            })
            .where(eq(stockCurrent.productId, movement.productId));
        }

        // Delete the movement
        await tx.delete(stockMovement).where(eq(stockMovement.id, movement.id));
      }

      // 2) Restore quantities in delivery_note_item before deleting cancellation items
      const cancellationItems = await tx
        .select()
        .from(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, input.id));

      for (const cancelledItem of cancellationItems) {
        const deliveryNoteItem = await tx
          .select()
          .from(deliveryNoteItem)
          .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId))
          .limit(1);

        if (deliveryNoteItem.length > 0) {
          const currentQuantity = parseFloat(deliveryNoteItem[0].quantity);
          const currentLineTotal = parseFloat(deliveryNoteItem[0].lineTotal);
          const cancelledQuantity = parseFloat(cancelledItem.quantity);
          
          // Restore the cancelled quantity
          const restoredQuantity = currentQuantity + cancelledQuantity;
          
          // Restore lineTotal proportionally based on quantity ratio
          const quantityRatio = currentQuantity > 0 ? restoredQuantity / currentQuantity : 1;
          const restoredLineTotal = currentLineTotal * quantityRatio;

          await tx
            .update(deliveryNoteItem)
            .set({
              quantity: restoredQuantity.toString(),
              lineTotal: restoredLineTotal.toFixed(2),
            })
            .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId));
        }
      }

      // 3) Delete all cancellation items
      await tx
        .delete(deliveryNoteCancellationItem)
        .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, input.id));

      // 4) Delete the cancellation
      await tx
        .delete(deliveryNoteCancellation)
        .where(eq(deliveryNoteCancellation.id, input.id));
    });

    updateTag("deliveryNoteCancellations");
    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting delivery note cancellation", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete multiple delivery note cancellations
 * This reverses stock movements and deletes all items for each cancellation
 */
export async function deleteDeliveryNoteCancellations(input: { ids: string[] }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    if (input.ids.length === 0) {
      return {
        data: null,
        error: "Aucune annulation sélectionnée",
      };
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Get all cancellations with their items
    const cancellations = await Promise.all(
      input.ids.map((id) => getDeliveryNoteCancellationById(id))
    );

    await db.transaction(async (tx) => {
      for (const cancellation of cancellations) {
        if (!cancellation) continue;

        const cancellationDateValue = formatDateLocal(cancellation.cancellationDate);

        // 1) Reverse stock movements (remove the stock that was added back)
        const existingMovements = await tx
          .select()
          .from(stockMovement)
          .where(
            and(
              eq(stockMovement.referenceType, "delivery_note_cancellation"),
              eq(stockMovement.referenceId, cancellation.id)
            )
          );

        for (const movement of existingMovements) {
          const existingStock = await tx
            .select()
            .from(stockCurrent)
            .where(eq(stockCurrent.productId, movement.productId))
            .limit(1);

          if (existingStock.length > 0) {
            const currentStock = existingStock[0];
            const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
            const movementQuantity = parseFloat(movement.quantity || "0");
            const newQuantity = currentQuantity - movementQuantity; // Reverse 'in' movement (remove stock)

            if (newQuantity < 0) {
              throw new Error(
                `Quantité insuffisante en stock pour le produit ${movement.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${movementQuantity}`
              );
            }

            await tx
              .update(stockCurrent)
              .set({
                quantityAvailable: newQuantity.toString(),
                lastMovementDate: cancellationDateValue,
                lastUpdated: new Date(),
              })
              .where(eq(stockCurrent.productId, movement.productId));
          }

          // Delete the movement
          await tx.delete(stockMovement).where(eq(stockMovement.id, movement.id));
        }

        // 2) Restore quantities in delivery_note_item before deleting cancellation items
        const cancellationItems = await tx
          .select()
          .from(deliveryNoteCancellationItem)
          .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, cancellation.id));

        for (const cancelledItem of cancellationItems) {
          const deliveryNoteItem = await tx
            .select()
            .from(deliveryNoteItem)
            .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId))
            .limit(1);

          if (deliveryNoteItem.length > 0) {
            const currentQuantity = parseFloat(deliveryNoteItem[0].quantity);
            const currentLineTotal = parseFloat(deliveryNoteItem[0].lineTotal);
            const cancelledQuantity = parseFloat(cancelledItem.quantity);
            
            // Restore the cancelled quantity
            const restoredQuantity = currentQuantity + cancelledQuantity;
            
            // Restore lineTotal proportionally
            const totalQuantity = restoredQuantity;
            const quantityRatio = totalQuantity > 0 ? totalQuantity / (totalQuantity - cancelledQuantity) : 1;
            const restoredLineTotal = currentLineTotal * quantityRatio;

            await tx
              .update(deliveryNoteItem)
              .set({
                quantity: restoredQuantity.toString(),
                lineTotal: restoredLineTotal.toFixed(2),
              })
              .where(eq(deliveryNoteItem.id, cancelledItem.deliveryNoteItemId));
          }
        }

        // 3) Delete all cancellation items
        await tx
          .delete(deliveryNoteCancellationItem)
          .where(eq(deliveryNoteCancellationItem.deliveryNoteCancellationId, cancellation.id));
      }

      // 4) Delete all cancellations
      await tx
        .delete(deliveryNoteCancellation)
        .where(inArray(deliveryNoteCancellation.id, input.ids));
    });

    updateTag("deliveryNoteCancellations");
    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting delivery note cancellations", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

