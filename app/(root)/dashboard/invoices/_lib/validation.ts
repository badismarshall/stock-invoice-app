import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsIsoDateTime,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { type Invoice } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";
import { z } from "zod";

// Invoice types
const invoiceTypes = ["sale_local", "sale_export", "proforma", "purchase"] as const;
const paymentStatuses = ["unpaid", "partially_paid", "paid"] as const;
const statuses = ["active", "cancelled"] as const;

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Invoice>().withDefault([
    { id: "invoiceDate", desc: true },
  ]),
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),

  // Invoice specific
  invoiceNumber: parseAsString.withDefault(""),
  invoiceType: parseAsArrayOf(parseAsStringEnum([...invoiceTypes])).withDefault([]),
  paymentStatus: parseAsArrayOf(parseAsStringEnum([...paymentStatuses])).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum([...statuses])).withDefault([]),
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  supplierId: parseAsArrayOf(parseAsString).withDefault([]),
  invoiceDate: parseAsArrayOf(parseAsIsoDateTime).withDefault([]),
  dueDate: parseAsArrayOf(parseAsIsoDateTime).withDefault([]),
  createdAt: parseAsArrayOf(parseAsIsoDateTime).withDefault([]),
});

// Zod schema for DAL compatibility
export const GetInvoicesSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  sort: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  filters: z.array(z.object({ id: z.string(), value: z.union([z.string(), z.array(z.string())]) })).default([]),
  filterFlag: z.enum(["advancedFilters", "commandFilters"]).optional(),
  joinOperator: z.enum(["and", "or"]).default("and"),
  invoiceNumber: z.string().default(""),
  invoiceType: z.array(z.enum(invoiceTypes)).default([]),
  paymentStatus: z.array(z.enum(paymentStatuses)).default([]),
  status: z.array(z.enum(statuses)).default([]),
  clientId: z.array(z.string()).default([]),
  supplierId: z.array(z.string()).default([]),
  invoiceDate: z.array(z.date()).default([]),
  dueDate: z.array(z.date()).default([]),
  createdAt: z.array(z.date()).default([]),
});

