import { pgTable, text, timestamp, date, numeric, index } from "drizzle-orm/pg-core";
import { invoice } from "./invoice";
import { partner } from "./partner";
import { user } from "./user";
import { paymentMethodEnum } from "./enums";

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    paymentNumber: text("payment_number").notNull().unique(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .notNull()
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
    dateIdx: index("idx_payments_date").on(table.paymentDate),
  })
);

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export default payment;

