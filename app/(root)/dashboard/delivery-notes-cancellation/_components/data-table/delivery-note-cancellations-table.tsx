"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/shared/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/shared/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/shared/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import type { DeliveryNoteCancellationDTOItem } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dto";
import type { getDeliveryNoteCancellations } from "../../_lib/queries";
import { getDeliveryNoteCancellationsTableColumns } from "./delivery-note-cancellations-table-columns";
import { useFeatureFlags } from "@/app/(root)/dashboard/_components/feature-flags-provider";

interface DeliveryNoteCancellationsTableProps {
  promises: Promise<
    Awaited<ReturnType<typeof getDeliveryNoteCancellations>>
  >;
  clients?: Array<{ id: string; name: string }>;
  queryKeys?: Partial<QueryKeys>;
}

export function DeliveryNoteCancellationsTable({ promises, clients = [], queryKeys }: DeliveryNoteCancellationsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, pageCount } = React.use(promises);

  const columns = React.useMemo(
    () =>
      getDeliveryNoteCancellationsTableColumns({ clients }),
    [clients],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "cancellationDate", desc: true }],
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
    </>
  );
}

