"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { 
  deliveryNote, 
  deliveryNoteItem, 
  partner, 
  product, 
  stockCurrent, 
  stockMovement 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import { getDeliveryNoteById } from "@/data/delivery-note/delivery-note.dal";

/**
 * Helper function to update stock when delivery note items are added
 * This creates stock movements (out) and updates stock_current
 */
async function updateStockFromDeliveryNote(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  items: Array<{
    productId: string;
    quantity: number;
  }>,
  movementDate: string,
  referenceId: string,
  userId: string,
  noteType: "local" | "export",
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

    if (existingStock.length === 0) {
      throw new Error(
        `Produit ${item.productId} n'existe pas en stock`
      );
    }

    const movementId = generateId();
    const currentStock = existingStock[0];
    const currentQuantity = parseFloat(currentStock.quantityAvailable || "0");
    const currentAverageCost = parseFloat(currentStock.averageCost || "0");
    const quantityChange = isReversal ? item.quantity : -item.quantity;
    const newQuantity = currentQuantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error(
        `Quantité insuffisante en stock pour le produit ${item.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${Math.abs(quantityChange)}`
      );
    }

    // Create stock movement (out)
    await tx.insert(stockMovement).values({
      id: movementId,
      productId: item.productId,
      movementType: "out",
      movementSource: noteType === "local" ? "sale_local" : "sale_export",
      referenceType: "delivery_note",
      referenceId: referenceId,
      quantity: item.quantity.toString(),
      unitCost: currentAverageCost.toString(), // Use average cost for outgoing stock
      movementDate: movementDate,
      notes: isReversal 
        ? `Annulation du bon de livraison ${referenceId}`
        : `Sortie pour bon de livraison ${referenceId}`,
      createdBy: userId,
    });

    // Update stock_current
    await tx
      .update(stockCurrent)
      .set({
        quantityAvailable: newQuantity.toString(),
        averageCost: currentAverageCost.toFixed(2), // Keep same average cost for outgoing stock
        lastMovementDate: movementDate,
        lastUpdated: new Date(),
      })
      .where(eq(stockCurrent.productId, item.productId));
  }
}

export async function addDeliveryNote(input: {
  noteType: "local" | "export";
  clientId: string;
  noteDate: Date;
  status?: string;
  currency?: string;
  destinationCountry?: string;
  deliveryLocation?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
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

    if (!input.items || input.items.length === 0) {
      return {
        data: null,
        error: "Veuillez ajouter au moins un produit",
      };
    }

    // Generate delivery note number automatically
    const { generateDeliveryNoteNumber } = await import("@/lib/utils/invoice-number-generator");
    let noteNumber = generateDeliveryNoteNumber(input.noteType);
    
    // Check if note number already exists and regenerate if needed
    let attempts = 0;
    while (attempts < 10) {
      const existingNote = await db
        .select({ id: deliveryNote.id })
        .from(deliveryNote)
        .where(eq(deliveryNote.noteNumber, noteNumber))
        .limit(1)
        .execute();

      if (existingNote.length === 0) {
        break; // Number is unique
      }
      
      // Regenerate if exists
      noteNumber = generateDeliveryNoteNumber(input.noteType);
      attempts++;
    }

    if (attempts >= 10) {
      return {
        data: null,
        error: "Impossible de générer un numéro unique. Veuillez réessayer.",
      };
    }

    const id = generateId();

    await db.transaction(async (tx) => {
      // Convert Date to string format YYYY-MM-DD for PostgreSQL date type
      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const noteDateValue = input.noteDate instanceof Date 
        ? formatDateLocal(input.noteDate)
        : formatDateLocal(new Date(input.noteDate));

      // Insert delivery note
      await tx.insert(deliveryNote).values({
        id,
        noteNumber: noteNumber,
        noteType: input.noteType,
        clientId: input.clientId,
        noteDate: noteDateValue,
        status: (input.status as "active" | "cancelled") || "active",
        currency: input.currency || "DZD",
        destinationCountry: input.destinationCountry || null,
        deliveryLocation: input.deliveryLocation || null,
        notes: input.notes || null,
        createdBy: user.id,
      });

      // Insert delivery note items
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map((item) => ({
          id: generateId(),
          deliveryNoteId: id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: (item.discountPercent || 0).toString(),
          lineTotal: item.lineTotal.toString(),
        }));

        await tx.insert(deliveryNoteItem).values(itemsToInsert);

        // Update stock (out movement)
        await updateStockFromDeliveryNote(
          tx,
          input.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          noteDateValue,
          id,
          user.id,
          input.noteType,
          false
        );
      }
    });

    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error adding delivery note", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

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

export async function getAllActiveProducts() {
  try {
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        code: product.code,
        salePriceLocal: product.salePriceLocal,
        salePriceExport: product.salePriceExport,
        taxRate: product.taxRate,
        unitOfMeasure: product.unitOfMeasure,
      })
      .from(product)
      .where(eq(product.isActive, true));

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        salePriceLocal: p.salePriceLocal ? parseFloat(p.salePriceLocal) : null,
        salePriceExport: p.salePriceExport ? parseFloat(p.salePriceExport) : null,
        taxRate: p.taxRate ? parseFloat(p.taxRate) : 0,
        unitOfMeasure: p.unitOfMeasure,
      })),
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

export async function getDeliveryNoteByIdAction(input: { id: string }) {
  try {
    const result = await getDeliveryNoteById(input.id);
    
    if (!result) {
      return {
        data: null,
        error: "Bon de livraison non trouvé",
      };
    }

    return {
      data: result,
      error: null,
    };
  } catch (err) {
    console.error("Error getting delivery note by ID", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteDeliveryNote(input: { id: string }) {
  try {
    await db.delete(deliveryNote).where(eq(deliveryNote.id, input.id));

    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting delivery note", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteDeliveryNotes(input: { ids: string[] }) {
  try {
    if (input.ids.length === 0) {
      return {
        data: null,
        error: "Aucun bon de livraison sélectionné",
      };
    }

    await db.delete(deliveryNote).where(
      and(...input.ids.map((id) => eq(deliveryNote.id, id)))
    );

    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error deleting delivery notes", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

