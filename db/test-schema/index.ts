// ============================================
// DRIZZLE ORM SCHEMA - SIROF (PostgreSQL)
// Gestion de Stock et Facturation
// ============================================

import { pgTable, serial, varchar, text, numeric, boolean, timestamp, pgEnum, date, uniqueIndex, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'comptable', 'magasinier', 'commercial']);
export const moduleNameEnum = pgEnum('module_name', ['stock', 'facturation', 'recouvrement', 'produits', 'clients', 'fournisseurs', 'reporting']);
export const noteTypeEnum = pgEnum('note_type', ['local', 'export']);
export const statusEnum = pgEnum('status', ['active', 'cancelled']);
export const invoiceTypeEnum = pgEnum('invoice_type', ['sale_local', 'sale_export', 'proforma', 'purchase']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partially_paid', 'paid']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'check', 'transfer', 'other']);
export const movementTypeEnum = pgEnum('movement_type', ['in', 'out', 'adjustment']);
export const movementSourceEnum = pgEnum('movement_source', ['purchase', 'sale_local', 'sale_export', 'delivery_note', 'adjustment', 'return']);
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['pending', 'received', 'cancelled']);

// ============================================
// TABLES - USERS & PERMISSIONS
// ============================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 200 }),
  role: userRoleEnum('role').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleName: moduleNameEnum('module_name').notNull(),
  canRead: boolean('can_read').default(true),
  canCreate: boolean('can_create').default(false),
  canUpdate: boolean('can_update').default(false),
  canDelete: boolean('can_delete').default(false),
}, (table) => ({
  uniqueUserModule: uniqueIndex('unique_user_module').on(table.userId, table.moduleName),
}));

// ============================================
// TABLES - PRODUCTS & CATEGORIES
// ============================================

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }).notNull(),
  purchasePrice: numeric('purchase_price', { precision: 15, scale: 2 }).notNull().default('0'),
  salePriceLocal: numeric('sale_price_local', { precision: 15, scale: 2 }).notNull().default('0'),
  salePriceExport: numeric('sale_price_export', { precision: 15, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_products_category').on(table.categoryId),
  activeIdx: index('idx_products_active').on(table.isActive),
}));

// ============================================
// TABLES - CLIENTS & SUPPLIERS
// ============================================

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  contactName: varchar('contact_name', { length: 150 }),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 150 }),
  nif: varchar('nif', { length: 50 }),
  rc: varchar('rc', { length: 50 }),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique(),
  companyName: varchar('company_name', { length: 200 }).notNull(),
  contactName: varchar('contact_name', { length: 150 }),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 150 }),
  nif: varchar('nif', { length: 50 }),
  rc: varchar('rc', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// TABLES - DELIVERY NOTES
// ============================================

export const deliveryNotes = pgTable('delivery_notes', {
  id: serial('id').primaryKey(),
  noteNumber: varchar('note_number', { length: 50 }).notNull().unique(),
  noteType: noteTypeEnum('note_type').notNull(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  noteDate: date('note_date').notNull(),
  status: statusEnum('status').default('active'),
  currency: varchar('currency', { length: 10 }).default('DZD'),
  destinationCountry: varchar('destination_country', { length: 100 }),
  deliveryLocation: varchar('delivery_location', { length: 255 }),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdx: index('idx_delivery_notes_client').on(table.clientId),
}));

export const deliveryNoteItems = pgTable('delivery_note_items', {
  id: serial('id').primaryKey(),
  deliveryNoteId: integer('delivery_note_id').notNull().references(() => deliveryNotes.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(),
});

export const deliveryNoteCancellations = pgTable('delivery_note_cancellations', {
  id: serial('id').primaryKey(),
  cancellationNumber: varchar('cancellation_number', { length: 50 }).notNull().unique(),
  originalDeliveryNoteId: integer('original_delivery_note_id').notNull().references(() => deliveryNotes.id, { onDelete: 'restrict' }),
  cancellationDate: date('cancellation_date').notNull(),
  reason: text('reason'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// TABLES - INVOICES
// ============================================

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  deliveryNoteId: integer('delivery_note_id').references(() => deliveryNotes.id, { onDelete: 'restrict' }),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date'),
  currency: varchar('currency', { length: 10 }).default('DZD'),
  destinationCountry: varchar('destination_country', { length: 100 }),
  deliveryLocation: varchar('delivery_location', { length: 255 }),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid'),
  status: statusEnum('status').default('active'),
  paymentMethod: paymentMethodEnum('payment_method'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdx: index('idx_invoices_client').on(table.clientId),
  supplierIdx: index('idx_invoices_supplier').on(table.supplierId),
  dateIdx: index('idx_invoices_date').on(table.invoiceDate),
  statusIdx: index('idx_invoices_status').on(table.paymentStatus, table.status),
}));

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
  lineSubtotal: numeric('line_subtotal', { precision: 15, scale: 2 }).notNull(),
  lineTax: numeric('line_tax', { precision: 15, scale: 2 }).notNull(),
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(),
});

export const invoiceCancellations = pgTable('invoice_cancellations', {
  id: serial('id').primaryKey(),
  cancellationNumber: varchar('cancellation_number', { length: 50 }).notNull().unique(),
  originalInvoiceId: integer('original_invoice_id').notNull().references(() => invoices.id, { onDelete: 'restrict' }),
  cancellationDate: date('cancellation_date').notNull(),
  reason: text('reason'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// TABLES - PAYMENTS
// ============================================

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  paymentNumber: varchar('payment_number', { length: 50 }).notNull().unique(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'restrict' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
  paymentDate: date('payment_date').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  reference: varchar('reference', { length: 100 }),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index('idx_payments_invoice').on(table.invoiceId),
  clientIdx: index('idx_payments_client').on(table.clientId),
  dateIdx: index('idx_payments_date').on(table.paymentDate),
}));

// ============================================
// TABLES - STOCK MANAGEMENT
// ============================================

export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  movementType: movementTypeEnum('movement_type').notNull(),
  movementSource: movementSourceEnum('movement_source').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: integer('reference_id'),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 2 }),
  movementDate: date('movement_date').notNull(),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productDateIdx: index('idx_product_date').on(table.productId, table.movementDate),
  referenceIdx: index('idx_reference').on(table.referenceType, table.referenceId),
}));

export const stockCurrent = pgTable('stock_current', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  quantityAvailable: numeric('quantity_available', { precision: 15, scale: 3 }).notNull().default('0'),
  averageCost: numeric('average_cost', { precision: 15, scale: 2 }).default('0'),
  lastMovementDate: date('last_movement_date'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// ============================================
// TABLES - PURCHASE ORDERS
// ============================================

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  orderDate: date('order_date').notNull(),
  receptionDate: date('reception_date'),
  status: purchaseOrderStatusEnum('status').default('pending'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 2 }).notNull(),
  lineTotal: numeric('line_total', { precision: 15, scale: 2 }).notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(permissions),
  createdDeliveryNotes: many(deliveryNotes),
  createdInvoices: many(invoices),
  createdPayments: many(payments),
  createdStockMovements: many(stockMovements),
  createdPurchaseOrders: many(purchaseOrders),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  deliveryNoteItems: many(deliveryNoteItems),
  invoiceItems: many(invoiceItems),
  stockMovements: many(stockMovements),
  stockCurrent: one(stockCurrent, {
    fields: [products.id],
    references: [stockCurrent.productId],
  }),
  purchaseOrderItems: many(purchaseOrderItems),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  deliveryNotes: many(deliveryNotes),
  invoices: many(invoices),
  payments: many(payments),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  invoices: many(invoices),
  purchaseOrders: many(purchaseOrders),
}));

export const deliveryNotesRelations = relations(deliveryNotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [deliveryNotes.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [deliveryNotes.createdBy],
    references: [users.id],
  }),
  items: many(deliveryNoteItems),
  invoices: many(invoices),
  cancellations: many(deliveryNoteCancellations),
}));

export const deliveryNoteItemsRelations = relations(deliveryNoteItems, ({ one }) => ({
  deliveryNote: one(deliveryNotes, {
    fields: [deliveryNoteItems.deliveryNoteId],
    references: [deliveryNotes.id],
  }),
  product: one(products, {
    fields: [deliveryNoteItems.productId],
    references: [products.id],
  }),
}));

export const deliveryNoteCancellationsRelations = relations(deliveryNoteCancellations, ({ one }) => ({
  originalDeliveryNote: one(deliveryNotes, {
    fields: [deliveryNoteCancellations.originalDeliveryNoteId],
    references: [deliveryNotes.id],
  }),
  createdBy: one(users, {
    fields: [deliveryNoteCancellations.createdBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  supplier: one(suppliers, {
    fields: [invoices.supplierId],
    references: [suppliers.id],
  }),
  deliveryNote: one(deliveryNotes, {
    fields: [invoices.deliveryNoteId],
    references: [deliveryNotes.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  cancellations: many(invoiceCancellations),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const invoiceCancellationsRelations = relations(invoiceCancellations, ({ one }) => ({
  originalInvoice: one(invoices, {
    fields: [invoiceCancellations.originalInvoiceId],
    references: [invoices.id],
  }),
  createdBy: one(users, {
    fields: [invoiceCancellations.createdBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  createdBy: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
  }),
}));

export const stockCurrentRelations = relations(stockCurrent, ({ one }) => ({
  product: one(products, {
    fields: [stockCurrent.productId],
    references: [products.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  createdBy: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));