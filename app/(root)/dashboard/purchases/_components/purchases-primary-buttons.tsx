"use client"

import { PurchaseOrderAddDialog } from './purchase-order-add-dialog'

export function PurchasesPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      <PurchaseOrderAddDialog />
    </div>
  )
}

