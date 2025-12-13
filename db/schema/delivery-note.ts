import { pgTable, text, timestamp, date, index } from "drizzle-orm/pg-core";
import { partner } from "./partner";
import { user } from "./user";
import { noteTypeEnum, statusEnum } from "./enums";

export const deliveryNote = pgTable(
  "delivery_note",
  {
    id: text("id").primaryKey(),
    noteNumber: text("note_number").notNull().unique(),
    noteType: noteTypeEnum("note_type").notNull(),
    clientId: text("client_id").references(() => partner.id, {
      onDelete: "set null",
    }),
    noteDate: date("note_date").notNull(),
    status: statusEnum("status").default("active"),
    currency: text("currency").default("DZD"),
    destinationCountry: text("destination_country"),
    deliveryLocation: text("delivery_location"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    clientIdx: index("idx_delivery_notes_client").on(table.clientId),
  })
);

export type DeliveryNote = typeof deliveryNote.$inferSelect;
export type NewDeliveryNote = typeof deliveryNote.$inferInsert;

export default deliveryNote;

