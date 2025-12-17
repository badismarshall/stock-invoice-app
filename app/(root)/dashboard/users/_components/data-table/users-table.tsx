"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/shared/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/shared/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/shared/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import type { DataTableRowAction, QueryKeys } from "@/types/data-table";
import type { UserDTOItem } from "@/data/user/user.dto";
import type {
  getUserRoleCounts,
  getUserBannedCounts,
  getUserEmailVerifiedCounts,
  getUsers,
} from "../../_lib/queries";

import { DeleteUsersDialog } from "./delete-users-dialog";
import { useFeatureFlags } from "../../../_components/feature-flags-provider";
import { UsersTableActionBar } from "./users-table-action-bar";
import { getUsersTableColumns } from "./users-table-columns";
import { ModifyUserDialog } from "../modify-user-dialog";

interface UsersTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getUsers>>,
      Awaited<ReturnType<typeof getUserRoleCounts>>,
      Awaited<ReturnType<typeof getUserBannedCounts>>,
      Awaited<ReturnType<typeof getUserEmailVerifiedCounts>>,
    ]
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function UsersTable({ promises, queryKeys }: UsersTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const [
    { data, pageCount },
    roleCounts,
    bannedCounts,
    emailVerifiedCounts,
  ] = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<UserDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getUsersTableColumns({
        roleCounts,
        bannedCounts,
        emailVerifiedCounts,
        setRowAction,
      }),
    [roleCounts, bannedCounts, emailVerifiedCounts],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={<UsersTableActionBar table={table} />}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
      <ModifyUserDialog
        userId={rowAction?.row.original.id || ""}
        open={rowAction?.variant === "update"}
        onOpenChange={(open) => !open && setRowAction(null)}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
      <DeleteUsersDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        users={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}