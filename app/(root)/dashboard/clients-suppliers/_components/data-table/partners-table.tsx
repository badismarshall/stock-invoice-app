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
import type { PartnerDTOItem } from "@/data/partner/partner.dto";
import type { getPartners } from "../../_lib/queries";
import { PartnersTableActionBar } from "./partners-table-action-bar";
import { getPartnersTableColumns } from "./partners-table-columns";
import { useFeatureFlags } from "../../../_components/feature-flags-provider";
import { DeletePartnersDialog } from "./delete-partners-dialog";
import { ModifyPartnerDialog } from "../modify-partner-dialog";

interface PartnersTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getPartners>>
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function PartnersTable({ promises, queryKeys }: PartnersTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, pageCount } = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<PartnerDTOItem> | null>(null);

  const columns = React.useMemo(
    () =>
      getPartnersTableColumns({
        setRowAction,
      }),
    [],
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
        actionBar={<PartnersTableActionBar table={table} />}
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
      <ModifyPartnerDialog
        partnerId={rowAction?.row.original.id || ""}
        open={rowAction?.variant === "update"}
        onOpenChange={(open) => !open && setRowAction(null)}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
      <DeletePartnersDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        partners={rowAction?.row.original ? [rowAction.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          rowAction?.row.toggleSelected(false);
          setRowAction(null);
        }}
      />
    </>
  );
}

