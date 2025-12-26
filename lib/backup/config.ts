import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

/**
 * Get the backup directory path
 * Defaults to ./backups in the project root
 */
export function getBackupDir(): string {
  const backupDir = process.env.BACKUP_DIR || join(process.cwd(), "backups");
  return backupDir;
}

/**
 * Ensure the backup directory exists, create it if it doesn't
 */
export async function ensureBackupDir(): Promise<string> {
  const backupDir = getBackupDir();
  
  if (!existsSync(backupDir)) {
    await mkdir(backupDir, { recursive: true });
  }
  
  return backupDir;
}

/**
 * Generate a backup filename with timestamp
 * Format: backup_YYYY-MM-DD_HH-MM-SS.sql
 */
export function generateBackupFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  
  return `backup_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.sql`;
}

