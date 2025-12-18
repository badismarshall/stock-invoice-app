import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { type Payment } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Payment>().withDefault([
    { id: "paymentDate", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  paymentNumber: parseAsString.withDefault(""),
  paymentMethod: parseAsArrayOf(parseAsString).withDefault([]),
  invoiceId: parseAsArrayOf(parseAsString).withDefault([]),
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  supplierId: parseAsArrayOf(parseAsString).withDefault([]),
  paymentDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetPaymentsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;

