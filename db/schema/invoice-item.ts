import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { invoice } from "./invoice";
import { product } from "./product";

export const invoiceItem = pgTable("invoice_item", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoice.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default(
    "0"
  ),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
  lineSubtotal: numeric("line_subtotal", { precision: 15, scale: 2 }).notNull(),
  lineTax: numeric("line_tax", { precision: 15, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
});

export type InvoiceItem = typeof invoiceItem.$inferSelect;
export type NewInvoiceItem = typeof invoiceItem.$inferInsert;

export default invoiceItem;

