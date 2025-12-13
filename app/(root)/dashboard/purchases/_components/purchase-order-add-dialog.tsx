"use client"

import * as React from "react"
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddPurchaseOrderForm } from "./add-purchase-order-form"

export function PurchaseOrderAddDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='space-x-1'
        >
          <ShoppingCart size={18} /> Nouveau Bon de Commande
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <ShoppingCart /> Ajouter un nouveau bon de commande
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau bon de commande ici.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <AddPurchaseOrderForm 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

