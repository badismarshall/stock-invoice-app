/**
 * Utility functions for generating PDF and sending via email
 * 
 * Note: mailto: links cannot directly attach files. This function:
 * 1. Opens a print window with the HTML content
 * 2. Prompts user to save as PDF (or uses browser's print to PDF)
 * 3. Opens email client with a message suggesting to attach the downloaded PDF
 */

/**
 * Generate PDF from HTML content and open email client
 * Uses the browser's print functionality to generate PDF, then opens email
 */
export function generatePDFAndSendEmail(
  htmlContent: string,
  filename: string,
  recipientEmail?: string,
  subject?: string,
  body?: string
): void {
  try {
    // Create a print window with the HTML content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les popups.");
    }

    // Write HTML content to print window
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.focus();
      
      // Trigger print dialog - user can select "Save as PDF"
      printWindow.print();
      
      // After a delay, open email client
      setTimeout(() => {
        const emailSubject = subject || `Document: ${filename.replace('.pdf', '')}`;
        const emailBody = body || `Bonjour,\n\nVeuillez trouver ci-joint le document ${filename.replace('.pdf', '')}.\n\nVeuillez sélectionner "Enregistrer au format PDF" dans la boîte de dialogue d'impression, puis attacher le fichier téléchargé à cet email.\n\nCordialement`;
        const mailtoLink = recipientEmail
          ? `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
          : `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Close print window after a delay
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 2000); // Wait 2 seconds for print dialog to appear
    }, 250);
  } catch (error) {
    console.error('Error generating PDF and opening email:', error);
    throw error;
  }
}

