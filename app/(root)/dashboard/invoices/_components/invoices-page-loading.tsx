import { Skeleton } from "@/components/ui/skeleton"
import { DataTableSkeleton } from "@/components/shared/data-table/data-table-skeleton"

export function InvoicesPageLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      
      {/* Metrics Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <DataTableSkeleton
          columnCount={10}
          filterCount={2}
          cellWidths={[
            "10rem",
            "15rem",
            "12rem",
            "12rem",
            "10rem",
            "12rem",
            "12rem",
            "10rem",
            "12rem",
            "6rem",
          ]}
          shrinkZero
        />
      </div>
    </div>
  );
}

