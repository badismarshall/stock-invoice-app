"use server";

import { updateTag } from "next/cache";
import { getErrorMessage } from "@/lib/handle-error";
import { generateId } from "@/lib/data-table/id";
import db from "@/db";
import { purchaseOrder, purchaseOrderItem, partner, product } from "@/db/schema";
import { eq, inArray, and, asc, not } from "drizzle-orm";
import { getCurrentUser } from "@/data/user/user-auth";
import { getPurchaseOrderById } from "@/data/purchase-order/purchase-order.dal";

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
      }
    });

    updateTag("purchaseOrders");

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
      // Update purchase order
      await tx
        .update(purchaseOrder)
        .set({
          orderNumber: input.orderNumber,
          supplierId: input.supplierId,
          orderDate: orderDateValue,
          receptionDate: receptionDateValue,
          status: (input.status as "pending" | "received" | "cancelled") || "pending",
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

