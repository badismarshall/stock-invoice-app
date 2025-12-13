"use client"

import * as React from "react"
import { UserPlus } from 'lucide-react'
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

export function ClientAddDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='default'
          className='space-x-1'
        >
          <UserPlus size={18} /> Nouveau Client
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus /> Ajouter un nouveau client
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau client ici.
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <AddPartnerForm 
          type="client"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

