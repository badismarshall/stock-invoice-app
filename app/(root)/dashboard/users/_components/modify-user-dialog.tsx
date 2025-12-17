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
import { ModifyUserForm } from "./modify-user-form"
import { getUserById } from "../_lib/actions"
import { Icons } from "@/components/ui/icons"

interface ModifyUserDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ModifyUserDialog({ userId, open, onOpenChange, onSuccess }: ModifyUserDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<{
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    banned: boolean;
    createdAt: Date;
  } | null>(null);

  React.useEffect(() => {
    if (open && userId) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const result = await getUserById({ id: userId });
          if (result.data) {
            setUser(result.data);
          } else if (result.error) {
            console.error("Error fetching user", result.error);
          }
        } catch (error) {
          console.error("Error fetching user", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setUser(null);
    }
  }, [open, userId]);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil /> Modifier l&apos;utilisateur
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;utilisateur.
            Cliquez sur modifier lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          <ModifyUserForm 
            user={user}
            onSuccess={handleSuccess}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Utilisateur non trouvé
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

