"use client";

import { FileDown, Plus } from "lucide-react";
import { PermissionButton } from "@/components/shared/permission-button";

export function PurchasesPageButtons() {
  return (
    <div className="flex items-center gap-2">
      <PermissionButton
        permission="purchases.export"
        href="/dashboard/purchases/export/pdf"
        variant="outline"
      >
        <FileDown className="mr-2 h-4 w-4" />
        Exporter en PDF
      </PermissionButton>
      <PermissionButton
        permission="purchases.export"
        href="/dashboard/purchases/export/xlsx"
        variant="outline"
      >
        <FileDown className="mr-2 h-4 w-4" />
        Exporter en XLSX
      </PermissionButton>
      <PermissionButton
        permission="purchases.create"
        href="/dashboard/purchases/new"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nouvel Achat
      </PermissionButton>
    </div>
  );
}

