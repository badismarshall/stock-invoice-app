import type { SearchParams } from "@/types"
import { CategoryTableWrapper } from "./data-table/category-table-wrapper"
import { CategoryPrimaryButtons } from "./category-primary-buttons"

interface CategoryContentProps {
  searchParams: Promise<SearchParams>;
}

export async function CategoryContent({ searchParams }: CategoryContentProps) {
  return (
    <div className="space-y-4">

      <CategoryTableWrapper searchParams={searchParams} />
    </div>
  )
}

