"use client"

import * as React from "react"
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddProductForm } from "./add-product-form"

export function ProductAddDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='space-x-1'
        >
          <PackagePlus size={18} /> Nouveau Produit
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <PackagePlus /> Ajouter un nouveau produit
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau produit ici.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <AddProductForm 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

