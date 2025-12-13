import { pgTable, text, timestamp, date, numeric, index } from "drizzle-orm/pg-core";
import { product } from "./product";
import { user } from "./user";
import { movementTypeEnum, movementSourceEnum } from "./enums";

export const stockMovement = pgTable(
  "stock_movement",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    movementType: movementTypeEnum("movement_type").notNull(),
    movementSource: movementSourceEnum("movement_source").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 15, scale: 2 }),
    movementDate: date("movement_date").notNull(),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productDateIdx: index("idx_product_date").on(
      table.productId,
      table.movementDate
    ),
    referenceIdx: index("idx_reference").on(
      table.referenceType,
      table.referenceId
    ),
  })
);

export type StockMovement = typeof stockMovement.$inferSelect;
export type NewStockMovement = typeof stockMovement.$inferInsert;

export default stockMovement;

