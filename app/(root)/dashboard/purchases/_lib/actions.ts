"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { purchaseOrder, purchaseOrderItem, partner, product, stockCurrent, stockMovement, invoice, invoiceItem, payment } from "@/db/schema";
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
  supplierId: string;
  orderDate: Date;
  receptionDate?: Date;
  status?: string;
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

    // Generate purchase order number automatically
    const { generatePurchaseOrderNumber } = await import("@/lib/utils/invoice-number-generator");
    let orderNumber = generatePurchaseOrderNumber();
    
    // Check if order number already exists and regenerate if needed
    let attempts = 0;
    while (attempts < 10) {
      const existingOrder = await db
        .select({ id: purchaseOrder.id })
        .from(purchaseOrder)
        .where(eq(purchaseOrder.orderNumber, orderNumber))
        .limit(1)
        .execute();

      if (existingOrder.length === 0) {
        break; // Number is unique
      }
      
      // Regenerate if exists
      orderNumber = generatePurchaseOrderNumber();
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
        orderNumber: orderNumber,
        supplierId: input.supplierId,
        orderDate: orderDateValue,
        receptionDate: receptionDateValue,
        status: (input.status as "pending" | "received" | "cancelled") || "pending",
        supplierOrderNumber: input.supplierOrderNumber || null,
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
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Check if purchase order has items
    const items = await db
      .select({ id: purchaseOrderItem.id })
      .from(purchaseOrderItem)
      .where(eq(purchaseOrderItem.purchaseOrderId, input.id))
      .limit(1);

    if (items.length > 0) {
      return {
        data: null,
        error: "Impossible de supprimer ce bon de commande car il contient des produits. Veuillez d'abord supprimer tous les produits.",
      };
    }

    // Get purchase order with items (for stock adjustment if needed)
    const purchaseOrderData = await getPurchaseOrderById(input.id);
    if (!purchaseOrderData) {
      return {
        data: null,
        error: "Bon de commande non trouvé",
      };
    }

    const orderData = purchaseOrderData;

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

      // Adjust stock: reverse the stock movements (remove the stock that was added)
      if (orderData.items && orderData.items.length > 0) {
        const formatDateLocal = (date: Date | string): string => {
          const d = date instanceof Date ? date : new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Use receptionDate if available, otherwise use orderDate
        const movementDate = orderData.receptionDate 
          ? formatDateLocal(orderData.receptionDate)
          : formatDateLocal(orderData.orderDate);

        await updateStockFromPurchaseOrder(
          tx,
          orderData.items.map((item: { productId: string; quantity: number | string; unitCost: number | string }) => ({
            productId: item.productId,
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
            unitCost: typeof item.unitCost === 'string' ? parseFloat(item.unitCost) : item.unitCost,
          })),
          movementDate,
          input.id,
          user.id,
          true // isReversal = true to remove stock
        );
      }

      // Delete purchase order items
      await tx
        .delete(purchaseOrderItem)
        .where(eq(purchaseOrderItem.purchaseOrderId, input.id));

      // Delete purchase order
      await tx
        .delete(purchaseOrder)
        .where(eq(purchaseOrder.id, input.id));
    });

    updateTag("purchaseOrders");
    updateTag("invoices");
    updateTag("payments");
    updateTag("stock");
    updateTag("stockMovements");

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
    if (input.ids.length === 0) {
      return {
        data: null,
        error: "Aucun bon de commande sélectionné",
      };
    }

    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
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
        error: `Impossible de supprimer ${items.length > 1 ? 'ces bons de commande' : 'ce bon de commande'} car ${items.length > 1 ? 'ils contiennent' : 'il contient'} des produits. Veuillez d'abord supprimer tous les produits.`,
      };
    }

    // Get all purchase orders with their items for stock adjustment BEFORE transaction
    const purchaseOrdersData = await Promise.all(
      input.ids.map(id => getPurchaseOrderById(id))
    );

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

      // Adjust stock for each purchase order
      for (const orderResult of purchaseOrdersData) {
        if (orderResult && orderResult.items && orderResult.items.length > 0) {
          const orderData = orderResult;
          const formatDateLocal = (date: Date | string): string => {
            const d = date instanceof Date ? date : new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          // Use receptionDate if available, otherwise use orderDate
          const movementDate = orderData.receptionDate 
            ? formatDateLocal(orderData.receptionDate)
            : formatDateLocal(orderData.orderDate);

          await updateStockFromPurchaseOrder(
            tx,
            orderData.items.map((item: { productId: string; quantity: number | string; unitCost: number | string }) => ({
              productId: item.productId,
              quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
              unitCost: typeof item.unitCost === 'string' ? parseFloat(item.unitCost) : item.unitCost,
            })),
            movementDate,
            orderData.id,
            user.id,
            true // isReversal = true to remove stock
          );
        }
      }

      // Delete purchase order items
      await tx
        .delete(purchaseOrderItem)
        .where(inArray(purchaseOrderItem.purchaseOrderId, input.ids));

      // Delete purchase orders
      await tx
        .delete(purchaseOrder)
        .where(inArray(purchaseOrder.id, input.ids));
    });

    updateTag("purchaseOrders");
    updateTag("invoices");
    updateTag("payments");
    updateTag("stock");
    updateTag("stockMovements");

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

export async function createInvoiceFromPurchaseOrder(input: { purchaseOrderId: string; invoiceNumber?: string }) {
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
        error: "Bon de commande non trouvé",
      };
    }

    if (!purchaseOrderData.items || purchaseOrderData.items.length === 0) {
      return {
        data: null,
        error: "Le bon de commande ne contient aucun produit",
      };
    }

    // Check if invoice already exists for this purchase order
    const existingInvoice = await db
      .select({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })
      .from(invoice)
      .where(eq(invoice.purchaseOrderId, input.purchaseOrderId))
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
        supplierOrderNumber: purchaseOrderData.supplierOrderNumber || null,
        invoiceDate: invoiceDateValue,
        dueDate: dueDateValue,
        status: "active",
        paymentStatus: "unpaid",
        currency: "DZD",
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes: purchaseOrderData.notes || null,
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

    // Helper function to format date
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Get the current purchase order data
    const oldPurchaseOrder = await getPurchaseOrderById(input.id);
    if (!oldPurchaseOrder) {
      return {
        data: null,
        error: "Bon de commande non trouvé",
      };
    }

    const oldStatus = oldPurchaseOrder.status;
    const newStatus = input.status;

    // If status hasn't changed, no need to update
    if (oldStatus === newStatus) {
      return {
        data: null,
        error: null,
      };
    }

    const movementDate = oldPurchaseOrder.receptionDate 
      ? (oldPurchaseOrder.receptionDate instanceof Date 
          ? formatDateLocal(oldPurchaseOrder.receptionDate)
          : formatDateLocal(new Date(oldPurchaseOrder.receptionDate)))
      : (oldPurchaseOrder.orderDate instanceof Date 
          ? formatDateLocal(oldPurchaseOrder.orderDate)
          : formatDateLocal(new Date(oldPurchaseOrder.orderDate)));

    await db.transaction(async (tx) => {
      // Handle stock updates based on status changes
      const oldItems = oldPurchaseOrder.items || [];

      // Case 1: Status changed from "received" to "pending" or "cancelled" - reverse stock
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
      // Case 2: Status changed from "pending" or "cancelled" to "received" - add items to stock
      else if ((oldStatus === "pending" || oldStatus === "cancelled") && newStatus === "received") {
        if (oldItems.length > 0) {
          await updateStockFromPurchaseOrder(
            tx,
            oldItems.map(item => ({
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

      // Update purchase order status
      await tx
        .update(purchaseOrder)
        .set({
          status: newStatus,
        })
        .where(eq(purchaseOrder.id, input.id));
    });

    updateTag("purchaseOrders");
    updateTag("stock");
    updateTag("stockMovements");

    return {
      data: null,
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

