import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsBoolean,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { type StockCurrent } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

// Movement types
const movementTypes = ["in", "out", "adjustment"] as const;
const movementSources = ["purchase", "sale_local", "sale_export", "delivery_note", "adjustment", "return"] as const;

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<StockCurrent>().withDefault([
    { id: "lastUpdated", desc: true },
  ]),
  // Stock Current specific
  search: parseAsString.withDefault(""),
  productCode: parseAsString.withDefault(""),
  productName: parseAsString.withDefault(""),
  categoryId: parseAsArrayOf(parseAsString).withDefault([]),
  categoryName: parseAsArrayOf(parseAsString).withDefault([]), // For simple toolbar filter
  quantityAvailable: parseAsString.withDefault(""),
  stockValue: parseAsString.withDefault(""),
  lastMovementDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  lastUpdated: parseAsArrayOf(parseAsInteger).withDefault([]),
  lowStock: parseAsArrayOf(parseAsBoolean).withDefault([]),
  // Stock Movements specific
  movementType: parseAsArrayOf(parseAsStringEnum([...movementTypes])).withDefault([]),
  movementSource: parseAsArrayOf(parseAsStringEnum([...movementSources])).withDefault([]),
  movementDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetStockCurrentSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;

export type GetStockMovementsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;

