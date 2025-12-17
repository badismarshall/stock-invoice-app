"use client"

import * as React from "react"
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ModifyPartnerForm } from "./modify-partner-form"
import { getPartnerById } from "../_lib/actions"
import { Icons } from "@/components/ui/icons"

interface ModifyPartnerDialogProps {
  partnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ModifyPartnerDialog({ partnerId, open, onOpenChange, onSuccess }: ModifyPartnerDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [partner, setPartner] = React.useState<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    credit: string | null;
    nif: string | null;
    rc: string | null;
    type: string;
  } | null>(null);

  React.useEffect(() => {
    if (open && partnerId) {
      const fetchPartner = async () => {
        setLoading(true);
        try {
          const result = await getPartnerById({ id: partnerId });
          if (result.data) {
            setPartner(result.data);
          } else if (result.error) {
            console.error("Error fetching partner", result.error);
          }
        } catch (error) {
          console.error("Error fetching partner", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPartner();
    } else {
      setPartner(null);
    }
  }, [open, partnerId]);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil /> Modifier {partner?.type === "client" ? "le client" : "le fournisseur"}
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du {partner?.type === "client" ? "client" : "fournisseur"}.
            Cliquez sur modifier lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : partner ? (
          <ModifyPartnerForm 
            partner={partner}
            onSuccess={handleSuccess}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Partenaire non trouvé
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

