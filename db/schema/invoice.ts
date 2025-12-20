import { pgTable, text, timestamp, date, numeric, index } from "drizzle-orm/pg-core";
import { partner } from "./partner";
import { deliveryNote } from "./delivery-note";
import { purchaseOrder } from "./purchase-order";
import { user } from "./user";
import {
  invoiceTypeEnum,
  paymentStatusEnum,
  statusEnum,
  paymentMethodEnum,
} from "./enums";

export const invoice = pgTable(
  "invoice",
  {
    id: text("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    invoiceType: invoiceTypeEnum("invoice_type").notNull(),
    clientId: text("client_id").references(() => partner.id, {
      onDelete: "set null",
    }),
    supplierId: text("supplier_id").references(() => partner.id, {
      onDelete: "set null",
    }),
    deliveryNoteId: text("delivery_note_id").references(() => deliveryNote.id, {
      onDelete: "restrict",
    }),
    purchaseOrderId: text("purchase_order_id").references(() => purchaseOrder.id, {
      onDelete: "restrict",
    }),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    currency: text("currency").default("DZD"),
    destinationCountry: text("destination_country"),
    deliveryLocation: text("delivery_location"),
    supplierOrderNumber: text("supplier_order_number"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    paymentStatus: paymentStatusEnum("payment_status").default("unpaid"),
    status: statusEnum("status").default("active"),
    paymentMethod: paymentMethodEnum("payment_method"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    clientIdx: index("idx_invoices_client").on(table.clientId),
    supplierIdx: index("idx_invoices_supplier").on(table.supplierId),
    purchaseOrderIdx: index("idx_invoices_purchase_order").on(table.purchaseOrderId),
    dateIdx: index("idx_invoices_date").on(table.invoiceDate),
    statusIdx: index("idx_invoices_status").on(table.paymentStatus, table.status),
  })
);

export type Invoice = typeof invoice.$inferSelect;
export type NewInvoice = typeof invoice.$inferInsert;

export default invoice;

