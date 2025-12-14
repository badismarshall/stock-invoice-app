import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const partner = pgTable("partner", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Nom / Raison Sociale
  contact: text("contact"), // Old contact field, kept for potential backward compatibility
  phone: text("phone"), // Téléphone
  email: text("email"), // Email
  address: text("address"), // Adresse
  credit: numeric("credit", { precision: 10, scale: 2 }).default("0"), // Crédit
  nif: text("nif"), // Numéro d'Identification Fiscale
  rc: text("rc"), // Registre de Commerce
  type: text("type").notNull(), // "client" or "fournisseur"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Partner = typeof partner.$inferSelect;
export type NewPartner = typeof partner.$inferInsert;

export default partner;
