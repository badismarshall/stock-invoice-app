"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer, Mail } from "lucide-react"
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

  const handleSendEmailViaClient = async () => {
    if (!cancellation) return;

    const printContent = document.getElementById('cancellation-print-content');
    if (!printContent) {
      toast.error("Contenu d'impression non trouvé");
      return;
    }

    const recipientEmail = cancellation.client?.email;
    const recipientName = cancellation.client?.name;
    const cancellationNumber = cancellation.cancellationNumber || 'Annulation';

    // Get the HTML content and prepare it for PDF (same as handlePrint)
    let content = printContent.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Replace logo src
    const logoImages = tempDiv.querySelectorAll('img[alt*="Logo"]');
    logoImages.forEach((img) => {
      if (companyInfo?.logo) {
        const logoPath = companyInfo.logo.startsWith('/') ? companyInfo.logo : `/${companyInfo.logo}`;
        const absoluteLogoPath = logoPath.startsWith('http') 
          ? logoPath 
          : `${window.location.origin}${logoPath}`;
        img.setAttribute('src', absoluteLogoPath);
      } else {
        const absoluteLogoPath = `${window.location.origin}/logo.png`;
        img.setAttribute('src', absoluteLogoPath);
      }
    });
    
    content = tempDiv.innerHTML;

    // Create HTML document for PDF (using same styles as handlePrint)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cancellationNumber}</title>
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
            .cancellation-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .company-info {
              flex: 1;
            }
            .company-logo {
              margin-bottom: 10px;
            }
            .company-logo img {
              max-height: 60px;
              width: auto;
            }
            .company-info h1 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .company-info p {
              font-size: 9px;
              margin: 1px 0;
              line-height: 1.3;
            }
            .cancellation-title {
              text-align: right;
            }
            .cancellation-title h2 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .cancellation-title p {
              font-size: 10px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 15px;
            }
            .info-section h3 {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .info-section p {
              font-size: 9px;
              margin: 1px 0;
              line-height: 1.3;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9px;
            }
            thead {
              background-color: #f5f5f5;
            }
            th {
              padding: 6px 3px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #333;
              font-size: 9px;
            }
            th.text-right {
              text-align: right;
            }
            td {
              padding: 4px 3px;
              border-bottom: 1px solid #ddd;
              font-size: 9px;
            }
            td.text-right {
              text-align: right;
            }
            .product-code {
              font-weight: bold;
              min-width: 80px;
            }
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tfoot {
              border-top: 2px solid #333;
            }
            tfoot td {
              font-weight: bold;
              padding: 6px 3px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 8px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="cancellation-container">
            ${content}
          </div>
        </body>
      </html>
    `;

    const filename = `${cancellationNumber}.pdf`;
    const subject = `${cancellationNumber} - ${companyInfo?.name || 'Sirof Algeria'}`;
    const body = `Bonjour ${recipientName || ''},\n\nVeuillez trouver ci-joint le document ${cancellationNumber}.\n\nVeuillez sélectionner "Enregistrer au format PDF" dans la boîte de dialogue d'impression, puis attacher le fichier téléchargé à cet email.\n\nCordialement`;

    try {
      const { generatePDFAndSendEmail } = await import("@/lib/utils/pdf-email");
      generatePDFAndSendEmail(htmlContent, filename, recipientEmail, subject, body);
      toast.info("Ouvrez la boîte de dialogue d'impression et sélectionnez 'Enregistrer au format PDF', puis votre application email s'ouvrira");
    } catch (error) {
      console.error("Error generating PDF and opening email:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

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
    
    // Replace logo src - use companyInfo.logo if available, otherwise use default
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const logoImages = tempDiv.querySelectorAll('img[alt*="Logo"]');
    logoImages.forEach((img) => {
      if (companyInfo?.logo) {
        const logoPath = companyInfo.logo.startsWith('/') ? companyInfo.logo : `/${companyInfo.logo}`;
        // Get absolute URL for the logo in print window
        const absoluteLogoPath = logoPath.startsWith('http') 
          ? logoPath 
          : `${window.location.origin}${logoPath}`;
        img.setAttribute('src', absoluteLogoPath);
      } else {
        // Use default logo
        const absoluteLogoPath = `${window.location.origin}/logo.png`;
        img.setAttribute('src', absoluteLogoPath);
      }
    });
    
    content = tempDiv.innerHTML;
    
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
            .cancellation-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .company-info {
              flex: 1;
            }
            .company-logo {
              margin-bottom: 10px;
            }
            .company-logo img {
              max-height: 60px;
              width: auto;
            }
            .company-info h1 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .company-info p {
              font-size: 9px;
              margin: 1px 0;
              line-height: 1.3;
            }
            .cancellation-title {
              text-align: right;
            }
            .cancellation-title h2 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .cancellation-title p {
              font-size: 10px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 15px;
            }
            .info-section h3 {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .info-section p {
              font-size: 9px;
              margin: 1px 0;
              line-height: 1.3;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9px;
            }
            thead {
              background-color: #f5f5f5;
            }
            th {
              padding: 6px 3px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #333;
              font-size: 9px;
            }
            th.text-right {
              text-align: right;
            }
            td {
              padding: 4px 3px;
              border-bottom: 1px solid #ddd;
              font-size: 9px;
            }
            td.text-right {
              text-align: right;
            }
            .product-code {
              font-weight: bold;
              min-width: 80px;
            }
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tfoot {
              border-top: 2px solid #333;
            }
            tfoot td {
              font-weight: bold;
              padding: 6px 3px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 8px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="cancellation-container">
            ${content}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close window after print dialog closes (user may cancel)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 250);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !cancellation) {
    return (
      <div className="p-8">
        <div className="text-destructive">{error || "Annulation non trouvée"}</div>
        <Button onClick={() => router.push("/dashboard/export/delivery-notes-cancellation")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
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
          onClick={() => router.push("/dashboard/export/delivery-notes-cancellation")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex gap-2">
          {cancellation && cancellation.client?.email && (
            <Button
              variant="outline"
              onClick={handleSendEmailViaClient}
            >
              <Mail className="mr-2 h-4 w-4" />
              Envoyer par email
            </Button>
          )}
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Cancellation Content for Print */}
      <div id="cancellation-print-content" className="mx-auto max-w-4xl bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="header mb-8 flex items-start justify-between border-b-2 border-gray-300 pb-6">
          <div className="company-info">
            {/* Logo */}
            <div className="company-logo mb-3">
              {(() => {
                // Determine logo source - use companyInfo.logo if available, otherwise default
                const logoSource = companyInfo?.logo 
                  ? (companyInfo.logo.startsWith('/') ? companyInfo.logo : `/${companyInfo.logo}`)
                  : '/logo.png';
                
                return (
                  <Image 
                    src={logoSource}
                    alt={companyInfo?.name || "Company Logo"} 
                    width={200} 
                    height={60}
                    className="h-auto"
                    unoptimized
                    onError={(e) => {
                      // Fallback to default logo if custom logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/logo.png';
                    }}
                  />
                );
              })()}
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
                {client.nafApe && <p>NAF-APE: {client.nafApe}</p>}
                {client.rcsRm && <p>RCS/RM: {client.rcsRm}</p>}
                {client.eori && <p>EORI: {client.eori}</p>}
                {client.tvaNumber && <p>TVA: {client.tvaNumber}</p>}
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
