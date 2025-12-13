import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { deliveryNote } from "./delivery-note";
import { product } from "./product";

export const deliveryNoteItem = pgTable("delivery_note_item", {
  id: text("id").primaryKey(),
  deliveryNoteId: text("delivery_note_id")
    .notNull()
    .references(() => deliveryNote.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default(
    "0"
  ),
  lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
});

export type DeliveryNoteItem = typeof deliveryNoteItem.$inferSelect;
export type NewDeliveryNoteItem = typeof deliveryNoteItem.$inferInsert;

export default deliveryNoteItem;

