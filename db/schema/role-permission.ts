import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { role } from "./role";
import { permissionDefinition } from "./permission-definition";

export const rolePermission = pgTable(
  "role_permission",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissionDefinition.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueRolePermission: uniqueIndex("unique_role_permission").on(
      table.roleId,
      table.permissionId
    ),
  })
);

export type RolePermission = typeof rolePermission.$inferSelect;
export type NewRolePermission = typeof rolePermission.$inferInsert;

export default rolePermission;

