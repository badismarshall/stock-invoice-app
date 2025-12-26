"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Database, Download, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  createBackup, 
  getAllBackupsAction, 
  deleteBackup,
  getBackupFileContent 
} from "../_lib/actions"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Icons } from "@/components/ui/icons"
import { CreateBackupDialog } from "./create-backup-dialog"
import { DeleteBackupDialog } from "./delete-backup-dialog"

interface Backup {
  id: string;
  filename: string;
  filePath: string;
  fileSize: number;
  description: string | null;
  createdAt: Date;
  createdBy: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
}

export function BackupContent() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [backups, setBackups] = React.useState<Backup[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedBackup, setSelectedBackup] = React.useState<Backup | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  React.useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const result = await getAllBackupsAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setBackups(result.data);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors du chargement des backups"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async (description?: string) => {
    setCreating(true);
    try {
      const result = await createBackup({ description });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Backup créé avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
      setCreateDialogOpen(false);
      fetchBackups();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la création du backup",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const result = await getBackupFileContent(backup.id);
      if (result.error || !result.data) {
        toast.error(result.error || "Erreur lors du téléchargement");
        return;
      }

      // Create blob and download
      const blob = new Blob([result.data.content], { type: "application/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup téléchargé avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec du téléchargement",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;

    try {
      const result = await deleteBackup({ id: selectedBackup.id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Backup supprimé avec succès", {
        position: "bottom-center",
        duration: 3000,
      });
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
      fetchBackups();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de la suppression",
        {
          position: "bottom-center",
          duration: 3000,
        }
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Backups</h2>
          <p className="text-muted-foreground">
            Gérez les sauvegardes de votre base de données
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Générer un Backup
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            <Icons.spinner className="h-6 w-6 animate-spin mx-auto mb-2" />
            Chargement des backups...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun backup</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore créé de backup. Cliquez sur "Générer un Backup" pour commencer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Nom du fichier</th>
                  <th className="px-4 py-3">Taille</th>
                  <th className="px-4 py-3">Date de création</th>
                  <th className="px-4 py-3">Créé par</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {backups.map((backup) => (
                  <tr key={backup.id} className="text-card-foreground hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{backup.filename}</td>
                    <td className="px-4 py-3">{formatFileSize(backup.fileSize)}</td>
                    <td className="px-4 py-3">
                      {format(new Date(backup.createdAt), "PPP 'à' HH:mm", { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      {backup.createdByName || backup.createdByEmail || "Inconnu"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {backup.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(backup)}
                          className="h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateBackupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onConfirm={handleCreateBackup}
        loading={creating}
      />

      <DeleteBackupDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        backup={selectedBackup}
      />
    </div>
  );
}

