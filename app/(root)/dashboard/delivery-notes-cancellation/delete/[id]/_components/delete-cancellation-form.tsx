"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DeleteCancellationItemsTable } from "./delete-cancellation-items-table";

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
  const [itemsToDelete, setItemsToDelete] = React.useState<Array<{ id: string; productName: string | null }>>([]);
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

  const handleDeleteItem = React.useCallback((item: { id: string; productName: string | null }) => {
    setItemsToDelete([item]);
  }, []);

  const handleDeleteItems = React.useCallback(async (itemIds: string[]) => {
    setIsDeletingItem(true);
    
    try {
      // Delete items one by one
      for (const itemId of itemIds) {
        const item = items.find(i => i.id === itemId);
        if (!item) continue;

        const { error } = await deleteCancellationItem({
          cancellationId: cancellation.id,
          itemId: item.id,
          productId: item.productId,
          quantity: item.cancelledQuantity,
        });

        if (error) {
          toast.error(error);
          setIsDeletingItem(false);
          return;
        }
      }

      // Reload items
      const { data, error: fetchError } = await getCancellationItemsForDelete({ id: cancellation.id });
      if (!fetchError && data) {
        setItems(data);
        if (data.length === 0) {
          // No items left, redirect back
          toast.success(translations.cancellationDeleted);
          router.push("/dashboard/delivery-notes-cancellation");
          router.refresh();
        } else {
          toast.success(itemIds.length === 1 ? translations.itemDeleted : `${itemIds.length} articles supprimés`);
        }
      }
    } finally {
      setIsDeletingItem(false);
      setItemsToDelete([]);
    }
  }, [cancellation.id, items, router]);

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
              <DeleteCancellationItemsTable 
                items={items}
                cancellationId={cancellation.id}
                onDeleteItem={handleDeleteItem}
                onDeleteItems={handleDeleteItems}
                onDeleteAll={() => setShowDeleteAllDialog(true)}
                isDeleting={isDeletingItem || isDeletingAll}
                onItemsChange={setItems}
                onRedirect={() => {
                  router.push("/dashboard/delivery-notes-cancellation");
                  router.refresh();
                }}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4">{translations.noItems}</p>
          )}

        </CardContent>
      </Card>

      {/* Delete items confirmation dialog */}
      <AlertDialog open={itemsToDelete.length > 0} onOpenChange={(open) => !open && setItemsToDelete([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.areYouSure}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemsToDelete.length === 1 
                ? translations.deleteItemConfirm
                : `Êtes-vous sûr de vouloir supprimer ${itemsToDelete.length} articles ?`}
              {itemsToDelete.length > 0 && (
                <span className="font-medium block mt-2">
                  {itemsToDelete.length === 1 
                    ? itemsToDelete[0].productName || "Cet article"
                    : `${itemsToDelete.length} articles`}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingItem}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const itemIds = itemsToDelete.map(item => item.id);
                handleDeleteItems(itemIds);
              }}
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

