"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { getInvoiceById, getCompanySettings } from "../../../_lib/actions"
import { getPaymentsByInvoiceId } from "../../../../payments/_lib/actions"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import logo from "@/public/logo.png"
interface PrintInvoiceContentProps {
  invoiceId: string;
}

export function PrintInvoiceContent({ invoiceId }: PrintInvoiceContentProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [invoice, setInvoice] = React.useState<any>(null);
  const [companyInfo, setCompanyInfo] = React.useState<any>(null);
  const [payments, setPayments] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoiceResult, companyResult, paymentsResult] = await Promise.all([
          getInvoiceById({ id: invoiceId }),
          getCompanySettings(),
          getPaymentsByInvoiceId({ invoiceId }),
        ]);
        
        if (invoiceResult.error) {
          setError(invoiceResult.error);
          return;
        }
        
        if (invoiceResult.data) {
          setInvoice(invoiceResult.data);
        }
        
        if (companyResult.data) {
          setCompanyInfo(companyResult.data);
          // Debug: log logo path
          console.log("Company logo path:", companyResult.data.logo);
        }

        if (paymentsResult.data) {
          setPayments(paymentsResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de la facture");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [invoiceId]);

  const handleSendEmail = async () => {
    if (!invoice) return;

    const recipientEmail = invoice.client?.email || invoice.supplier?.email;
    const recipientName = invoice.client?.name || invoice.supplier?.name;

    if (!recipientEmail) {
      toast.error("Aucune adresse email trouvée pour le client/fournisseur");
      return;
    }

    setSendingEmail(true);
    try {
      const { sendInvoiceByEmail } = await import("../../../_lib/email-actions");
      const result = await sendInvoiceByEmail({
        invoiceId: invoiceId,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Facture envoyée par email à ${recipientEmail}`);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePrint = () => {
    // Create a new window for printing to avoid URL in footer
    const printContent = document.getElementById('invoice-print-content');
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

    // Get the HTML content and remove notes section
    let content = printContent.innerHTML;
    // Remove notes section if it exists (using data attribute)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const notesElements = tempDiv.querySelectorAll('[data-print-remove="true"]');
    notesElements.forEach(el => el.remove());
    
    // Replace logo src - use companyInfo.logo if available, otherwise use default
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
          <title>Facture ${invoice?.invoiceNumber || ''}</title>
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
            .invoice-container {
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
            .invoice-title {
              text-align: right;
            }
            .invoice-title h2 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .invoice-title p {
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
          <div class="invoice-container">
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

  if (error || !invoice) {
    return (
      <div className="p-8">
        <div className="text-destructive">{error || "Facture non trouvée"}</div>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    );
  }

  const supplier = invoice.supplier;
  const client = invoice.client;
  const purchaseOrder = invoice.purchaseOrder;
  const isPurchaseInvoice = invoice.invoiceType === "purchase";
  const isDeliveryNoteInvoice = invoice.invoiceType === "delivery_note_invoice";
  const isSaleInvoice = invoice.invoiceType === "sale_invoice";
  
  // Determine partner info based on invoice type
  const partnerInfo = isPurchaseInvoice ? supplier : client;

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
        <div className="flex gap-2">
          {invoice && (invoice.client?.email || invoice.supplier?.email) && (
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={sendingEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              {sendingEmail ? "Envoi..." : "Envoyer par email"}
            </Button>
          )}
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Invoice Content for Print */}
      <div id="invoice-print-content" className="mx-auto max-w-4xl bg-white p-8 shadow-sm">
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
              {(companyInfo?.nif || companyInfo?.rc) && (
                <p>
                  {companyInfo.nif && `NIF: ${companyInfo.nif}`}
                  {companyInfo.nif && companyInfo.rc && " | "}
                  {companyInfo.rc && `RC: ${companyInfo.rc}`}
                </p>
              )}
            </div>
          </div>
          <div className="invoice-title text-right">
            <h2 className="text-2xl font-bold text-gray-900">
              {isPurchaseInvoice 
                ? "FACTURE D'ACHAT" 
                : invoice.invoiceType === "proforma"
                ? "FACTURE DE PROFORMA"
                : invoice.invoiceType === "sale_invoice"
                ? "FACTURE DE VENTE"
                : invoice.invoiceType === "delivery_note_invoice"
                ? "BON DE LIVRAISON"
                : "FACTURE"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              N° {invoice.invoiceNumber}
            </p>
            {isPurchaseInvoice && purchaseOrder && (
              <p className="mt-1 text-xs text-gray-500">
                Bon de commande: {purchaseOrder.orderNumber}
              </p>
            )}
          </div>
        </div>

        {/* Supplier/Client Info */}
        <div className="info-section mb-8 grid grid-cols-2 gap-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              {isPurchaseInvoice ? "FOURNISSEUR" : "CLIENT"}
            </h3>
            {partnerInfo ? (
              <div className="text-sm text-gray-600">
                <p className="font-semibold">{partnerInfo.name}</p>
                {partnerInfo.address && <p>{partnerInfo.address}</p>}
                {partnerInfo.phone && <p>Tél: {partnerInfo.phone}</p>}
                {partnerInfo.email && <p>Email: {partnerInfo.email}</p>}
                {partnerInfo.nif && <p>NIF: {partnerInfo.nif}</p>}
                {partnerInfo.rc && <p>RC: {partnerInfo.rc}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Non renseigné</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">INFORMATIONS</h3>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-semibold">Date facture:</span>{" "}
                {format(invoice.invoiceDate, "PPP", { locale: fr })}
              </p>
              {isPurchaseInvoice && purchaseOrder ? (
                <>
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
                </>
              ) : (
                !isSaleInvoice && invoice.dueDate && (
                  <p>
                    <span className="font-semibold">Date d'échéance:</span>{" "}
                    {format(invoice.dueDate, "PPP", { locale: fr })}
                  </p>
                )
              )}
              {!isPurchaseInvoice && (
                <>
                  {invoice.destinationCountry && (
                    <p>
                      <span className="font-semibold">Pays de destination:</span>{" "}
                      {invoice.destinationCountry}
                    </p>
                  )}
                  {invoice.deliveryLocation && (
                    <p>
                      <span className="font-semibold">Lieu de livraison:</span>{" "}
                      {invoice.deliveryLocation}
                    </p>
                  )}
                </>
              )}
              {!isDeliveryNoteInvoice && (
                <p>
                  <span className="font-semibold">Statut paiement:</span>{" "}
                  {invoice.paymentStatus === "paid" ? "Payé" : 
                   invoice.paymentStatus === "partially_paid" ? "Partiellement payé" : 
                   "Non payé"}
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
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qté</th>
                {!isDeliveryNoteInvoice && (
                  <>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Prix unitaire</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Remise %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TVA %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total HT</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">TVA</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total TTC</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {item.productCode || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>
                      {item.productName || "Produit"}
                      {item.productDescription && (
                        <div className="text-xs text-gray-500 mt-1">{item.productDescription}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{item.quantity.toFixed(3).replace(',', '.')}</td>
                  {!isDeliveryNoteInvoice && (
                    <>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">{item.unitPrice.toFixed(2).replace(',', '.')} {invoice.currency}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">{item.discountPercent.toFixed(2).replace(',', '.')}%</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">{item.taxRate.toFixed(2).replace(',', '.')}%</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">{item.lineSubtotal.toFixed(2).replace(',', '.')} {invoice.currency}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700">{item.lineTax.toFixed(2).replace(',', '.')} {invoice.currency}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{item.lineTotal.toFixed(2).replace(',', '.')} {invoice.currency}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            {!isDeliveryNoteInvoice && (
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total HT:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {invoice.subtotal.toFixed(2).replace(',', '.')} {invoice.currency}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {invoice.taxAmount.toFixed(2).replace(',', '.')} {invoice.currency}
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                    {invoice.totalAmount.toFixed(2).replace(',', '.')} {invoice.currency}
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total TTC:
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                    {invoice.totalAmount.toFixed(2).replace(',', '.')} {invoice.currency}
                  </td>
                </tr>
                {payments && payments.totalPaid > 0 && (
                  <>
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Montant payé:
                      </td>
                      <td colSpan={2}></td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                        {payments.totalPaid.toFixed(2).replace(',', '.')} {invoice.currency}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Montant restant:
                      </td>
                      <td colSpan={2}></td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {(invoice.totalAmount - payments.totalPaid).toFixed(2).replace(',', '.')} {invoice.currency}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            )}
          </table>
        </div>

        {/* Payment Information */}
        {!isDeliveryNoteInvoice && payments && payments.payments && payments.payments.length > 0 && (
          <div className="mb-8 border-t border-gray-300 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">INFORMATIONS DE PAIEMENT</h3>
            <div className="space-y-2">
              {payments.payments.map((payment: any) => {
                const paymentMethodLabels: Record<string, string> = {
                  cash: "Espèces",
                  check: "Chèque",
                  transfer: "Virement",
                  other: "Autre",
                };
                return (
                  <div key={payment.id} className="flex justify-between text-sm text-gray-600 border-b border-gray-200 pb-2">
                    <div>
                      <span className="font-semibold">Paiement du {format(new Date(payment.paymentDate), "PPP", { locale: fr })}</span>
                      <span className="ml-2 text-xs text-gray-500">({paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod})</span>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {parseFloat(payment.amount).toFixed(2).replace(',', '.')} {invoice.currency}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes - hidden when printing */}
        {invoice.notes && (
          <div className="mb-8 border-t border-gray-300 pt-4 print:hidden" data-print-remove="true">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Notes:</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
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
