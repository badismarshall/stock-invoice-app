"use server";

import { getCurrentUser } from "@/data/user/user-auth";
import { generateId } from "@/lib/data-table/id";
import { generateDatabaseBackup } from "@/lib/backup/generator";
import {
  createBackupRecord,
  getAllBackups,
  getBackupById,
  deleteBackupRecord,
} from "@/data/backup/backup.dal";
import { getErrorMessage } from "@/lib/handle-error";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { updateTag } from "next/cache";

/**
 * Create a new database backup
 */
export async function createBackup(input?: { description?: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Generate the backup file
    const { filePath, fileSize, filename } = await generateDatabaseBackup();

    // Create backup record in database
    const backupId = generateId();
    const backupResult = await createBackupRecord({
      id: backupId,
      filename,
      filePath,
      fileSize,
      description: input?.description || null,
      createdBy: user.id,
    });

    if (backupResult.error) {
      // If database insert fails, try to delete the file
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (unlinkError) {
        console.error("Error deleting backup file after failed insert", unlinkError);
      }
      
      return {
        data: null,
        error: backupResult.error,
      };
    }

    updateTag("backups");

    return {
      data: {
        id: backupId,
        filename,
        fileSize,
        createdAt: backupResult.data?.createdAt || new Date(),
      },
      error: null,
    };
  } catch (err) {
    console.error("Error creating backup", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get all backups
 */
export async function getAllBackupsAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    const result = await getAllBackups();
    return result;
  } catch (err) {
    console.error("Error getting all backups", err);
    return {
      data: [],
      error: getErrorMessage(err),
    };
  }
}

/**
 * Get backup file content for download
 */
export async function getBackupFileContent(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    const backupResult = await getBackupById(id);
    if (backupResult.error || !backupResult.data) {
      return {
        data: null,
        error: backupResult.error || "Backup non trouvé",
      };
    }

    const backup = backupResult.data;

    // Check if file exists
    if (!existsSync(backup.filePath)) {
      return {
        data: null,
        error: "Le fichier de backup n'existe plus sur le serveur",
      };
    }

    // Read file content
    const fileContent = await readFile(backup.filePath, "utf-8");

    return {
      data: {
        content: fileContent,
        filename: backup.filename,
        fileSize: backup.fileSize,
      },
      error: null,
    };
  } catch (err) {
    console.error("Error getting backup file content", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(input: { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        data: null,
        error: "Utilisateur non authentifié",
      };
    }

    // Get backup info first to get file path
    const backupResult = await getBackupById(input.id);
    if (backupResult.error || !backupResult.data) {
      return {
        data: null,
        error: backupResult.error || "Backup non trouvé",
      };
    }

    const backup = backupResult.data;

    // Delete the file if it exists
    if (existsSync(backup.filePath)) {
      try {
        await unlink(backup.filePath);
      } catch (unlinkError) {
        console.error("Error deleting backup file", unlinkError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the database record
    const deleteResult = await deleteBackupRecord(input.id);
    if (deleteResult.error) {
      return {
        data: null,
        error: deleteResult.error,
      };
    }

    updateTag("backups");

    return {
      data: { id: input.id },
      error: null,
    };
  } catch (err) {
    console.error("Error deleting backup", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

