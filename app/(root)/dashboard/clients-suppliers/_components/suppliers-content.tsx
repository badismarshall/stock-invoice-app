import type { SearchParams } from "@/types"
import { SuppliersTableWrapper } from "./data-table/suppliers-table-wrapper"
import { SuppliersPrimaryButtons } from "./suppliers-primary-buttons"

interface SuppliersContentProps {
  searchParams: Promise<SearchParams>;
}

export async function SuppliersContent({ searchParams }: SuppliersContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez vos fournisseurs
          </p>
        </div>
        <SuppliersPrimaryButtons />
      </div>
      <SuppliersTableWrapper searchParams={searchParams} />
    </div>
  )
}

