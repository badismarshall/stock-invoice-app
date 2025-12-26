"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { getDeliveryNoteCancellationByIdAction } from "../../../_lib/actions"
import { getCompanySettings } from "@/app/(root)/dashboard/invoices/_lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import logo from "@/public/logo.png"

interface PrintCancellationContentProps {
  cancellationId: string;
}

export function PrintCancellationContent({ cancellationId }: PrintCancellationContentProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [cancellation, setCancellation] = React.useState<any>(null);
  const [companyInfo, setCompanyInfo] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [cancellationResult, companyResult] = await Promise.all([
          getDeliveryNoteCancellationByIdAction({ id: cancellationId }),
          getCompanySettings(),
        ]);
        
        if (cancellationResult.error) {
          setError(cancellationResult.error);
          return;
        }
        
        if (cancellationResult.data) {
          setCancellation(cancellationResult.data);
        }
        
        if (companyResult.data) {
          setCompanyInfo(companyResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'annulation");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cancellationId]);

  // Get unique delivery note numbers from items (must be before any conditional returns)
  const deliveryNoteNumbers = React.useMemo(() => {
    if (!cancellation) return [];
    if (cancellation.originalDeliveryNoteNumber) {
      return [cancellation.originalDeliveryNoteNumber];
    }
    // Extract unique note numbers from items
    const uniqueNumbers = Array.from(
      new Set(
        cancellation.items
          .map((item: any) => item.noteNumber)
          .filter((num: string | null) => num !== null && num !== undefined)
      )
    );
    return uniqueNumbers;
  }, [cancellation]);

  const handlePrint = () => {
    // Create a new window for printing to avoid URL in footer
    const printContent = document.getElementById('cancellation-print-content');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      // Fallback if popup is blocked
      window.print();
      return;
    }

    // Get the HTML content
    let content = printContent.innerHTML;
    
    // Create a clean HTML document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bon de Livraison Avoir ${cancellation?.cancellationNumber || ''}</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              color: #000;
              background: white;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #ccc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-info h1 {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .company-info p {
              font-size: 11px;
              margin: 2px 0;
            }
            .company-logo img {
              max-width: 200px;
              max-height: 60px;
              margin-bottom: 10px;
            }
            .cancellation-title {
              text-align: right;
            }
            .cancellation-title h2 {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .cancellation-title p {
              font-size: 11px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .info-section h3 {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .info-section p {
              font-size: 11px;
              margin: 3px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            thead {
              background-color: #f5f5f5;
            }
            th {
              padding: 10px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #ccc;
              font-size: 11px;
            }
            th.text-right {
              text-align: right;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #eee;
              font-size: 11px;
            }
            td.text-right {
              text-align: right;
            }
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tfoot {
              border-top: 2px solid #ccc;
            }
            tfoot td {
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !cancellation) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
        <div className="text-center text-red-600">
          {error || "Annulation non trouvée"}
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cancellation.items.reduce((sum: number, item: any) => {
    const lineSubtotal = item.cancelledQuantity * item.unitPrice;
    return sum + lineSubtotal;
  }, 0);

  const taxAmount = cancellation.items.reduce((sum: number, item: any) => {
    const lineSubtotal = item.cancelledQuantity * item.unitPrice;
    const taxRate = (item.productTaxRate || 0) / 100; // Convert percentage to decimal
    const lineTax = lineSubtotal * taxRate;
    return sum + lineTax;
  }, 0);

  const totalAmount = subtotal + taxAmount;

  const client = cancellation.client;

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Print controls - hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {/* Cancellation Content for Print */}
      <div id="cancellation-print-content" className="mx-auto max-w-4xl bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="header mb-8 flex items-start justify-between border-b-2 border-gray-300 pb-6">
          <div className="company-info">
            {/* Logo */}
            <div className="company-logo mb-3">
              {companyInfo?.logo ? (
                <Image 
                  src={logo}
                  alt={companyInfo.name || "Company Logo"} 
                  width={200} 
                  height={60}
                  className="h-auto"
                />
              ) : (
                <div className="flex h-16 w-48 items-center justify-center border border-gray-300 bg-gray-50 print:h-12 print:w-40">
                  <span className="text-xs font-bold text-gray-600">{companyInfo?.name || "Company Name"}</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{companyInfo?.name || "Company Name"}</h1>
            <div className="mt-2 text-sm text-gray-600">
              {companyInfo?.address && <p>{companyInfo.address}</p>}
              {companyInfo?.phone && <p>Tél: {companyInfo.phone}</p>}
              {companyInfo?.email && <p>Email: {companyInfo.email}</p>}
              {(companyInfo?.nafApe || companyInfo?.rcsRm || companyInfo?.eori || companyInfo?.tvaNumber) && (
                <p>
                  {companyInfo.nafApe && `NAF-APE: ${companyInfo.nafApe}`}
                  {companyInfo.nafApe && (companyInfo.rcsRm || companyInfo.eori || companyInfo.tvaNumber) && " | "}
                  {companyInfo.rcsRm && `RCS/RM: ${companyInfo.rcsRm}`}
                  {companyInfo.rcsRm && (companyInfo.eori || companyInfo.tvaNumber) && " | "}
                  {companyInfo.eori && `EORI: ${companyInfo.eori}`}
                  {companyInfo.eori && companyInfo.tvaNumber && " | "}
                  {companyInfo.tvaNumber && `TVA: ${companyInfo.tvaNumber}`}
                </p>
              )}
            </div>
          </div>
          <div className="cancellation-title text-right">
            <h2 className="text-2xl font-bold text-gray-900">
              BON DE LIVRAISON AVOIR
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              N° {cancellation.cancellationNumber}
            </p>
            {deliveryNoteNumbers.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {deliveryNoteNumbers.length === 1 
                  ? `Bon de livraison: ${deliveryNoteNumbers[0]}`
                  : `Bons de livraison: ${deliveryNoteNumbers.join(", ")}`}
              </p>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="info-section mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              CLIENT
            </h3>
            {client ? (
              <div className="text-sm text-gray-600">
                <p className="font-semibold">{client.name}</p>
                {client.address && <p>{client.address}</p>}
                {client.phone && <p>Tél: {client.phone}</p>}
                {client.email && <p>Email: {client.email}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Client non spécifié</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              INFORMATIONS
            </h3>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-semibold">Date d'annulation:</span>{" "}
                {format(new Date(cancellation.cancellationDate), "PPP", { locale: fr })}
              </p>
              {cancellation.reason && (
                <p className="mt-2">
                  <span className="font-semibold">Raison:</span> {cancellation.reason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">N° BL</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qté</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Prix unitaire</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Remise %</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total HT</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TVA</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {cancellation.items.map((item: any, index: number) => {
                const lineSubtotal = item.cancelledQuantity * item.unitPrice;
                const taxRate = (item.productTaxRate || 0) / 100; // Convert percentage to decimal
                const lineTax = lineSubtotal * taxRate;
                const lineTotal = lineSubtotal + lineTax;

                return (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                      {item.productCode || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.productName || "Produit"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {item.noteNumber || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {item.cancelledQuantity.toFixed(3).replace(',', '.')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {item.unitPrice.toFixed(2).replace(',', '.')} DZD
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {item.discountPercent.toFixed(2).replace(',', '.')}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {lineSubtotal.toFixed(2).replace(',', '.')} DZD
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {lineTax.toFixed(2).replace(',', '.')} DZD
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {lineTotal.toFixed(2).replace(',', '.')} DZD
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Total HT:
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {subtotal.toFixed(2).replace(',', '.')} DZD
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {taxAmount.toFixed(2).replace(',', '.')} DZD
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  {totalAmount.toFixed(2).replace(',', '.')} DZD
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Total TTC:
                </td>
                <td colSpan={2}></td>
                <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  {totalAmount.toFixed(2).replace(',', '.')} DZD
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="footer mt-12 border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
          <p>Merci de votre confiance!</p>
        </div>
      </div>

      {/* Print styles for direct print (fallback) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

