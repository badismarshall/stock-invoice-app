import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const unitOfMeasure = pgTable("unit_of_measure", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  symbol: text("symbol").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type UnitOfMeasure = typeof unitOfMeasure.$inferSelect;
export type NewUnitOfMeasure = typeof unitOfMeasure.$inferInsert;

export default unitOfMeasure;

