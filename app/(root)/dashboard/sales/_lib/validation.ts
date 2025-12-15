import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { flagConfig } from "@/config/flag";
import { type DeliveryNote } from "@/db/schema";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value),
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<DeliveryNote>().withDefault([
    { id: "noteDate", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  noteNumber: parseAsString.withDefault(""),
  noteType: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  clientId: parseAsArrayOf(parseAsString).withDefault([]),
  noteDate: parseAsArrayOf(parseAsInteger).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetDeliveryNotesSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;


