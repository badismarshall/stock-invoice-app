import type { SearchParams } from "@/types"
import { UnitOfMeasureTableWrapper } from "./data-table/unit-of-measure-table-wrapper"
import { UnitOfMeasurePrimaryButtons } from "./unit-of-measure-primary-buttons"

interface UnitOfMeasureContentProps {
  searchParams: Promise<SearchParams>;
}

export async function UnitOfMeasureContent({ searchParams }: UnitOfMeasureContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Unités de mesure</h2>
          <p className="text-muted-foreground">
            Gérez vos unités de mesure
          </p>
        </div>
        <UnitOfMeasurePrimaryButtons />
      </div>
      <UnitOfMeasureTableWrapper searchParams={searchParams} />
    </div>
  )
}

