"use server";

import { getErrorMessage } from "@/lib/handle-error";
import { getInvoiceById } from "./actions";
import { getCompanySettings } from "./actions";

/**
 * Send invoice by email
 * This function generates an HTML email with the invoice details
 */
export async function sendInvoiceByEmail(input: {
  invoiceId: string;
  recipientEmail: string;
  recipientName?: string;
}) {
  try {
    // Get invoice data
    const invoiceResult = await getInvoiceById({ id: input.invoiceId });
    if (!invoiceResult.data || invoiceResult.error) {
      return {
        data: null,
        error: invoiceResult.error || "Facture non trouvée",
      };
    }

    // Get company settings
    const companyResult = await getCompanySettings();
    if (!companyResult.data || companyResult.error) {
      return {
        data: null,
        error: companyResult.error || "Paramètres de l'entreprise non trouvés",
      };
    }

    const invoice = invoiceResult.data;
    const companyInfo = companyResult.data;

    // Determine partner info
    const partnerInfo = invoice.supplier || invoice.client;
    const isPurchaseInvoice = invoice.invoiceType === "purchase";

    // Generate HTML email content
    const emailHtml = generateInvoiceEmailHTML(invoice, companyInfo, partnerInfo, isPurchaseInvoice);

    // For development, just log the email
    if (process.env.NODE_ENV === "development") {
      console.log("=== EMAIL (Development Mode) ===");
      console.log("To:", input.recipientEmail);
      console.log("Subject:", `Facture ${invoice.invoiceNumber} - ${companyInfo.name}`);
      console.log("Recipient:", input.recipientName || partnerInfo?.name || "Client");
      console.log("HTML Content Length:", emailHtml.length);
      console.log("================================");
      
      return {
        data: { success: true },
        error: null,
      };
    }

    // For production, send email using API route
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      
      const response = await fetch(`${baseUrl}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: input.recipientEmail,
          subject: `Facture ${invoice.invoiceNumber} - ${companyInfo.name}`,
          html: emailHtml,
          recipientName: input.recipientName || partnerInfo?.name || "Client",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de l'envoi de l'email" }));
        return {
          data: null,
          error: errorData.error || "Erreur lors de l'envoi de l'email",
        };
      }

      return {
        data: { success: true },
        error: null,
      };
    } catch (fetchError) {
      console.error("Error calling email API:", fetchError);
      return {
        data: null,
        error: "Erreur lors de l'appel à l'API d'envoi d'email",
      };
    }
  } catch (err) {
    console.error("Error sending invoice by email", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Generate HTML email content for invoice
 */
function generateInvoiceEmailHTML(
  invoice: any,
  companyInfo: any,
  partnerInfo: any,
  isPurchaseInvoice: boolean
): string {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2).replace(',', '.') + ' ' + (invoice.currency || 'DZD');
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-info {
      margin-bottom: 20px;
    }
    .invoice-details {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>${companyInfo.name || 'Entreprise'}</h1>
      ${companyInfo.address ? `<p>${companyInfo.address}</p>` : ''}
      ${companyInfo.phone ? `<p>Téléphone: ${companyInfo.phone}</p>` : ''}
      ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
      ${companyInfo.nif ? `<p>NIF: ${companyInfo.nif}</p>` : ''}
      ${companyInfo.rc ? `<p>RC: ${companyInfo.rc}</p>` : ''}
    </div>
  </div>

  <div class="invoice-details">
    <h2>${isPurchaseInvoice ? 'FACTURE D\'ACHAT' : 'FACTURE'}</h2>
    <p><strong>N° Facture:</strong> ${invoice.invoiceNumber}</p>
    <p><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
    ${invoice.dueDate && !isPurchaseInvoice ? `<p><strong>Date d'échéance:</strong> ${formatDate(invoice.dueDate)}</p>` : ''}
  </div>

  <div>
    <h3>${isPurchaseInvoice ? 'FOURNISSEUR' : 'CLIENT'}</h3>
    ${partnerInfo ? `
      <p><strong>${partnerInfo.name || ''}</strong></p>
      ${partnerInfo.address ? `<p>${partnerInfo.address}</p>` : ''}
      ${partnerInfo.phone ? `<p>Téléphone: ${partnerInfo.phone}</p>` : ''}
      ${partnerInfo.email ? `<p>Email: ${partnerInfo.email}</p>` : ''}
      ${partnerInfo.nif ? `<p>NIF: ${partnerInfo.nif}</p>` : ''}
      ${partnerInfo.rc ? `<p>RC: ${partnerInfo.rc}</p>` : ''}
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th>Quantité</th>
        <th>Prix unitaire</th>
        <th>Remise</th>
        <th>TVA</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items?.map((item: any) => `
        <tr>
          <td>${item.productName || ''} ${item.productCode ? `(${item.productCode})` : ''}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${item.discountPercent || 0}%</td>
          <td>${item.taxRate || 0}%</td>
          <td>${formatCurrency(item.lineTotal)}</td>
        </tr>
      `).join('') || ''}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="5">Sous-total HT</td>
        <td>${formatCurrency(invoice.subtotal)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="5">TVA</td>
        <td>${formatCurrency(invoice.taxAmount)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="5"><strong>Total TTC</strong></td>
        <td><strong>${formatCurrency(invoice.totalAmount)}</strong></td>
      </tr>
    </tfoot>
  </table>

  ${invoice.notes ? `
    <div>
      <h4>Notes:</h4>
      <p>${invoice.notes}</p>
    </div>
  ` : ''}

  <div class="footer">
    <p>Merci de votre confiance.</p>
    <p>${companyInfo.name || 'Entreprise'}</p>
  </div>
</body>
</html>
  `;
}

