import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { user } from "./user";

export const backup = pgTable("backup", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: numeric("file_size", { precision: 15, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
});

export type Backup = typeof backup.$inferSelect;
export type NewBackup = typeof backup.$inferInsert;

export default backup;

