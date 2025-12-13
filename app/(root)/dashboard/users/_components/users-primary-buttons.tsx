"use client"

import { UsersAddDialog } from './users-add-dialog'

export function UsersPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      <UsersAddDialog />
    </div>
  )
}