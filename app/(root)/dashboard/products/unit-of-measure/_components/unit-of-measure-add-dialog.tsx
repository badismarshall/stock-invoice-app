"use client"

import * as React from "react"
import { Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddUnitOfMeasureForm } from "./add-unit-of-measure-form"

export function UnitOfMeasureAddDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='space-x-1'
        >
          <Ruler size={18} /> Nouvelle Unité
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <Ruler /> Ajouter une nouvelle unité de mesure
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle unité de mesure ici.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <AddUnitOfMeasureForm 
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

