"use client";

import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { InvoiceDTOItem } from "@/data/invoice/invoice.dto";
import { deleteProformaInvoice } from "../../_lib/actions";

// French translations
const fr = {
  delete: "Supprimer",
  cancel: "Annuler",
  areYouSure: "Êtes-vous absolument sûr ?",
  cannotBeUndone: "Cette action est irréversible. Cela supprimera définitivement la facture proforma ",
  fromServer: " du serveur.",
  success: "Facture proforma supprimée",
  error: "Erreur lors de la suppression",
};

interface DeleteProformaInvoiceDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  invoice: Row<InvoiceDTOItem>["original"] | null;
  onSuccess?: () => void;
}

export function DeleteProformaInvoiceDialog({
  invoice,
  onSuccess,
  ...props
}: DeleteProformaInvoiceDialogProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isDeletePending, startDeleteTransition] = React.useTransition();

  function onDelete() {
    if (!invoice) return;

    startDeleteTransition(async () => {
      const { error } = await deleteProformaInvoice({
        id: invoice.id,
      });

      if (error) {
        toast.error(`${fr.error}: ${error}`);
        return;
      }

      props.onOpenChange?.(false);
      toast.success(fr.success);
      router.refresh();
      onSuccess?.();
    });
  }

  if (!invoice) return null;

  if (!isMobile) {
    return (
      <Dialog {...props}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr.areYouSure}</DialogTitle>
            <DialogDescription>
              {fr.cannotBeUndone}
              <span className="font-medium">{invoice.invoiceNumber}</span>
              {fr.fromServer}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">{fr.cancel}</Button>
            </DialogClose>
            <Button
              aria-label="Supprimer la facture"
              variant="destructive"
              onClick={onDelete}
              disabled={isDeletePending}
            >
              {isDeletePending && (
                <Loader
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {fr.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer {...props}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{fr.areYouSure}</DrawerTitle>
          <DrawerDescription>
            {fr.cannotBeUndone}
            <span className="font-medium">{invoice.invoiceNumber}</span>
            {fr.fromServer}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2">
          <DrawerClose asChild>
            <Button variant="outline">{fr.cancel}</Button>
          </DrawerClose>
          <Button
            aria-label="Supprimer la facture"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {fr.delete}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

