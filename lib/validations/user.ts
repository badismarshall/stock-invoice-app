import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
    parseAsBoolean,
  } from "nuqs/server";
  import { flagConfig } from "@/config/flag";
  import { type User } from "@/db/schema";
  import { getFiltersStateParser, getSortingStateParser } from "@/lib/data-table/parsers";
  
  export const searchParamsCache = createSearchParamsCache({
    filterFlag: parseAsStringEnum(
      flagConfig.featureFlags.map((flag) => flag.value),
    ),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<User>().withDefault([
      { id: "createdAt", desc: true },
    ]),
    name: parseAsString.withDefault(""),
    email: parseAsString.withDefault(""),
    emailVerified: parseAsArrayOf(parseAsBoolean).withDefault([]),
    role: parseAsArrayOf(parseAsString).withDefault([]),
    banned: parseAsArrayOf(parseAsBoolean).withDefault([]),
    createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
    // advanced filter
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  });
  
  export type GetUsersSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
  >;
