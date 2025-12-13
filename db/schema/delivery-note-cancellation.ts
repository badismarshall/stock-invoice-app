import { pgTable, text, timestamp, date } from "drizzle-orm/pg-core";
import { deliveryNote } from "./delivery-note";
import { user } from "./user";

export const deliveryNoteCancellation = pgTable("delivery_note_cancellation", {
  id: text("id").primaryKey(),
  cancellationNumber: text("cancellation_number").notNull().unique(),
  originalDeliveryNoteId: text("original_delivery_note_id")
    .notNull()
    .references(() => deliveryNote.id, { onDelete: "restrict" }),
  cancellationDate: date("cancellation_date").notNull(),
  reason: text("reason"),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DeliveryNoteCancellation =
  typeof deliveryNoteCancellation.$inferSelect;
export type NewDeliveryNoteCancellation =
  typeof deliveryNoteCancellation.$inferInsert;

export default deliveryNoteCancellation;

