import 'server-only'

import db from '@/db'
import { backup, user } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getErrorMessage } from '@/lib/handle-error'

/**
 * Create a backup record in the database
 */
export async function createBackupRecord(data: {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  description?: string | null;
  createdBy: string | null;
}) {
  try {
    const [newBackup] = await db
      .insert(backup)
      .values({
        id: data.id,
        filename: data.filename,
        filePath: data.filePath,
        fileSize: data.fileSize.toString(),
        description: data.description || null,
        createdBy: data.createdBy,
      })
      .returning();

    return {
      data: newBackup,
      error: null,
    };
  } catch (err) {
    console.error("Error creating backup record", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all backups ordered by creation date (newest first)
 */
export async function getAllBackups() {
  try {
    const backups = await db
      .select({
        backup: backup,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(backup)
      .leftJoin(user, eq(backup.createdBy, user.id))
      .orderBy(desc(backup.createdAt));

    const backupsWithCreator = backups.map((item) => ({
      id: item.backup.id,
      filename: item.backup.filename,
      filePath: item.backup.filePath,
      fileSize: item.backup.fileSize ? parseFloat(item.backup.fileSize) : 0,
      description: item.backup.description,
      createdAt: item.backup.createdAt,
      createdBy: item.backup.createdBy,
      createdByName: item.creator?.name || null,
      createdByEmail: item.creator?.email || null,
    }));

    return {
      data: backupsWithCreator,
      error: null,
    };
  } catch (err) {
    console.error("Error getting all backups", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get a backup by ID
 */
export async function getBackupById(id: string) {
  try {
    const [backupData] = await db
      .select({
        backup: backup,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(backup)
      .leftJoin(user, eq(backup.createdBy, user.id))
      .where(eq(backup.id, id))
      .limit(1);

    if (!backupData) {
      return {
        data: null,
        error: "Backup non trouvé",
      };
    }

    return {
      data: {
        id: backupData.backup.id,
        filename: backupData.backup.filename,
        filePath: backupData.backup.filePath,
        fileSize: backupData.backup.fileSize ? parseFloat(backupData.backup.fileSize) : 0,
        description: backupData.backup.description,
        createdAt: backupData.backup.createdAt,
        createdBy: backupData.backup.createdBy,
        createdByName: backupData.creator?.name || null,
        createdByEmail: backupData.creator?.email || null,
      },
      error: null,
    };
  } catch (err) {
    console.error("Error getting backup by id", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a backup record from the database
 */
export async function deleteBackupRecord(id: string) {
  try {
    await db.delete(backup).where(eq(backup.id, id));

    return {
      data: { id },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting backup record", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

