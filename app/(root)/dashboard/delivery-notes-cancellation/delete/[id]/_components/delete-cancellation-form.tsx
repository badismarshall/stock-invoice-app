"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteDeliveryNoteCancellation, deleteCancellationItem, getCancellationItemsForDelete } from "../../../_lib/actions";

interface DeleteCancellationFormProps {
  cancellation: {
    id: string;
    cancellationNumber: string;
    originalDeliveryNoteId: string | null;
    clientId: string | null;
    cancellationDate: Date;
    reason: string | null;
    createdBy: string | null;
    createdByName: string | null;
    createdAt: Date;
    client: {
      id: string;
      name: string;
    } | null;
    items: Array<{
      id: string;
      productId: string;
      productName: string | null;
      productCode: string | null;
      noteNumber: string;
      cancelledQuantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  };
}

const translations = {
  back: "Retour",
  title: "Supprimer l'annulation",
  description: "Cette action est irréversible. Vous pouvez supprimer les articles individuellement ou supprimer toute l'annulation.",
  hasItems: "Cette annulation contient les produits suivants :",
  noteNumber: "N° BL",
  product: "Produit",
  quantity: "Quantité",
  unitPrice: "Prix unitaire",
  lineTotal: "Total ligne",
  actions: "Actions",
  deleteItem: "Supprimer",
  deleteAll: "Supprimer toute l'annulation",
  areYouSure: "Êtes-vous absolument sûr ?",
  deleteItemConfirm: "Êtes-vous sûr de vouloir supprimer cet article ?",
  deleteAllConfirm: "Êtes-vous sûr de vouloir supprimer toute cette annulation ?",
  itemDeleted: "Article supprimé",
  cancellationDeleted: "Annulation supprimée",
  error: "Erreur lors de la suppression",
  loadingItems: "Chargement des produits...",
  noItems: "Cette annulation ne contient aucun produit.",
};

export function DeleteCancellationForm({ cancellation }: DeleteCancellationFormProps) {
  const router = useRouter();
  const [isLoadingItems, setIsLoadingItems] = React.useState(false);
  const [items, setItems] = React.useState(cancellation.items);
  const [itemToDelete, setItemToDelete] = React.useState<{ id: string; productName: string | null } | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = React.useState(false);
  const [isDeletingItem, setIsDeletingItem] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);

  // Load items on mount
  React.useEffect(() => {
    const loadItems = async () => {
      setIsLoadingItems(true);
      const { data, error } = await getCancellationItemsForDelete({ id: cancellation.id });
      if (!error && data) {
        setItems(data);
      }
      setIsLoadingItems(false);
    };
    loadItems();
  }, [cancellation.id]);

  function handleDeleteItem() {
    if (!itemToDelete) return;

    setIsDeletingItem(true);
    const item = items.find(i => i.id === itemToDelete.id);
    if (!item) {
      setIsDeletingItem(false);
      setItemToDelete(null);
      return;
    }

    deleteCancellationItem({
      cancellationId: cancellation.id,
      itemId: item.id,
      productId: item.productId,
      quantity: item.cancelledQuantity,
    }).then(({ error }) => {
      if (error) {
        toast.error(error);
        setIsDeletingItem(false);
        setItemToDelete(null);
        return;
      }

      // Reload items
      getCancellationItemsForDelete({ id: cancellation.id }).then(({ data, error: fetchError }) => {
        if (!fetchError && data) {
          setItems(data);
          if (data.length === 0) {
            // No items left, redirect back
            toast.success(translations.cancellationDeleted);
            router.push("/dashboard/delivery-notes-cancellation");
            router.refresh();
          } else {
            toast.success(translations.itemDeleted);
          }
        }
        setIsDeletingItem(false);
        setItemToDelete(null);
      });
    });
  }

  function handleDeleteAll() {
    setIsDeletingAll(true);
    deleteDeliveryNoteCancellation({ id: cancellation.id }).then(({ error }) => {
      if (error) {
        toast.error(error);
        setIsDeletingAll(false);
        setShowDeleteAllDialog(false);
        return;
      }

      toast.success(translations.cancellationDeleted);
      router.push("/dashboard/delivery-notes-cancellation");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{translations.title}</h1>
            <p className="text-muted-foreground">
              {cancellation.cancellationNumber}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de l'annulation</CardTitle>
          <CardDescription>{translations.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingItems ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{translations.loadingItems}</p>
            </div>
          ) : items.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">{translations.hasItems}</p>
              <div className="rounded-md border">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[100px]">{translations.noteNumber}</TableHead>
                        <TableHead className="min-w-[150px]">{translations.product}</TableHead>
                        <TableHead className="text-right min-w-[80px]">{translations.quantity}</TableHead>
                        <TableHead className="text-right min-w-[100px]">{translations.unitPrice}</TableHead>
                        <TableHead className="text-right min-w-[100px]">{translations.lineTotal}</TableHead>
                        <TableHead className="text-right w-[80px]">{translations.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
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
                          <TableCell className="text-right">{item.cancelledQuantity.toFixed(3)}</TableCell>
                          <TableCell className="text-right">{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.lineTotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemToDelete({ id: item.id, productName: item.productName })}
                              disabled={isDeletingItem || isDeletingAll}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4">{translations.noItems}</p>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={isDeletingItem || isDeletingAll || items.length === 0}
            >
              {isDeletingAll && (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              )}
              {translations.deleteAll}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete item confirmation dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteItemConfirm}
              {itemToDelete && (
                <span className="font-medium block mt-2">
                  {itemToDelete.productName || "Cet article"}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingItem}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={isDeletingItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingItem && (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              )}
              {translations.deleteItem}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all confirmation dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteAllConfirm}
              <span className="font-medium block mt-2">
                {cancellation.cancellationNumber}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAll && (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              )}
              {translations.deleteAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

