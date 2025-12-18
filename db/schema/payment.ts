import { pgTable, text, timestamp, date, numeric, index, check } from "drizzle-orm/pg-core";
import { invoice } from "./invoice";
import { partner } from "./partner";
import { user } from "./user";
import { paymentMethodEnum } from "./enums";
import { sql } from "drizzle-orm";

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    paymentNumber: text("payment_number").notNull().unique(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .references(() => partner.id, { onDelete: "restrict" }),
    supplierId: text("supplier_id")
      .references(() => partner.id, { onDelete: "restrict" }),
    paymentDate: date("payment_date").notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceIdx: index("idx_payments_invoice").on(table.invoiceId),
    clientIdx: index("idx_payments_client").on(table.clientId),
    supplierIdx: index("idx_payments_supplier").on(table.supplierId),
    dateIdx: index("idx_payments_date").on(table.paymentDate),
    // Constraint: at least one of clientId or supplierId must be non-null
    clientOrSupplierCheck: check("client_or_supplier_check", sql`(${table.clientId} IS NOT NULL) OR (${table.supplierId} IS NOT NULL)`),
  })
);

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export default payment;

