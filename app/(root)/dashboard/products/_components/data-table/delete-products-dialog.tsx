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
import type { ProductDTOItem } from "@/data/product/product.dto";

import { deleteProducts } from "../../_lib/actions";

// French translations
const fr = {
  delete: "Supprimer",
  deleteMany: (n: number) => `Supprimer (${n})`,
  cancel: "Annuler",
  areYouSure: "Êtes-vous absolument sûr ?",
  cannotBeUndone: "Cette action est irréversible. Cela supprimera définitivement ",
  product: "produit",
  products: "produits",
  fromServer: " de nos serveurs.",
  success: "Produits supprimés",
  error: "Erreur lors de la suppression",
};

interface DeleteProductsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  products: Row<ProductDTOItem>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteProductsDialog({
  products,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteProductsDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const isMobile = useIsMobile();

  function onDelete() {
    startDeleteTransition(async () => {
      const { error } = await deleteProducts({
        ids: products.map((product) => product.id),
      });

      if (error) {
        toast.error(fr.error);
        return;
      }

      props.onOpenChange?.(false);
      toast.success(fr.success);
      onSuccess?.();
    });
  }

  const productCount = products.length;
  const productLabel =
    productCount === 1
      ? `1 ${fr.product}`
      : `${productCount} ${fr.products}`;

  if (!isMobile) {
    return (
      <Dialog {...props}>
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash className="mr-2 size-4" aria-hidden="true" />
              {fr.deleteMany(products.length)}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr.areYouSure}</DialogTitle>
            <DialogDescription>
              {fr.cannotBeUndone}
              <span className="font-medium">{productLabel}</span>
              {fr.fromServer}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">{fr.cancel}</Button>
            </DialogClose>
            <Button
              aria-label="Supprimer la sélection"
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
      {showTrigger ? (
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash className="mr-2 size-4" aria-hidden="true" />
            {fr.deleteMany(products.length)}
          </Button>
        </DrawerTrigger>
      ) : null}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{fr.areYouSure}</DrawerTitle>
          <DrawerDescription>
            {fr.cannotBeUndone}
            <span className="font-medium">{productLabel}</span>
            {fr.fromServer}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 sm:space-x-0">
          <DrawerClose asChild>
            <Button variant="outline">{fr.cancel}</Button>
          </DrawerClose>
          <Button
            aria-label="Supprimer la sélection"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
            )}
            {fr.delete}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

