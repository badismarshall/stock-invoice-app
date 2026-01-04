"use client";

import type { Row } from "@tanstack/react-table";
import { FolderTree } from "lucide-react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateCategoryForm } from "../update-category-form";
import type { CategoryDTOItem } from "@/data/category/category.dto";

interface UpdateCategoryDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  category: Row<CategoryDTOItem>["original"];
  onSuccess?: () => void;
}

export function UpdateCategoryDialog({
  category,
  onSuccess,
  ...props
}: UpdateCategoryDialogProps) {
  const handleSuccess = React.useCallback(() => {
    props.onOpenChange?.(false);
    onSuccess?.();
  }, [props, onSuccess]);

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <FolderTree /> Modifier la catégorie
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de la catégorie.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <UpdateCategoryForm 
          category={category}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

