import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { deliveryNoteCancellation } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<typeof deliveryNoteCancellation.$inferSelect>().withDefault([
    { id: "cancellationDate", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  cancellationNumber: parseAsString.withDefault(""),
  cancellationDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetDeliveryNoteCancellationsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;

