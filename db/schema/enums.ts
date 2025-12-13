import { pgEnum } from 'drizzle-orm/pg-core';

// User roles for the stock and invoice management system
export const userRoleEnum = pgEnum('user_role', ['admin', 'comptable', 'magasinier', 'commercial']);

// Module names for permissions
export const moduleNameEnum = pgEnum('module_name', ['stock', 'facturation', 'recouvrement', 'produits', 'clients', 'fournisseurs', 'reporting']);

// Delivery note types
export const noteTypeEnum = pgEnum('note_type', ['local', 'export']);

// General status enum
export const statusEnum = pgEnum('status', ['active', 'cancelled']);

// Invoice types
export const invoiceTypeEnum = pgEnum('invoice_type', ['sale_local', 'sale_export', 'proforma', 'purchase']);

// Payment status
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partially_paid', 'paid']);

// Payment methods
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'check', 'transfer', 'other']);

// Stock movement types
export const movementTypeEnum = pgEnum('movement_type', ['in', 'out', 'adjustment']);

// Stock movement sources
export const movementSourceEnum = pgEnum('movement_source', ['purchase', 'sale_local', 'sale_export', 'delivery_note', 'adjustment', 'return']);

// Purchase order status
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['pending', 'received', 'cancelled']);

