import { pgTable, text, boolean, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { category } from "./category";

export const product = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    unitOfMeasure: text("unit_of_measure").notNull(),
    purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    salePriceLocal: numeric("sale_price_local", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    salePriceExport: numeric("sale_price_export", { precision: 15, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_products_category").on(table.categoryId),
    activeIdx: index("idx_products_active").on(table.isActive),
  })
);

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;

export default product;

