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
  stockMovement,
  deliveryNoteCancellation,
  deliveryNoteCancellationItem,
  invoice,
  invoiceItem,
} from "@/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
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
        break; // Number is unique, use it
      }

      // Regenerate number
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
        purchasePrice: product.purchasePrice,
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
        purchasePrice: p.purchasePrice ? parseFloat(p.purchasePrice) : 0,
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

export async function updateDeliveryNote(input: {
  id: string;
  noteNumber: string;
  noteType: "local" | "export";
  clientId: string;
  noteDate: Date;
  status?: string;
  currency?: string;
  destinationCountry?: string;
  deliveryLocation?: string;
  notes?: string;
  items: Array<{
    id: string;
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

    // Helper to format date as YYYY-MM-DD for PostgreSQL date type
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    await db.transaction(async (tx) => {
      // Get existing delivery note and items
      const existingNote = await tx
        .select()
        .from(deliveryNote)
        .where(eq(deliveryNote.id, input.id))
        .limit(1);

      if (existingNote.length === 0) {
        throw new Error("Bon de livraison non trouvé");
      }

      const note = existingNote[0];

      // Determine movement date based on new noteDate
      const noteDateValue =
        input.noteDate instanceof Date
          ? formatDateLocal(input.noteDate)
          : formatDateLocal(new Date(input.noteDate));

      // 1) Reverse existing stock movements for this delivery note
      const movements = await tx
        .select()
        .from(stockMovement)
        .where(
          and(
            eq(stockMovement.referenceType, "delivery_note"),
            eq(stockMovement.referenceId, input.id)
          )
        );

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
          const newQuantity = currentQuantity + movementQuantity; // reverse 'out'

          await tx
            .update(stockCurrent)
            .set({
              quantityAvailable: newQuantity.toString(),
              lastMovementDate: noteDateValue,
              lastUpdated: new Date(),
            })
            .where(eq(stockCurrent.productId, movement.productId));
        }

        await tx.delete(stockMovement).where(eq(stockMovement.id, movement.id));
      }

      // 2) Get existing items and check which ones are referenced by cancellations
      const existingItems = await tx
        .select()
        .from(deliveryNoteItem)
        .where(eq(deliveryNoteItem.deliveryNoteId, input.id));

      // Get items that are referenced by cancellation items (cannot be deleted)
      const cancellationItems = await tx
        .select({ deliveryNoteItemId: deliveryNoteCancellationItem.deliveryNoteItemId })
        .from(deliveryNoteCancellationItem)
        .innerJoin(
          deliveryNoteItem,
          eq(deliveryNoteCancellationItem.deliveryNoteItemId, deliveryNoteItem.id)
        )
        .where(eq(deliveryNoteItem.deliveryNoteId, input.id));

      const protectedItemIds = new Set(
        cancellationItems.map((ci) => ci.deliveryNoteItemId)
      );

      // 3) Update delivery note main fields
      await tx
        .update(deliveryNote)
        .set({
          noteNumber: input.noteNumber,
          noteType: input.noteType,
          clientId: input.clientId,
          noteDate: noteDateValue,
          status: (input.status as "active" | "cancelled") || note.status || "active",
          currency: input.currency || note.currency || "DZD",
          destinationCountry: input.destinationCountry ?? note.destinationCountry,
          deliveryLocation: input.deliveryLocation ?? note.deliveryLocation,
          notes: input.notes ?? note.notes,
        })
        .where(eq(deliveryNote.id, input.id));

      // 4) Process items: update existing, insert new, delete unused (if not protected)
      const inputItemIds = new Set(input.items.map((item) => item.id));
      const existingItemIds = new Set(existingItems.map((item) => item.id));

      // Update existing items
      for (const inputItem of input.items) {
        if (existingItemIds.has(inputItem.id)) {
          await tx
            .update(deliveryNoteItem)
            .set({
              productId: inputItem.productId,
              quantity: inputItem.quantity.toString(),
              unitPrice: inputItem.unitPrice.toString(),
              discountPercent: (inputItem.discountPercent || 0).toString(),
              lineTotal: inputItem.lineTotal.toString(),
            })
            .where(eq(deliveryNoteItem.id, inputItem.id));
        }
      }

      // Insert new items (those with IDs not in existing items)
      const itemsToInsert = input.items
        .filter((item) => !existingItemIds.has(item.id))
        .map((item) => ({
          id: item.id || generateId(),
          deliveryNoteId: input.id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: (item.discountPercent || 0).toString(),
          lineTotal: item.lineTotal.toString(),
        }));

      if (itemsToInsert.length > 0) {
        await tx.insert(deliveryNoteItem).values(itemsToInsert);
      }

      // Delete items that are no longer in the input (only if not protected by cancellations)
      const itemsToDelete = existingItems.filter(
        (item) => !inputItemIds.has(item.id) && !protectedItemIds.has(item.id)
      );

      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map((item) => item.id);
        await tx
          .delete(deliveryNoteItem)
          .where(inArray(deliveryNoteItem.id, idsToDelete));
      }

      // 5) Re-apply stock movements for new items (out movement)
      await updateStockFromDeliveryNote(
        tx,
        input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        noteDateValue,
        input.id,
        user.id,
        input.noteType,
        false
      );
    });

    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error updating delivery note", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateDeliveryNoteStatus(input: {
  id: string;
  status: "active" | "cancelled";
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Helper to format date as YYYY-MM-DD for PostgreSQL date type
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Get full delivery note with items
    const noteData = await getDeliveryNoteById(input.id);
    if (!noteData) {
      return {
        data: null,
        error: "Bon de livraison non trouvé",
      };
    }

    const oldStatus = (noteData.status as "active" | "cancelled") || "active";
    const newStatus = input.status;

    // If status hasn't changed, nothing to do
    if (oldStatus === newStatus) {
      return {
        data: null,
        error: null,
      };
    }

    const movementDate =
      noteData.noteDate instanceof Date
        ? formatDateLocal(noteData.noteDate)
        : formatDateLocal(new Date(noteData.noteDate));

    await db.transaction(async (tx) => {
      // Case 1: active -> cancelled
      if (oldStatus === "active" && newStatus === "cancelled") {
        // Reverse existing stock movements for this delivery note
        const movements = await tx
          .select()
          .from(stockMovement)
          .where(
            and(
              eq(stockMovement.referenceType, "delivery_note"),
              eq(stockMovement.referenceId, input.id)
            )
          );

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
            const newQuantity = currentQuantity + movementQuantity; // reverse 'out'

            await tx
              .update(stockCurrent)
              .set({
                quantityAvailable: newQuantity.toString(),
                lastMovementDate: movementDate,
                lastUpdated: new Date(),
              })
              .where(eq(stockCurrent.productId, movement.productId));
          }

          await tx.delete(stockMovement).where(eq(stockMovement.id, movement.id));
        }

        // Create delivery note cancellation record (if not already exists)
        const existingCancellation = await tx
          .select()
          .from(deliveryNoteCancellation)
          .where(eq(deliveryNoteCancellation.originalDeliveryNoteId, input.id))
          .limit(1);

        if (existingCancellation.length === 0) {
          const cancellationId = generateId();
          const { generateCancellationNumber } = await import("@/lib/utils/invoice-number-generator");
          const cancellationNumber = generateCancellationNumber("delivery_note_cancellation", cancellationId.slice(-6));

          await tx.insert(deliveryNoteCancellation).values({
            id: cancellationId,
            cancellationNumber,
            originalDeliveryNoteId: input.id,
            cancellationDate: movementDate,
            reason: null,
            createdBy: user.id,
          });
        }

        // Update delivery note status
        await tx
          .update(deliveryNote)
          .set({ status: "cancelled" })
          .where(eq(deliveryNote.id, input.id));
      }
      // Case 2: cancelled -> active
      else if (oldStatus === "cancelled" && newStatus === "active") {
        const items = noteData.items || [];

        if (items.length > 0) {
          // Re-apply stock movements (out) for each item
          await updateStockFromDeliveryNote(
            tx,
            items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            movementDate,
            input.id,
            user.id,
            (noteData.noteType as "local" | "export") || "export",
            false
          );
        }

        // Remove cancellation record(s)
        await tx
          .delete(deliveryNoteCancellation)
          .where(eq(deliveryNoteCancellation.originalDeliveryNoteId, input.id));

        // Update delivery note status
        await tx
          .update(deliveryNote)
          .set({ status: "active" })
          .where(eq(deliveryNote.id, input.id));
      }
    });

    updateTag("deliveryNotes");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.error("Error updating delivery note status", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function getInvoicesByDeliveryNoteId(input: { deliveryNoteId: string }) {
  try {
    const invoices = await db
      .select({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
      })
      .from(invoice)
      .where(
        and(
          eq(invoice.deliveryNoteId, input.deliveryNoteId),
          eq(invoice.status, "active")
        )
      );

    return {
      data: invoices,
      error: null,
    };
  } catch (err) {
    console.error("Error getting invoices by delivery note id", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

export async function createInvoiceFromDeliveryNote(input: { 
  deliveryNoteId: string; 
  invoiceType: "delivery_note_invoice" | "sale_export";
  invoiceNumber?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get delivery note with items
    const deliveryNoteData = await getDeliveryNoteById(input.deliveryNoteId);
    
    if (!deliveryNoteData) {
      return {
        data: null,
        error: "Bon de livraison non trouvé",
      };
    }

    if (!deliveryNoteData.items || deliveryNoteData.items.length === 0) {
      return {
        data: null,
        error: "Le bon de livraison ne contient aucun produit",
      };
    }

    // Check if invoice already exists for this delivery note and type
    const existingInvoice = await db
      .select({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })
      .from(invoice)
      .where(
        and(
          eq(invoice.deliveryNoteId, input.deliveryNoteId),
          eq(invoice.invoiceType, input.invoiceType),
          eq(invoice.status, "active")
        )
      )
      .limit(1)
      .execute();

    if (existingInvoice.length > 0) {
      return {
        data: { invoiceId: existingInvoice[0].id, invoiceNumber: existingInvoice[0].invoiceNumber },
        error: null,
        alreadyExists: true,
      };
    }

    // Generate invoice number if not provided
    const { generateInvoiceNumber } = await import("@/lib/utils/invoice-number-generator");
    const invoiceNumber = input.invoiceNumber || generateInvoiceNumber(input.invoiceType);

    // Check if invoice number already exists
    const existingInvoiceNumber = await db
      .select({ id: invoice.id })
      .from(invoice)
      .where(eq(invoice.invoiceNumber, invoiceNumber))
      .limit(1)
      .execute();

    if (existingInvoiceNumber.length > 0) {
      return {
        data: null,
        error: `Le numéro de facture "${invoiceNumber}" existe déjà. Veuillez utiliser un numéro différent.`,
      };
    }

    // Get products to calculate tax rates
    const productIds = deliveryNoteData.items.map(item => item.productId);
    const products = await db
      .select({
        id: product.id,
        taxRate: product.taxRate,
      })
      .from(product)
      .where(inArray(product.id, productIds));

    const productTaxMap = new Map(products.map(p => [p.id, parseFloat(p.taxRate || "0")]));

    // Convert delivery note items to invoice items with tax calculations
    const invoiceItems = deliveryNoteData.items.map(item => {
      const taxRate = productTaxMap.get(item.productId) || 0;
      // Calculate HT (subtotal) from quantity * unitPrice with discount
      const lineSubtotal = parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString()) * (1 - parseFloat(item.discountPercent?.toString() || "0") / 100);
      // Calculate TVA from HT
      const lineTax = lineSubtotal * (taxRate / 100);
      // Calculate TTC (HT + TVA)
      const lineTotal = lineSubtotal + lineTax;

      return {
        productId: item.productId,
        quantity: parseFloat(item.quantity.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        discountPercent: parseFloat(item.discountPercent?.toString() || "0"),
        taxRate: taxRate,
        lineSubtotal: lineSubtotal,
        lineTax: lineTax,
        lineTotal: lineTotal,
      };
    });

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const taxAmount = invoiceItems.reduce((sum, item) => sum + item.lineTax, 0);
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);

    // Format dates
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const invoiceDate = deliveryNoteData.noteDate;
    const invoiceDateValue = invoiceDate instanceof Date 
      ? formatDateLocal(invoiceDate)
      : formatDateLocal(new Date(invoiceDate));
    
    // Due date: 30 days from invoice date (only for sale_export)
    let dueDateValue: string | null = null;
    if (input.invoiceType === "sale_export") {
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      dueDateValue = formatDateLocal(dueDate);
    }

    const invoiceId = generateId();

    await db.transaction(async (tx) => {
      // Insert invoice
      await tx.insert(invoice).values({
        id: invoiceId,
        invoiceNumber: invoiceNumber,
        invoiceType: input.invoiceType,
        clientId: deliveryNoteData.clientId,
        deliveryNoteId: input.deliveryNoteId,
        invoiceDate: invoiceDateValue,
        dueDate: dueDateValue,
        status: "active",
        paymentStatus: "unpaid",
        currency: deliveryNoteData.currency || "DZD",
        destinationCountry: deliveryNoteData.destinationCountry || null,
        deliveryLocation: deliveryNoteData.deliveryLocation || null,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes: deliveryNoteData.notes || null,
        createdBy: user.id,
      });

      // Insert invoice items
      const itemsToInsert = invoiceItems.map((item) => ({
        id: generateId(),
        invoiceId: invoiceId,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: item.discountPercent.toString(),
        taxRate: item.taxRate.toString(),
        lineSubtotal: item.lineSubtotal.toString(),
        lineTax: item.lineTax.toString(),
        lineTotal: item.lineTotal.toString(),
      }));

      await tx.insert(invoiceItem).values(itemsToInsert);
    });

    updateTag("invoices");
    updateTag("deliveryNotes");

    return {
      data: { invoiceId, invoiceNumber },
      error: null,
      alreadyExists: false,
    };
  } catch (err) {
    console.error("Error creating invoice from delivery note", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}


