import type { SearchParams } from "@/types"
import { CategoryTableWrapper } from "./data-table/category-table-wrapper"
import { CategoryPrimaryButtons } from "./category-primary-buttons"

interface CategoryContentProps {
  searchParams: Promise<SearchParams>;
}

export async function CategoryContent({ searchParams }: CategoryContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catégories</h2>
          <p className="text-muted-foreground">
            Gérez vos catégories de produits
          </p>
        </div>
        <CategoryPrimaryButtons />
      </div>
      <CategoryTableWrapper searchParams={searchParams} />
    </div>
  )
}

