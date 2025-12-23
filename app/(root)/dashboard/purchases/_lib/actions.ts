"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { purchaseOrder, purchaseOrderItem, partner, product, stockCurrent, stockMovement, invoice, invoiceItem, payment, user } from "@/db/schema";
import { eq, inArray, and, asc, desc, not, or, gte, lte } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import { getPurchaseOrderById } from "@/data/purchase-order/purchase-order.dal";

/**
 * Get all suppliers
 */
export async function getAllSuppliers() {
  try {
    const suppliers = await db
      .select({
        id: partner.id,
        name: partner.name,
      })
      .from(partner)
      .where(eq(partner.type, "fournisseur"))
      .orderBy(asc(partner.name));

    return {
      data: suppliers,
      error: null,
    };
  } catch (err) {
    console.error("Error getting all suppliers", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get purchase order by ID
 */
export async function getPurchaseOrderByIdAction(input: { id: string }) {
  try {
    const result = await getPurchaseOrderById(input.id);
    
    if (!result) {
      return {
        data: null,
        error: "Commande d'achat non trouvée",
      };
    }

    return {
      data: result,
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

/**
 * Get all active products
 */
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
      .where(eq(product.isActive, true))
      .orderBy(asc(product.name));

    return {
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        purchasePrice: p.purchasePrice,
        salePriceLocal: p.salePriceLocal,
        salePriceExport: p.salePriceExport,
        taxRate: p.taxRate,
        unitOfMeasure: p.unitOfMeasure || "unité",
      })),
      error: null,
    };
  } catch (err) {
    console.error("Error getting all active products", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

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
      // Create new stock_current entry
      if (!isReversal && item.quantity > 0) {
        const stockId = generateId();
        await tx.insert(stockCurrent).values({
          id: stockId,
          productId: item.productId,
          quantityAvailable: item.quantity.toString(),
          averageCost: item.unitCost.toFixed(2),
          lastMovementDate: movementDate,
          lastUpdated: new Date(),
        });
      }
    }
  }
}

/**
 * Add a new purchase order
 */
export async function addPurchaseOrder(input: {
  supplierId: string;
  orderDate: Date;
  receptionDate?: Date | null;
  status?: "pending" | "received" | "cancelled";
  supplierOrderNumber?: string;
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

    // Generate order number
    const { generatePurchaseOrderNumber } = await import("@/lib/utils/invoice-number-generator");
    const orderNumber = generatePurchaseOrderNumber();

    // Check if order number already exists
    const existingOrder = await db
      .select({ id: purchaseOrder.id })
      .from(purchaseOrder)
      .where(eq(purchaseOrder.orderNumber, orderNumber))
      .limit(1);

    if (existingOrder.length > 0) {
      return {
        data: null,
        error: `Le numéro de commande "${orderNumber}" existe déjà. Veuillez réessayer.`,
      };
    }

    const id = generateId();

    // Helper to format date as YYYY-MM-DD for PostgreSQL date type
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    await db.transaction(async (tx) => {
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
        orderNumber: orderNumber,
        supplierId: input.supplierId,
        orderDate: orderDateValue,
        receptionDate: receptionDateValue,
        status: input.status || "pending",
        supplierOrderNumber: input.supplierOrderNumber || null,
        totalAmount: input.totalAmount || null,
        notes: input.notes || null,
        createdBy: user.id
      });

      // Insert purchase order items if provided
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map(item => ({
          id: generateId(),
          purchaseOrderId: id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitCost: item.unitCost.toString(),
          lineTotal: item.lineTotal.toString()
        }));

        if (itemsToInsert.length > 0) {
          await tx.insert(purchaseOrderItem).values(itemsToInsert);
        }

        // If status is "received", update stock
        const status = input.status || "pending";
        if (status === "received") {
          const movementDate = receptionDateValue || orderDateValue;
          await updateStockFromPurchaseOrder(tx, input.items, movementDate, id, user.id, false);
        }
      }
    });

    updateTag("purchaseOrders");
    updateTag("stock");

    return {
      data: { id, orderNumber },
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

/**
 * Update purchase order
 */
export async function updatePurchaseOrder(input: {
  id: string;
  orderNumber: string;
  supplierId: string;
  orderDate: Date;
  receptionDate?: Date | null;
  status?: "pending" | "received" | "cancelled";
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

    // Get existing purchase order
    const existingOrder = await getPurchaseOrderById(input.id);
    if (!existingOrder) {
      return {
        data: null,
        error: "Commande d'achat non trouvée",
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
      const orderDateValue = input.orderDate instanceof Date 
        ? formatDateLocal(input.orderDate)
        : formatDateLocal(new Date(input.orderDate));
      
      const receptionDateValue = input.receptionDate 
        ? (input.receptionDate instanceof Date 
            ? formatDateLocal(input.receptionDate)
            : formatDateLocal(new Date(input.receptionDate)))
        : null;

      const newStatus = input.status || existingOrder.status || "pending";
      const oldStatus = existingOrder.status || "pending";

      // 1) If old status was "received", reverse existing stock movements
      if (oldStatus === "received") {
        const movements = await tx
          .select()
          .from(stockMovement)
          .where(
            and(
              eq(stockMovement.referenceType, "purchase_order"),
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
            const currentAverageCost = parseFloat(currentStock.averageCost || "0");
            const movementQuantity = parseFloat(movement.quantity || "0");
            const movementUnitCost = parseFloat(movement.unitCost || "0");
            const newQuantity = currentQuantity - movementQuantity; // reverse 'in'

            if (newQuantity < 0) {
              throw new Error(
                `Quantité insuffisante en stock pour le produit ${movement.productId}. Stock actuel: ${currentQuantity}, Tentative de retrait: ${movementQuantity}`
              );
            }

            // Recalculate average cost when reversing
            let newAverageCost = currentAverageCost;
            if (newQuantity > 0 && currentQuantity > 0) {
              // Calculate what the average cost was before this movement
              const totalCostBefore = currentQuantity * currentAverageCost;
              const movementCost = movementQuantity * movementUnitCost;
              const costBefore = totalCostBefore - movementCost;
              newAverageCost = costBefore / newQuantity;
            }

            await tx
              .update(stockCurrent)
              .set({
                quantityAvailable: newQuantity.toString(),
                averageCost: newAverageCost.toFixed(2),
                lastMovementDate: orderDateValue,
                lastUpdated: new Date(),
              })
              .where(eq(stockCurrent.productId, movement.productId));
          }

          await tx.delete(stockMovement).where(eq(stockMovement.id, movement.id));
        }
      }

      // 2) Update purchase order main fields
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
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrder.id, input.id));

      // 3) Delete all existing items
      await tx
        .delete(purchaseOrderItem)
        .where(eq(purchaseOrderItem.purchaseOrderId, input.id));

      // 4) Insert new items
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map((item) => ({
          id: item.id || generateId(),
          purchaseOrderId: input.id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitCost: item.unitCost.toString(),
          lineTotal: item.lineTotal.toString(),
        }));

        await tx.insert(purchaseOrderItem).values(itemsToInsert);

        // 5) If new status is "received", apply stock movements
        if (newStatus === "received") {
          const movementDate = receptionDateValue || orderDateValue;
          await updateStockFromPurchaseOrder(
            tx,
            input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
            })),
            movementDate,
            input.id,
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

/**
 * Update purchase order status
 */
export async function updatePurchaseOrderStatus(input: {
  id: string;
  status: "pending" | "received" | "cancelled";
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get purchase order
    const purchaseOrderData = await getPurchaseOrderById(input.id);
    if (!purchaseOrderData) {
      return {
        data: null,
        error: "Commande d'achat non trouvée",
      };
    }

    // Update status
    await db
      .update(purchaseOrder)
      .set({
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrder.id, input.id));

    updateTag("purchaseOrders");

    return {
      data: { id: input.id, status: input.status },
      error: null,
    };
  } catch (err) {
    console.error("Error updating purchase order status", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Create invoice from purchase order
 */
export async function createInvoiceFromPurchaseOrder(input: {
  purchaseOrderId: string;
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

    // Get purchase order with items
    const purchaseOrderData = await getPurchaseOrderById(input.purchaseOrderId);
    
    if (!purchaseOrderData) {
      return {
        data: null,
        error: "Commande d'achat non trouvée",
      };
    }

    if (!purchaseOrderData.items || purchaseOrderData.items.length === 0) {
      return {
        data: null,
        error: "La commande d'achat ne contient aucun produit",
      };
    }

    // Check if invoice already exists for this purchase order
    const existingInvoice = await db
      .select({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })
      .from(invoice)
      .where(
        and(
          eq(invoice.purchaseOrderId, input.purchaseOrderId),
          eq(invoice.invoiceType, "purchase"),
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
    const invoiceNumber = input.invoiceNumber || generateInvoiceNumber("purchase");

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
    const productIds = purchaseOrderData.items.map(item => item.productId);
    const products = await db
      .select({
        id: product.id,
        taxRate: product.taxRate,
      })
      .from(product)
      .where(inArray(product.id, productIds));

    const productTaxMap = new Map(products.map(p => [p.id, parseFloat(p.taxRate || "0")]));

    // Convert purchase order items to invoice items with tax calculations
    const invoiceItems = purchaseOrderData.items.map(item => {
      const taxRate = productTaxMap.get(item.productId) || 0;
      // Calculate HT (subtotal) from quantity * unitCost
      const lineSubtotal = item.quantity * item.unitCost;
      // Calculate TVA from HT
      const lineTax = lineSubtotal * (taxRate / 100);
      // Calculate TTC (HT + TVA)
      const lineTotal = lineSubtotal + lineTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitCost,
        discountPercent: 0,
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

    const invoiceDate = purchaseOrderData.receptionDate || purchaseOrderData.orderDate;
    const invoiceDateValue = invoiceDate instanceof Date 
      ? formatDateLocal(invoiceDate)
      : formatDateLocal(new Date(invoiceDate));
    
    // Due date: 30 days from invoice date
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateValue = formatDateLocal(dueDate);

    const invoiceId = generateId();

    await db.transaction(async (tx) => {
      // Insert invoice
      await tx.insert(invoice).values({
        id: invoiceId,
        invoiceNumber: invoiceNumber,
        invoiceType: "purchase",
        supplierId: purchaseOrderData.supplierId,
        purchaseOrderId: input.purchaseOrderId,
        invoiceDate: invoiceDateValue,
        dueDate: dueDateValue,
        status: "active",
        paymentStatus: "unpaid",
        currency: "DZD",
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes: purchaseOrderData.notes || null,
        createdBy: user.id
      });

      // Insert invoice items
      const itemsToInsert = invoiceItems.map(item => ({
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

      if (itemsToInsert.length > 0) {
        await tx.insert(invoiceItem).values(itemsToInsert);
      }
    });

    updateTag("invoices");
    updateTag("purchaseOrders");

    return {
      data: { invoiceId, invoiceNumber },
      error: null,
      alreadyExists: false,
    };
  } catch (err) {
    console.error("Error creating invoice from purchase order", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a purchase order with cascade deletion
 */
export async function deletePurchaseOrder(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get purchase order with items
    const purchaseOrderData = await getPurchaseOrderById(input.id);
    if (!purchaseOrderData) {
      return {
        data: null,
        error: "Commande d'achat non trouvée",
      };
    }

    // Check if purchase order has items
    if (purchaseOrderData.items && purchaseOrderData.items.length > 0) {
      return {
        data: null,
        error: "Impossible de supprimer une commande d'achat qui contient des produits. Veuillez d'abord supprimer tous les produits de la commande.",
      };
    }

    await db.transaction(async (tx) => {
      // Get all invoices linked to this purchase order
      const linkedInvoices = await tx
        .select({ id: invoice.id })
        .from(invoice)
        .where(eq(invoice.purchaseOrderId, input.id));

      // For each invoice, get all payments and delete them
      for (const inv of linkedInvoices) {
        const invoicePayments = await tx
          .select({ id: payment.id })
          .from(payment)
          .where(eq(payment.invoiceId, inv.id));

        // Delete all payments for this invoice
        if (invoicePayments.length > 0) {
          await tx
            .delete(payment)
            .where(eq(payment.invoiceId, inv.id));
        }

        // Delete invoice items
        await tx
          .delete(invoiceItem)
          .where(eq(invoiceItem.invoiceId, inv.id));
      }

      // Delete all invoices linked to this purchase order
      if (linkedInvoices.length > 0) {
        await tx
          .delete(invoice)
          .where(eq(invoice.purchaseOrderId, input.id));
      }

      // Delete purchase order items (should be empty, but just in case)
      await tx
        .delete(purchaseOrderItem)
        .where(eq(purchaseOrderItem.purchaseOrderId, input.id));

      // Delete the purchase order
      await tx
        .delete(purchaseOrder)
        .where(eq(purchaseOrder.id, input.id));
    });

    updateTag("purchaseOrders");
    updateTag("invoices");
    updateTag("payments");

    return {
      data: { id: input.id },
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

/**
 * Delete multiple purchase orders with cascade deletion
 */
export async function deletePurchaseOrders(input: { ids: string[] }) {
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
        error: "Aucun bon de commande sélectionné",
      };
    }

    // Check if any purchase order has items
    const items = await db
      .select({
        purchaseOrderId: purchaseOrderItem.purchaseOrderId,
        orderNumber: purchaseOrder.orderNumber,
      })
      .from(purchaseOrderItem)
      .innerJoin(purchaseOrder, eq(purchaseOrderItem.purchaseOrderId, purchaseOrder.id))
      .where(inArray(purchaseOrderItem.purchaseOrderId, input.ids));

    if (items.length > 0) {
      const orderNumbers = Array.from(new Set(items.map(item => item.orderNumber)));
      return {
        data: null,
        error: `Impossible de supprimer les commandes d'achat suivantes car elles contiennent des produits: ${orderNumbers.join(", ")}. Veuillez d'abord supprimer tous les produits de ces commandes.`,
      };
    }

    await db.transaction(async (tx) => {
      // Get all invoices linked to these purchase orders
      const linkedInvoices = await tx
        .select({ id: invoice.id })
        .from(invoice)
        .where(inArray(invoice.purchaseOrderId, input.ids));

      // For each invoice, get all payments and delete them
      for (const inv of linkedInvoices) {
        const invoicePayments = await tx
          .select({ id: payment.id })
          .from(payment)
          .where(eq(payment.invoiceId, inv.id));

        // Delete all payments for this invoice
        if (invoicePayments.length > 0) {
          await tx
            .delete(payment)
            .where(eq(payment.invoiceId, inv.id));
        }

        // Delete invoice items
        await tx
          .delete(invoiceItem)
          .where(eq(invoiceItem.invoiceId, inv.id));
      }

      // Delete all invoices linked to these purchase orders
      if (linkedInvoices.length > 0) {
        await tx
          .delete(invoice)
          .where(inArray(invoice.purchaseOrderId, input.ids));
      }

      // Delete purchase order items (should be empty, but just in case)
      await tx
        .delete(purchaseOrderItem)
        .where(inArray(purchaseOrderItem.purchaseOrderId, input.ids));

      // Delete the purchase orders
      await tx
        .delete(purchaseOrder)
        .where(inArray(purchaseOrder.id, input.ids));
    });

    updateTag("purchaseOrders");
    updateTag("invoices");
    updateTag("payments");

    return {
      data: { ids: input.ids },
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

/**
 * Get all purchase orders with their items for PDF export
 */
export async function getAllPurchaseOrdersForExport(input?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    // Helper to format date as YYYY-MM-DD for PostgreSQL date type
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Build where conditions for date filtering
    const dateConditions = [];
    if (input?.startDate) {
      dateConditions.push(gte(purchaseOrder.orderDate, formatDateLocal(input.startDate)));
    }
    if (input?.endDate) {
      // Add one day to endDate to include the entire end date
      const endDatePlusOne = new Date(input.endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      dateConditions.push(lte(purchaseOrder.orderDate, formatDateLocal(endDatePlusOne)));
    }

    const whereCondition = dateConditions.length > 0 ? and(...dateConditions) : undefined;

    const orders = await db
      .select({
        purchaseOrder: purchaseOrder,
        supplier: {
          id: partner.id,
          name: partner.name,
          address: partner.address,
          phone: partner.phone,
          email: partner.email,
        },
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(purchaseOrder)
      .leftJoin(partner, eq(purchaseOrder.supplierId, partner.id))
      .leftJoin(user, eq(purchaseOrder.createdBy, user.id))
      .where(whereCondition)
      .orderBy(desc(purchaseOrder.orderDate), desc(purchaseOrder.createdAt));

    // Get items for each purchase order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            item: purchaseOrderItem,
            product: {
              id: product.id,
              name: product.name,
              code: product.code,
            },
          })
          .from(purchaseOrderItem)
          .leftJoin(product, eq(purchaseOrderItem.productId, product.id))
          .where(eq(purchaseOrderItem.purchaseOrderId, order.purchaseOrder.id))
          .orderBy(asc(purchaseOrderItem.id));

        const orderDate = typeof order.purchaseOrder.orderDate === 'string'
          ? new Date(order.purchaseOrder.orderDate + 'T00:00:00')
          : order.purchaseOrder.orderDate;
        const receptionDate = order.purchaseOrder.receptionDate
          ? (typeof order.purchaseOrder.receptionDate === 'string'
              ? new Date(order.purchaseOrder.receptionDate + 'T00:00:00')
              : order.purchaseOrder.receptionDate)
          : null;

        return {
          id: order.purchaseOrder.id,
          orderNumber: order.purchaseOrder.orderNumber,
          supplierId: order.purchaseOrder.supplierId,
          supplierName: order.supplier?.name || null,
          supplierAddress: order.supplier?.address || null,
          supplierPhone: order.supplier?.phone || null,
          supplierEmail: order.supplier?.email || null,
          orderDate,
          receptionDate,
          status: order.purchaseOrder.status || "pending",
          supplierOrderNumber: order.purchaseOrder.supplierOrderNumber || null,
          totalAmount: order.purchaseOrder.totalAmount ? parseFloat(order.purchaseOrder.totalAmount) : 0,
          notes: order.purchaseOrder.notes,
          createdBy: order.purchaseOrder.createdBy,
          createdByName: order.creator?.name || null,
          createdAt: order.purchaseOrder.createdAt,
          items: items.map((i) => ({
            id: i.item.id,
            productId: i.item.productId,
            productName: i.product?.name || null,
            productCode: i.product?.code || null,
            quantity: parseFloat(i.item.quantity),
            unitCost: parseFloat(i.item.unitCost),
            lineTotal: parseFloat(i.item.lineTotal),
          })),
        };
      })
    );

    return {
      data: ordersWithItems,
      error: null,
    };
  } catch (err) {
    console.error("Error getting all purchase orders for export", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}
