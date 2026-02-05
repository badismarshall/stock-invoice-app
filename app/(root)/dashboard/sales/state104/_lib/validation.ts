import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<any>().withDefault([{ id: "clientName", desc: false }]),
  // basic toolbar filters (same pattern as /sales delivery-notes)
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  date: parseAsArrayOf(parseAsInteger).withDefault([]),
  address: parseAsString.withDefault(""),
  nif: parseAsString.withDefault(""),
  rcs: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetState104Schema = Awaited<ReturnType<typeof searchParamsCache.parse>>;

