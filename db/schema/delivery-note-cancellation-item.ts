import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { deliveryNoteCancellation } from "./delivery-note-cancellation";
import { deliveryNoteItem } from "./delivery-note-item";

export const deliveryNoteCancellationItem = pgTable("delivery_note_cancellation_item", {
  id: text("id").primaryKey(),
  deliveryNoteCancellationId: text("delivery_note_cancellation_id")
    .notNull()
    .references(() => deliveryNoteCancellation.id, { onDelete: "cascade" }),
  deliveryNoteItemId: text("delivery_note_item_id")
    .notNull()
    .references(() => deliveryNoteItem.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default(
    "0"
  ),
  lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
});

export type DeliveryNoteCancellationItem =
  typeof deliveryNoteCancellationItem.$inferSelect;
export type NewDeliveryNoteCancellationItem =
  typeof deliveryNoteCancellationItem.$inferInsert;

export default deliveryNoteCancellationItem;

