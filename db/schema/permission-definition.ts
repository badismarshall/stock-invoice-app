import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const permissionDefinition = pgTable("permission_definition", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // Permission name (e.g., "purchases.read", "sales.export")
  description: text("description"),
  category: text("category"), // Category for grouping (e.g., "purchases", "sales", "settings")
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type PermissionDefinition = typeof permissionDefinition.$inferSelect;
export type NewPermissionDefinition = typeof permissionDefinition.$inferInsert;

export default permissionDefinition;

