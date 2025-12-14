import { cache } from "react";
import { parseAsInteger, parseAsString, parseAsStringEnum, parseAsArrayOf, parseAsIsoDateTime } from "nuqs";
import { createSearchParamsCache } from "nuqs/server";
import { z } from "zod";

// Invoice types
const invoiceTypes = ["sale_local", "sale_export", "proforma", "purchase"] as const;
const paymentStatuses = ["unpaid", "partially_paid", "paid"] as const;
const statuses = ["active", "cancelled"] as const;

export const searchParamsCache = createSearchParamsCache({
  // Common pagination and sorting
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsArrayOf(
    z.object({
      id: z.string(),
      desc: z.boolean(),
    })
  ).withDefault([]),
  filters: parseAsArrayOf(
    z.object({
      id: z.string(),
      value: z.union([z.string(), z.array(z.string())]),
    })
  ).withDefault([]),
  filterFlag: parseAsStringEnum(["advancedFilters", "commandFilters"]).withDefault("advancedFilters"),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),

  // Invoice specific
  invoiceNumber: parseAsString.withDefault(""),
  invoiceType: parseAsArrayOf(parseAsStringEnum(invoiceTypes)).withDefault([]),
  paymentStatus: parseAsArrayOf(parseAsStringEnum(paymentStatuses)).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  supplierId: parseAsArrayOf(parseAsString).withDefault([]),
  invoiceDate: parseAsArrayOf(parseAsIsoDateTime).withLength(2).withDefault([]),
  dueDate: parseAsArrayOf(parseAsIsoDateTime).withLength(2).withDefault([]),
  createdAt: parseAsArrayOf(parseAsIsoDateTime).withLength(2).withDefault([]),
});

export const GetInvoicesSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  sort: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  filters: z.array(z.object({ id: z.string(), value: z.union([z.string(), z.array(z.string())]) })).default([]),
  filterFlag: z.enum(["advancedFilters", "commandFilters"]).default("advancedFilters"),
  joinOperator: z.enum(["and", "or"]).default("and"),
  invoiceNumber: z.string().default(""),
  invoiceType: z.array(z.enum(invoiceTypes)).default([]),
  paymentStatus: z.array(z.enum(paymentStatuses)).default([]),
  status: z.array(z.enum(statuses)).default([]),
  clientId: z.array(z.string()).default([]),
  supplierId: z.array(z.string()).default([]),
  invoiceDate: z.array(z.date()).length(2).default([]),
  dueDate: z.array(z.date()).length(2).default([]),
  createdAt: z.array(z.date()).length(2).default([]),
});

