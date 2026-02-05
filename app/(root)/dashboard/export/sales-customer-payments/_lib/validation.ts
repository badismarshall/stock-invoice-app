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
    { id: "date", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  startDate: parseAsString.withDefault(""),
  endDate: parseAsString.withDefault(""),
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  paymentMethod: parseAsArrayOf(parseAsString).withDefault([]),
  // Basic toolbar filters
  date: parseAsArrayOf(parseAsInteger).withDefault([]),
  invoiceNumber: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetSalesCustomerPaymentsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
> & {
  startDate?: string;
  endDate?: string;
};


