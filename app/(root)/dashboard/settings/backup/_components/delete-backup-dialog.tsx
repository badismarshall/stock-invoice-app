"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

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

interface DeleteBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  backup: Backup | null;
}

export function DeleteBackupDialog({
  open,
  onOpenChange,
  onConfirm,
  backup,
}: DeleteBackupDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer le backup
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le backup{" "}
            <strong>{backup?.filename}</strong> ? Cette action est irréversible.
            Le fichier sera supprimé du serveur.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

