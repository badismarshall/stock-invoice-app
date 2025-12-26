import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const companySettings = pgTable("company_settings", {
  id: text("id").primaryKey().default("1"), // Single row table
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  nafApe: text("naf_ape"), // Code NAF-APE (activité principale)
  rcsRm: text("rcs_rm"), // Numéro RCS/RM (Registre du Commerce)
  eori: text("eori"), // Numéro EORI (Economic Operators Registration and Identification)
  tvaNumber: text("tva_number"), // Numéro TVA intracommunautaire
  logo: text("logo"), // Path to logo image
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;

export default companySettings;

