import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { getAllPurchaseOrdersForExport } from "../../_lib/actions"
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions"
import { ExportPurchasesXLSXContent } from "./_components/export-purchases-xlsx-content"
import type { SearchParams } from "@/types"

export const metadata: Metadata = {
    title: "Export XLSX - Achats",
    description: "Export de toutes les commandes d'achat en XLSX",
}

interface ExportPurchasesXLSXPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ExportPurchasesXLSXPage(props: ExportPurchasesXLSXPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const searchParams = await props.searchParams;
    const startDate = searchParams.startDate ? new Date(Number(searchParams.startDate)) : undefined;
    const endDate = searchParams.endDate ? new Date(Number(searchParams.endDate)) : undefined;

    const [ordersResult, companyResult] = await Promise.all([
      getAllPurchaseOrdersForExport({ startDate, endDate }),
      getCompanySettings(),
    ]);

    return (
      <ExportPurchasesXLSXContent 
        purchaseOrders={ordersResult.data || []}
        companyInfo={companyResult.data}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    );
}

