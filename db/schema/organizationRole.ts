import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./organization";

export const organizationRole = pgTable("organization_role", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  permission: text("permission").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(
    () => /* @__PURE__ */ new Date(),
  ),
});

export type OrganizationRole = typeof organizationRole.$inferSelect;
export type NewOrganizationRole = typeof organizationRole.$inferInsert;

export default organizationRole;

