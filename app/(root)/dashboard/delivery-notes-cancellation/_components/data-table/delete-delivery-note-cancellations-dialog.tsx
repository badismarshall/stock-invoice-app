"use client";

import type { Row } from "@tanstack/react-table";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DeliveryNoteCancellationDTOItem } from "@/data/delivery-note-cancellation/delivery-note-cancellation.dto";
import { deleteDeliveryNoteCancellation, deleteDeliveryNoteCancellations, getCancellationItemsForDelete, deleteCancellationItem } from "../../_lib/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

// French translations
const fr = {
  delete: "Supprimer",
  deleteMany: (n: number) => `Supprimer (${n})`,
  cancel: "Annuler",
  areYouSure: "Êtes-vous absolument sûr ?",
  cannotBeUndone: "Cette action est irréversible. Cela supprimera définitivement ",
  cancellation: "annulation de bon de livraison",
  cancellations: "annulations de bons de livraison",
  fromServer: " de nos serveurs.",
  success: "Annulation supprimée",
  successMany: "Annulations supprimées",
  error: "Erreur lors de la suppression",
  hasItems: "Cette annulation contient des produits qui seront également supprimés :",
  product: "Produit",
  quantity: "Quantité",
  unitPrice: "Prix unitaire",
  lineTotal: "Total ligne",
  noteNumber: "N° BL",
  loadingItems: "Chargement des produits...",
  deleteItem: "Supprimer",
  deleteItemConfirm: "Êtes-vous sûr de vouloir supprimer cet article ?",
  itemDeleted: "Article supprimé",
  actions: "Actions",
};

interface DeleteDeliveryNoteCancellationsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  cancellations: Row<DeliveryNoteCancellationDTOItem>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteDeliveryNoteCancellationsDialog({
  cancellations,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteDeliveryNoteCancellationsDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const [isLoadingItems, setIsLoadingItems] = React.useState(false);
  const [itemsMap, setItemsMap] = React.useState<Map<string, Array<{
    id: string;
    productId: string;
    productName: string | null;
    productCode: string | null;
    noteNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>>>(new Map());
  const [itemToDelete, setItemToDelete] = React.useState<{
    cancellationId: string;
    itemId: string;
    productName: string | null;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = React.useState(false);
  const isMobile = useIsMobile();

  // Load items when dialog opens
  React.useEffect(() => {
    if (props.open && cancellations.length > 0) {
      setIsLoadingItems(true);
      const loadItems = async () => {
        const newItemsMap = new Map();
        for (const cancellation of cancellations) {
          const { data, error } = await getCancellationItemsForDelete({ id: cancellation.id });
          if (!error && data) {
            newItemsMap.set(cancellation.id, data.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              noteNumber: item.noteNumber,
              quantity: item.cancelledQuantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })));
          }
        }
        setItemsMap(newItemsMap);
        setIsLoadingItems(false);
      };
      loadItems();
    } else if (!props.open) {
      // Reset items when dialog closes
      setItemsMap(new Map());
      setIsLoadingItems(false);
    }
  }, [props.open, cancellations]);

  function onDelete() {
    startDeleteTransition(async () => {
      if (cancellations.length === 1) {
        const { error } = await deleteDeliveryNoteCancellation({
          id: cancellations[0].id,
        });

        if (error) {
          toast.error(error);
          return;
        }

        props.onOpenChange?.(false);
        toast.success(fr.success);
        onSuccess?.();
      } else {
        const { error } = await deleteDeliveryNoteCancellations({
          ids: cancellations.map((cancellation) => cancellation.id),
        });

        if (error) {
          toast.error(error);
          return;
        }

        props.onOpenChange?.(false);
        toast.success(fr.successMany);
        onSuccess?.();
      }
    });
  }

  function onDeleteItem(cancellationId: string, item: { id: string; productId: string; productName: string | null; quantity: number }) {
    setItemToDelete({
      cancellationId,
      itemId: item.id,
      productName: item.productName,
    });
  }

  function confirmDeleteItem() {
    if (!itemToDelete) return;

    setIsDeletingItem(true);
    const item = Array.from(itemsMap.entries())
      .flatMap(([cancellationId, items]) => 
        items.map(item => ({ ...item, cancellationId }))
      )
      .find(i => i.id === itemToDelete.itemId);

    if (!item) {
      setIsDeletingItem(false);
      setItemToDelete(null);
      return;
    }

    startDeleteTransition(async () => {
      const { error } = await deleteCancellationItem({
        cancellationId: itemToDelete.cancellationId,
        itemId: itemToDelete.itemId,
        productId: item.productId,
        quantity: item.quantity,
      });

      if (error) {
        toast.error(error);
        setIsDeletingItem(false);
        setItemToDelete(null);
        return;
      }

      // Reload items
      setIsLoadingItems(true);
      const newItemsMap = new Map();
      for (const cancellation of cancellations) {
        const { data, error: fetchError } = await getCancellationItemsForDelete({ id: cancellation.id });
        if (!fetchError && data) {
          if (data.length > 0) {
            newItemsMap.set(cancellation.id, data.map(item => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              noteNumber: item.noteNumber,
              quantity: item.cancelledQuantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })));
          }
        }
      }
      setItemsMap(newItemsMap);
      setIsLoadingItems(false);
      setIsDeletingItem(false);
      setItemToDelete(null);
      toast.success(fr.itemDeleted);

      // If no items left, close the dialog and refresh
      if (newItemsMap.size === 0 || Array.from(newItemsMap.values()).every(items => items.length === 0)) {
        props.onOpenChange?.(false);
        onSuccess?.();
      }
    });
  }

  const cancellationCount = cancellations.length;
  const cancellationLabel =
    cancellationCount === 1
      ? `1 ${fr.cancellation}`
      : `${cancellationCount} ${fr.cancellations}`;

  const hasItems = Array.from(itemsMap.values()).some(items => items.length > 0);
  const totalItems = Array.from(itemsMap.values()).reduce((sum, items) => sum + items.length, 0);

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle>{fr.areYouSure}</DialogTitle>
        <DialogDescription>
          {fr.cannotBeUndone}
          <span className="font-medium">{cancellationLabel}</span>
          {fr.fromServer}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {isLoadingItems ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{fr.loadingItems}</p>
          </div>
        ) : hasItems ? (
          <>
            <p className="text-sm text-muted-foreground">{fr.hasItems}</p>
            <div className="rounded-md border max-h-[400px] overflow-hidden">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[100px]">{fr.noteNumber}</TableHead>
                      <TableHead className="min-w-[150px]">{fr.product}</TableHead>
                      <TableHead className="text-right min-w-[80px]">{fr.quantity}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{fr.unitPrice}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{fr.lineTotal}</TableHead>
                      <TableHead className="text-right w-[80px]">{fr.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(itemsMap.entries()).map(([cancellationId, items]) =>
                      items.map((item, index) => (
                        <TableRow key={`${cancellationId}-${index}`}>
                          <TableCell className="font-medium">{item.noteNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName || "-"}</div>
                              {item.productCode && (
                                <div className="text-xs text-muted-foreground">
                                  {item.productCode}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.lineTotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteItem(cancellationId, item)}
                              disabled={isDeletingItem}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </>
        ) : null}
      </div>
      <DialogFooter className="gap-2 sm:space-x-0">
        <DialogClose asChild>
          <Button variant="outline" disabled={isLoadingItems}>{fr.cancel}</Button>
        </DialogClose>
        <Button
          aria-label="Supprimer la sélection"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeletePending || isLoadingItems}
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
    </>
  );

  const drawerContent = (
    <>
      <DrawerHeader>
        <DrawerTitle>{fr.areYouSure}</DrawerTitle>
        <DrawerDescription>
          {fr.cannotBeUndone}
          <span className="font-medium">{cancellationLabel}</span>
          {fr.fromServer}
        </DrawerDescription>
      </DrawerHeader>
      <div className="space-y-4 px-4 py-4">
        {isLoadingItems ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{fr.loadingItems}</p>
          </div>
        ) : hasItems ? (
          <>
            <p className="text-sm text-muted-foreground">{fr.hasItems}</p>
            <div className="rounded-md border max-h-[400px] overflow-hidden">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[100px]">{fr.noteNumber}</TableHead>
                      <TableHead className="min-w-[150px]">{fr.product}</TableHead>
                      <TableHead className="text-right min-w-[80px]">{fr.quantity}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{fr.unitPrice}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{fr.lineTotal}</TableHead>
                      <TableHead className="text-right w-[80px]">{fr.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(itemsMap.entries()).map(([cancellationId, items]) =>
                      items.map((item, index) => (
                        <TableRow key={`${cancellationId}-${index}`}>
                          <TableCell className="font-medium">{item.noteNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName || "-"}</div>
                              {item.productCode && (
                                <div className="text-xs text-muted-foreground">
                                  {item.productCode}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.lineTotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteItem(cancellationId, item)}
                              disabled={isDeletingItem}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </>
        ) : null}
      </div>
      <DrawerFooter className="gap-2 sm:space-x-0">
        <DrawerClose asChild>
          <Button variant="outline" disabled={isLoadingItems}>{fr.cancel}</Button>
        </DrawerClose>
        <Button
          aria-label="Supprimer la sélection"
          variant="destructive"
          onClick={onDelete}
          disabled={isDeletePending || isLoadingItems}
        >
          {isDeletePending && (
            <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
          )}
          {fr.delete}
        </Button>
      </DrawerFooter>
    </>
  );

  return (
    <>
      {!isMobile ? (
        <Dialog {...props}>
          {showTrigger ? (
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash className="mr-2 size-4" aria-hidden="true" />
                {fr.deleteMany(cancellations.length)}
              </Button>
            </DialogTrigger>
          ) : null}
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            {dialogContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer {...props}>
          {showTrigger ? (
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash className="mr-2 size-4" aria-hidden="true" />
                {fr.deleteMany(cancellations.length)}
              </Button>
            </DrawerTrigger>
          ) : null}
          <DrawerContent className="max-h-[90vh] flex flex-col">
            {drawerContent}
          </DrawerContent>
        </Drawer>
      )}

      {/* Confirmation dialog for deleting a single item */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr.areYouSure}</DialogTitle>
            <DialogDescription>
              {fr.deleteItemConfirm}
              {itemToDelete && (
                <span className="font-medium block mt-2">
                  {itemToDelete?.productName || "Cet article"}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeletingItem}>{fr.cancel}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDeleteItem}
              disabled={isDeletingItem}
            >
              {isDeletingItem && (
                <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
              )}
              {fr.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

