"use client"

import * as React from "react"
import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddCategoryForm } from "./add-category-form"

export function CategoryAddDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='space-x-1'
        >
          <FolderPlus size={18} /> Nouvelle Catégorie
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <FolderPlus /> Ajouter une nouvelle catégorie
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle catégorie de produits ici.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <AddCategoryForm 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

