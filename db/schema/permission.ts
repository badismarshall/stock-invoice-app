import { pgTable, text, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./user";
import { moduleNameEnum } from "./enums";

export const permission = pgTable(
  "permission",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    moduleName: moduleNameEnum("module_name").notNull(),
    canRead: boolean("can_read").default(true),
    canCreate: boolean("can_create").default(false),
    canUpdate: boolean("can_update").default(false),
    canDelete: boolean("can_delete").default(false),
  },
  (table) => ({
    uniqueUserModule: uniqueIndex("unique_user_module").on(
      table.userId,
      table.moduleName
    ),
  })
);

export type Permission = typeof permission.$inferSelect;
export type NewPermission = typeof permission.$inferInsert;

export default permission;

