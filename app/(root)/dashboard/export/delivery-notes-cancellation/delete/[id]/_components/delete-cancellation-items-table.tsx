"use client";

import * as React from "react";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableToolbar } from "@/components/shared/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/shared/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/data-table/use-data-table";
import { getDeleteCancellationItemsTableColumns } from "./delete-cancellation-items-table-columns";
import { DeleteCancellationItemsActionBar } from "./delete-cancellation-items-action-bar";
import { getCancellationItemsForDelete } from "../../../_lib/actions";
import { toast } from "sonner";

interface CancellationItem {
  id: string;
  productId: string;
  productName: string | null;
  productCode: string | null;
  noteNumber: string;
  cancelledQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DeleteCancellationItemsTableProps {
  items: CancellationItem[];
  cancellationId: string;
  onDeleteItem: (item: CancellationItem) => void;
  onDeleteItems: (itemIds: string[]) => Promise<void>;
  onDeleteAll: () => void;
  isDeleting: boolean;
  onItemsChange: (items: CancellationItem[]) => void;
  onRedirect: () => void;
}

export function DeleteCancellationItemsTable({
  items,
  cancellationId,
  onDeleteItem,
  onDeleteItems,
  onDeleteAll,
  isDeleting,
  onItemsChange,
  onRedirect,
}: DeleteCancellationItemsTableProps) {
  const columns = React.useMemo(
    () =>
      getDeleteCancellationItemsTableColumns({
        onDeleteItem,
        isDeleting,
      }),
    [onDeleteItem, isDeleting],
  );

  const handleDeleteItems = React.useCallback(
    async (itemIds: string[]) => {
      await onDeleteItems(itemIds);
    },
    [onDeleteItems],
  );

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount: 1,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "noteNumber", desc: false }],
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={
          <DeleteCancellationItemsActionBar
            table={table}
            cancellationId={cancellationId}
            onDeleteItems={handleDeleteItems}
            onDeleteAll={onDeleteAll}
            isDeleting={isDeleting}
          />
        }
      >
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>
    </>
  );
}

