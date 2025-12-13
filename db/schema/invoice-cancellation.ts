import { pgTable, text, timestamp, date } from "drizzle-orm/pg-core";
import { invoice } from "./invoice";
import { user } from "./user";

export const invoiceCancellation = pgTable("invoice_cancellation", {
  id: text("id").primaryKey(),
  cancellationNumber: text("cancellation_number").notNull().unique(),
  originalInvoiceId: text("original_invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "restrict" }),
  cancellationDate: date("cancellation_date").notNull(),
  reason: text("reason"),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InvoiceCancellation = typeof invoiceCancellation.$inferSelect;
export type NewInvoiceCancellation = typeof invoiceCancellation.$inferInsert;

export default invoiceCancellation;

