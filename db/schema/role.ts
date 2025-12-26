import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const role = pgTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // Technical name (e.g., "admin", "purchases_manager")
  label: text("label").notNull(), // Display name (e.g., "Administrateur", "Gestionnaire Achats")
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;

export default role;

