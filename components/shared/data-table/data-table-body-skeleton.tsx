import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableBodySkeletonProps {
  columnCount: number;
  rowCount?: number;
  cellWidths?: string[];
  shrinkZero?: boolean;
}

export function DataTableBodySkeleton({
  columnCount,
  rowCount = 10,
  cellWidths = ["auto"],
  shrinkZero = false,
}: DataTableBodySkeletonProps) {
  const cozyCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? "auto",
  );

  return (
    <TableBody>
      {Array.from({ length: rowCount }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell
              key={j}
              style={{
                width: cozyCellWidths[j],
                minWidth: shrinkZero ? cozyCellWidths[j] : "auto",
              }}
            >
              <Skeleton className="h-6 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

