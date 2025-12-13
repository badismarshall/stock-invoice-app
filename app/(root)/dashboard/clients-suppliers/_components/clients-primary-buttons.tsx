"use client"

import { ClientAddDialog } from './client-add-dialog'

export function ClientsPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      <ClientAddDialog />
    </div>
  )
}

