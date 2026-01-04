import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { type UnitOfMeasure } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<UnitOfMeasure>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  symbol: parseAsString.withDefault(""),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  isActive: parseAsArrayOf(parseAsStringEnum(["true", "false"])).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetUnitsOfMeasureSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;

