import type { SearchParams } from "@/types"
import { ClientsTableWrapper } from "./data-table/clients-table-wrapper"
import { ClientsPrimaryButtons } from "./clients-primary-buttons"

interface ClientsContentProps {
  searchParams: Promise<SearchParams>;
}

export async function ClientsContent({ searchParams }: ClientsContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Gérez vos clients
          </p>
        </div>
        <ClientsPrimaryButtons />
      </div>
      <ClientsTableWrapper searchParams={searchParams} />
    </div>
  )
}

