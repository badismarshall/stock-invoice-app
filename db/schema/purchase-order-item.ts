import { pgTable, text, numeric } from "drizzle-orm/pg-core";
import { purchaseOrder } from "./purchase-order";
import { product } from "./product";

export const purchaseOrderItem = pgTable("purchase_order_item", {
  id: text("id").primaryKey(),
  purchaseOrderId: text("purchase_order_id")
    .notNull()
    .references(() => purchaseOrder.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 15, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItem.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItem.$inferInsert;

export default purchaseOrderItem;

