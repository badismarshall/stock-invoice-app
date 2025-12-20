import { pgTable, text, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { partner } from "./partner";
import { user } from "./user";
import { purchaseOrderStatusEnum } from "./enums";

export const purchaseOrder = pgTable("purchase_order", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => partner.id, { onDelete: "restrict" }),
  orderDate: date("order_date").notNull(),
  receptionDate: date("reception_date"),
  status: purchaseOrderStatusEnum("status").default("pending"),
  supplierOrderNumber: text("supplier_order_number"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type PurchaseOrder = typeof purchaseOrder.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrder.$inferInsert;

export default purchaseOrder;

