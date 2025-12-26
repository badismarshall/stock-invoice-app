"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import type { DataTableRowAction, QueryKeys } from "@/types/data-table";
import { getRolesTableColumns, type RoleDTOItem } from "./roles-table-columns";
import { ModifyRoleDialog } from "../modify-role-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";
import type { getRolesQuery } from "../../_lib/queries";

interface RolesTableProps {
  promises: Promise<Awaited<ReturnType<typeof getRolesQuery>>>;
  queryKeys?: Partial<QueryKeys>;
}

export function RolesTable({ promises, queryKeys }: RolesTableProps) {
  const { data, pageCount } = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<RoleDTOItem> | null>(null);

  const columns = React.useMemo(
    () => getRolesTableColumns({ setRowAction }),
    [setRowAction]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data || [],
    columns,
    pageCount: pageCount || 0,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>
      {rowAction?.variant === "update" && (
        <ModifyRoleDialog
          open={rowAction.variant === "update"}
          onOpenChange={(open) => !open && setRowAction(null)}
          role={rowAction.row.original}
        />
      )}
      {rowAction?.variant === "delete" && (
        <DeleteRoleDialog
          open={rowAction.variant === "delete"}
          onOpenChange={(open) => !open && setRowAction(null)}
          role={rowAction.row.original}
        />
      )}
    </>
  );
}

