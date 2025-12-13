import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
  } from "nuqs/server";
  import { flagConfig } from "@/config/flag";
  import { type Partner } from "@/db/schema";
  import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";
  
  export const searchParamsCache = createSearchParamsCache({
    filterFlag: parseAsStringEnum(
      flagConfig.featureFlags.map((flag) => flag.value),
    ),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<Partner>().withDefault([
      { id: "createdAt", desc: true },
    ]),
    name: parseAsString.withDefault(""),
    contact: parseAsString.withDefault(""),
    phone: parseAsString.withDefault(""),
    email: parseAsString.withDefault(""),
    address: parseAsString.withDefault(""),
    credit: parseAsString.withDefault(""),
    nif: parseAsString.withDefault(""),
    rc: parseAsString.withDefault(""),
    createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
    // advanced filter
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  });
  
  export type GetPartnersSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
  >;

