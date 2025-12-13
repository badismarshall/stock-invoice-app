"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { authClient } from "@/lib/auth-client";
import { AlertCircle, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";

interface SignOutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
  }

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
    const [loading, setLoading] = useState(false);

    async function handleSignOut() {
        await authClient.signOut({
            fetchOptions: {
                onRequest: (ctx: any) => {
                    setLoading(true);
                },
                onResponse: (ctx: any) => {
                    setLoading(false);
                },
            },
        });
        redirect(`/sign-in`);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="size-5 text-amber-500" />
                        <DialogTitle>Déconnexion</DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription>
                    Êtes-vous sûr de vouloir vous déconnecter&nbsp;?
                </DialogDescription>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button
                        disabled={loading}
                        variant="destructive" 
                        onClick={ handleSignOut }
                    >
                        {
                            loading ? 
                            (<Icons.spinner className="h-4 w-4 animate-spin" />) 
                            : (
                            <>
                                <LogOut className="w-4 h-4" />
                                Se déconnecter
                            </>
                            )
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}