"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateRoleDialog } from "./create-role-dialog";

export function RolesPrimaryButtons() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Créer un rôle
      </Button>
      <CreateRoleDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

