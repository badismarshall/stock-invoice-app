"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { getPurchaseOrderByIdAction } from "../../../_lib/actions"
import { getCompanySettings } from "../../../../invoices/_lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"

interface PrintPurchaseOrderContentProps {
  purchaseOrderId: string;
}

export function PrintPurchaseOrderContent({ purchaseOrderId }: PrintPurchaseOrderContentProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [purchaseOrder, setPurchaseOrder] = React.useState<any>(null);
  const [companyInfo, setCompanyInfo] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [purchaseOrderResult, companyResult] = await Promise.all([
          getPurchaseOrderByIdAction({ id: purchaseOrderId }),
          getCompanySettings(),
        ]);
        
        if (purchaseOrderResult.error) {
          setError(purchaseOrderResult.error);
          return;
        }
        
        if (purchaseOrderResult.data) {
          setPurchaseOrder(purchaseOrderResult.data);
        }
        
        if (companyResult.data) {
          setCompanyInfo(companyResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du bon de commande");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [purchaseOrderId]);

  const handlePrint = () => {
    const printContent = document.getElementById('purchase-order-print-content');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    let content = printContent.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const notesElements = tempDiv.querySelectorAll('[data-print-remove="true"]');
    notesElements.forEach(el => el.remove());
    
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
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bon de Commande ${purchaseOrder?.orderNumber || ''}</title>
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
            .purchase-order-container {
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
            .purchase-order-title {
              text-align: right;
            }
            .purchase-order-title h2 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .purchase-order-title p {
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
          <div class="purchase-order-container">
            ${content}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
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

  if (error || !purchaseOrder) {
    return (
      <div className="p-8">
        <div className="text-destructive">{error || "Bon de commande non trouvé"}</div>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  // Calculate totals
  const totalHT = purchaseOrder.items.reduce(
    (acc: number, item: any) => acc + item.quantity * item.unitCost,
    0
  );
  const totalTax = purchaseOrder.items.reduce(
    (acc: number, item: any) => {
      const subtotal = item.quantity * item.unitCost;
      return acc + (item.lineTotal - subtotal);
    },
    0
  );
  const totalTTC = purchaseOrder.items.reduce(
    (acc: number, item: any) => acc + item.lineTotal,
    0
  );

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

      {/* Purchase Order Content for Print */}
      <div id="purchase-order-print-content" className="mx-auto max-w-4xl bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="header mb-8 flex items-start justify-between border-b-2 border-gray-300 pb-6">
          <div className="company-info">
            {/* Logo */}
            <div className="company-logo mb-3">
              {(() => {
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
          <div className="purchase-order-title text-right">
            <h2 className="text-2xl font-bold text-gray-900">
              BON DE COMMANDE
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              N° {purchaseOrder.orderNumber}
            </p>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="info-section mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              FOURNISSEUR
            </h3>
            {purchaseOrder.supplier ? (
              <div className="text-sm text-gray-600">
                <p className="font-semibold">{purchaseOrder.supplier.name}</p>
                {purchaseOrder.supplier.address && <p>{purchaseOrder.supplier.address}</p>}
                {purchaseOrder.supplier.phone && <p>Tél: {purchaseOrder.supplier.phone}</p>}
                {purchaseOrder.supplier.email && <p>Email: {purchaseOrder.supplier.email}</p>}
                {(purchaseOrder.supplier.nafApe || purchaseOrder.supplier.rcsRm || purchaseOrder.supplier.eori || purchaseOrder.supplier.tvaNumber) && (
                  <p>
                    {purchaseOrder.supplier.nafApe && `NAF-APE: ${purchaseOrder.supplier.nafApe}`}
                    {purchaseOrder.supplier.nafApe && (purchaseOrder.supplier.rcsRm || purchaseOrder.supplier.eori || purchaseOrder.supplier.tvaNumber) && " | "}
                    {purchaseOrder.supplier.rcsRm && `RCS/RM: ${purchaseOrder.supplier.rcsRm}`}
                    {purchaseOrder.supplier.rcsRm && (purchaseOrder.supplier.eori || purchaseOrder.supplier.tvaNumber) && " | "}
                    {purchaseOrder.supplier.eori && `EORI: ${purchaseOrder.supplier.eori}`}
                    {purchaseOrder.supplier.eori && purchaseOrder.supplier.tvaNumber && " | "}
                    {purchaseOrder.supplier.tvaNumber && `TVA: ${purchaseOrder.supplier.tvaNumber}`}
                  </p>
                )}
              </div>
            ) : purchaseOrder.supplierName ? (
              <div className="text-sm text-gray-600">
                <p className="font-semibold">{purchaseOrder.supplierName}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Non renseigné</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">INFORMATIONS</h3>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-semibold">Date commande:</span>{" "}
                {format(purchaseOrder.orderDate, "PPP", { locale: fr })}
              </p>
              {purchaseOrder.receptionDate && (
                <p>
                  <span className="font-semibold">Date réception:</span>{" "}
                  {format(purchaseOrder.receptionDate, "PPP", { locale: fr })}
                </p>
              )}
              <p>
                <span className="font-semibold">Statut:</span>{" "}
                {purchaseOrder.status === "pending" ? "En attente" : 
                 purchaseOrder.status === "received" ? "Reçu" : 
                 "Annulé"}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qté</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Prix unitaire</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TVA %</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.items.map((item: any, index: number) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>
                      {item.productCode && (
                        <span className="font-semibold">{item.productCode}</span>
                      )}
                      {item.productCode && item.productName && " - "}
                      {item.productName || (item.productCode ? "" : "Produit")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{item.quantity.toFixed(3).replace(',', '.')}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{item.unitCost.toFixed(2).replace(',', '.')} DZD</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{item.taxRate ? item.taxRate.toFixed(2).replace(',', '.') : '0.00'}%</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{item.lineTotal.toFixed(2).replace(',', '.')} DZD</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Total HT:
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {totalHT.toFixed(2).replace(',', '.')} DZD
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Total TVA:
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {totalTax.toFixed(2).replace(',', '.')} DZD
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-lg font-bold text-gray-700">
                  Total TTC:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                  {totalTTC.toFixed(2).replace(',', '.')} DZD
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes - hidden when printing */}
        {purchaseOrder.notes && (
          <div className="mb-8 border-t border-gray-300 pt-4 print:hidden" data-print-remove="true">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Notes:</h3>
            <p className="text-sm text-gray-600">{purchaseOrder.notes}</p>
          </div>
        )}

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

