import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { getAllDeliveryNotesForExport } from "../../_lib/actions"
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions"
import { ExportSalesPDFContent } from "./_components/export-sales-pdf-content"
import type { SearchParams } from "@/types"

export const metadata: Metadata = {
    title: "Export PDF - Ventes",
    description: "Export de tous les bons de livraison en PDF",
}

interface ExportSalesPDFPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ExportSalesPDFPage(props: ExportSalesPDFPageProps) {
    const user = await getCurrentUser();
    if (!user) {
      redirect(`/sign-in`);
    }

    const searchParams = await props.searchParams;
    const startDate = searchParams.startDate ? new Date(Number(searchParams.startDate)) : undefined;
    const endDate = searchParams.endDate ? new Date(Number(searchParams.endDate)) : undefined;

    const [notesResult, companyResult] = await Promise.all([
      getAllDeliveryNotesForExport({ startDate, endDate }),
      getCompanySettings(),
    ]);

    return (
      <ExportSalesPDFContent 
        deliveryNotes={notesResult.data || []}
        companyInfo={companyResult.data}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    );
}

