"use client"

import * as React from "react"
import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoicesOverview } from "./invoices-overview"
import { InvoicesTableWrapper } from "./data-table/invoices-table-wrapper"
import { UnpaidInvoices } from "./unpaid-invoices"
import { OverdueInvoices } from "./overdue-invoices"

interface InvoicesContentProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function InvoicesContent({ searchParams }: InvoicesContentProps) {
  const [activeTab, setActiveTab] = React.useState("overview")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="all">Toutes les Factures</TabsTrigger>
        <TabsTrigger value="unpaid">Impayées</TabsTrigger>
        <TabsTrigger value="overdue">Échues</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <InvoicesOverview searchParams={searchParams} />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="all" className="space-y-4">
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <InvoicesTableWrapper searchParams={searchParams} />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="unpaid" className="space-y-4">
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <UnpaidInvoices searchParams={searchParams} />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="overdue" className="space-y-4">
        <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
          <OverdueInvoices searchParams={searchParams} />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}

