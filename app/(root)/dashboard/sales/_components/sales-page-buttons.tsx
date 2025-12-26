"use client";

import { FileDown, Plus } from "lucide-react";
import { PermissionButton } from "@/components/shared/permission-button";

export function SalesPageButtons() {
  return (
    <div className="flex items-center gap-2">
      <PermissionButton
        permission="sales.export"
        href="/dashboard/sales/export/pdf"
        variant="outline"
      >
        <FileDown className="mr-2 h-4 w-4" />
        Exporter en PDF
      </PermissionButton>
      <PermissionButton
        permission="sales.export"
        href="/dashboard/sales/export/xlsx"
        variant="outline"
      >
        <FileDown className="mr-2 h-4 w-4" />
        Exporter en XLSX
      </PermissionButton>
      <PermissionButton
        permission="sales.create"
        href="/dashboard/sales/new"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nouveau Bon de Livraison
      </PermissionButton>
    </div>
  );
}

