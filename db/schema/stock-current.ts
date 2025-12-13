import { pgTable, text, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { product } from "./product";

export const stockCurrent = pgTable("stock_current", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .unique()
    .references(() => product.id, { onDelete: "cascade" }),
  quantityAvailable: numeric("quantity_available", {
    precision: 15,
    scale: 3,
  })
    .notNull()
    .default("0"),
  averageCost: numeric("average_cost", { precision: 15, scale: 2 }).default(
    "0"
  ),
  lastMovementDate: date("last_movement_date"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export type StockCurrent = typeof stockCurrent.$inferSelect;
export type NewStockCurrent = typeof stockCurrent.$inferInsert;

export default stockCurrent;

