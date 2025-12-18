/**
 * Utility function to generate invoice numbers based on invoice type
 * Format: PREFIX-YYYY-XXXXXX
 * 
 * Prefixes:
 * - sale_invoice: FAC-VT
 * - purchase: FAC-ACH
 * - delivery_note_invoice: BL
 * - proforma: FAC-PRO
 * - sale_local: FAC-LOC
 * - sale_export: FAC-EXP
 * - cancellation: BL-ANL
 * - cancelled sale_invoice: FAC-VT-AN
 * - delivery_note (local): BL
 * - delivery_note (export): BL-EXP
 * - purchase_order: CMD-ACH
 */

export type InvoiceType = 
  | "sale_invoice" 
  | "purchase" 
  | "delivery_note_invoice" 
  | "proforma" 
  | "sale_local" 
  | "sale_export";

export type CancellationType = "delivery_note_cancellation" | "sale_invoice_cancellation";

export type DeliveryNoteType = "local" | "export";

export type PurchaseOrderType = "purchase_order";

/**
 * Get the prefix for an invoice type
 */
export function getInvoicePrefix(invoiceType: InvoiceType): string {
  const prefixMap: Record<InvoiceType, string> = {
    sale_invoice: "FAC-VT",
    purchase: "FAC-ACH",
    delivery_note_invoice: "BL",
    proforma: "FAC-PRO",
    sale_local: "FAC-LOC",
    sale_export: "FAC-EXP",
  };
  
  return prefixMap[invoiceType] || "FAC";
}

/**
 * Get the prefix for a cancellation type
 */
export function getCancellationPrefix(cancellationType: CancellationType): string {
  const prefixMap: Record<CancellationType, string> = {
    delivery_note_cancellation: "BL-ANL",
    sale_invoice_cancellation: "FAC-VT-AN",
  };
  
  return prefixMap[cancellationType] || "ANL";
}

/**
 * Generate an invoice number based on type
 * Format: PREFIX-YYYY-XXXXXX
 * 
 * @param invoiceType - The type of invoice
 * @param customSuffix - Optional custom suffix (default: random 6-digit number)
 * @returns Generated invoice number
 */
export function generateInvoiceNumber(
  invoiceType: InvoiceType,
  customSuffix?: string
): string {
  const prefix = getInvoicePrefix(invoiceType);
  const year = new Date().getFullYear();
  const suffix = customSuffix || String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  
  return `${prefix}-${year}-${suffix}`;
}

/**
 * Generate a cancellation number based on type
 * Format: PREFIX-YYYY-XXXXXX
 * 
 * @param cancellationType - The type of cancellation
 * @param customSuffix - Optional custom suffix (default: last 6 chars of generated ID)
 * @returns Generated cancellation number
 */
export function generateCancellationNumber(
  cancellationType: CancellationType,
  customSuffix?: string
): string {
  const prefix = getCancellationPrefix(cancellationType);
  const year = new Date().getFullYear();
  const suffix = customSuffix || String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  
  return `${prefix}-${year}-${suffix}`;
}

/**
 * Generate a delivery note number based on type
 * Format: PREFIX-YYYY-XXXXXX
 * 
 * @param noteType - The type of delivery note (local or export)
 * @param customSuffix - Optional custom suffix (default: random 6-digit number)
 * @returns Generated delivery note number
 */
export function generateDeliveryNoteNumber(
  noteType: DeliveryNoteType,
  customSuffix?: string
): string {
  const prefix = noteType === "export" ? "BL-EXP" : "BL";
  const year = new Date().getFullYear();
  const suffix = customSuffix || String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  
  return `${prefix}-${year}-${suffix}`;
}

/**
 * Generate a purchase order number
 * Format: CMD-ACH-YYYY-XXXXXX
 * 
 * @param customSuffix - Optional custom suffix (default: random 6-digit number)
 * @returns Generated purchase order number
 */
export function generatePurchaseOrderNumber(
  customSuffix?: string
): string {
  const prefix = "CMD-ACH";
  const year = new Date().getFullYear();
  const suffix = customSuffix || String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  
  return `${prefix}-${year}-${suffix}`;
}

