"use client"

import * as React from "react"
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddPartnerForm } from "./add-partner-form"

export function SupplierAddDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='space-x-1'
        >
          <Truck size={18} /> Nouveau Fournisseur
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <Truck /> Ajouter un nouveau fournisseur
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau fournisseur ici.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <AddPartnerForm 
          type="fournisseur"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

