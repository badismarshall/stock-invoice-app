import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { type Invoice } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Invoice>().withDefault([
    { id: "invoiceDate", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  invoiceNumber: parseAsString.withDefault(""),
  invoiceType: parseAsArrayOf(parseAsString).withDefault([]),
  paymentStatus: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  supplierId: parseAsArrayOf(parseAsString).withDefault([]),
  invoiceDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  dueDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetInvoicesSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;

