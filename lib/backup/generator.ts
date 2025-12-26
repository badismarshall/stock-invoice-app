import { writeFile } from "fs/promises";
import { join } from "path";
import { ensureBackupDir, generateBackupFilename } from "./config";
import db from "@/db";
import * as schema from "@/db/schema";

/**
 * Generate a SQL backup of the entire database
 * Returns the file path and file size in bytes
 */
export async function generateDatabaseBackup(): Promise<{
  filePath: string;
  fileSize: number;
  filename: string;
}> {
  const backupDir = await ensureBackupDir();
  const filename = generateBackupFilename();
  const filePath = join(backupDir, filename);

  // Get all table exports from the schema
  // We'll manually list the tables we want to backup
  const tablesToBackup = [
    { name: "user", table: schema.user },
    { name: "session", table: schema.session },
    { name: "account", table: schema.account },
    { name: "verification", table: schema.verification },
    { name: "organization", table: schema.organization },
    { name: "organization_role", table: schema.organizationRole },
    { name: "member", table: schema.member },
    { name: "invitation", table: schema.invitation },
    { name: "partner", table: schema.partner },
    { name: "permission", table: schema.permission },
    { name: "category", table: schema.category },
    { name: "product", table: schema.product },
    { name: "delivery_note", table: schema.deliveryNote },
    { name: "delivery_note_item", table: schema.deliveryNoteItem },
    { name: "delivery_note_cancellation", table: schema.deliveryNoteCancellation },
    { name: "delivery_note_cancellation_item", table: schema.deliveryNoteCancellationItem },
    { name: "invoice", table: schema.invoice },
    { name: "invoice_item", table: schema.invoiceItem },
    { name: "invoice_cancellation", table: schema.invoiceCancellation },
    { name: "payment", table: schema.payment },
    { name: "stock_movement", table: schema.stockMovement },
    { name: "stock_current", table: schema.stockCurrent },
    { name: "purchase_order", table: schema.purchaseOrder },
    { name: "purchase_order_item", table: schema.purchaseOrderItem },
    { name: "company_settings", table: schema.companySettings },
    { name: "backup", table: schema.backup },
  ];

  let sqlContent = `-- Database Backup
-- Generated: ${new Date().toISOString()}
-- Database: ${process.env.DATABASE_URL?.split("@")[1] || "unknown"}

BEGIN;

`;

  // Export data from each table
  for (const { name: actualTableName, table } of tablesToBackup) {
    try {
      
      // Get all rows from the table
      const rows = await db.select().from(table);
      
      if (rows.length === 0) {
        sqlContent += `-- Table: ${actualTableName} (empty)\n\n`;
        continue;
      }

      // Get column names
      const columns = Object.keys(rows[0]);
      
      sqlContent += `-- Table: ${actualTableName}\n`;
      sqlContent += `-- Rows: ${rows.length}\n\n`;
      
      // Generate INSERT statements
      for (const row of rows) {
        const values = columns.map((col) => {
          const value: unknown = row[col as keyof typeof row];
          
          if (value === null || value === undefined) {
            return "NULL";
          }
          
          if (typeof value === "string") {
            // Escape single quotes and wrap in quotes
            return `'${value.replace(/'/g, "''")}'`;
          }
          
          if (typeof value === "boolean") {
            return value ? "TRUE" : "FALSE";
          }
          
          if (value instanceof Date) {
            return `'${value.toISOString()}'`;
          }
          
          // For numbers and other types
          return String(value);
        });
        
        sqlContent += `INSERT INTO ${actualTableName} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
      }
      
      sqlContent += `\n`;
    } catch (error) {
      // Skip tables that can't be accessed (might be views or have issues)
      console.warn(`Skipping table ${actualTableName}:`, error);
      sqlContent += `-- Table: ${actualTableName} (skipped - error)\n\n`;
    }
  }

  sqlContent += `COMMIT;\n`;

  // Write to file
  await writeFile(filePath, sqlContent, "utf-8");
  
  // Get file size
  const { stat } = await import("fs/promises");
  const stats = await stat(filePath);
  const fileSize = stats.size;

  return {
    filePath,
    fileSize,
    filename,
  };
}

