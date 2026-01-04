"use client";

import type { Row } from "@tanstack/react-table";
import { Ruler } from "lucide-react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateUnitOfMeasureForm } from "../update-unit-of-measure-form";
import type { UnitOfMeasureDTOItem } from "@/data/unit-of-measure/unit-of-measure.dto";

interface UpdateUnitOfMeasureDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  unitOfMeasure: Row<UnitOfMeasureDTOItem>["original"];
  onSuccess?: () => void;
}

export function UpdateUnitOfMeasureDialog({
  unitOfMeasure,
  onSuccess,
  ...props
}: UpdateUnitOfMeasureDialogProps) {
  const handleSuccess = React.useCallback(() => {
    props.onOpenChange?.(false);
    onSuccess?.();
  }, [props, onSuccess]);

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2">
            <Ruler /> Modifier l'unité de mesure
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'unité de mesure.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <UpdateUnitOfMeasureForm 
          unitOfMeasure={unitOfMeasure}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

