"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { Shield } from "lucide-react";

export default function InitAdminRolePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleInit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/init-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'initialisation");
      }

      toast.success("Rôle admin initialisé avec succès!", {
        description: `${data.data.permissionCount} permissions assignées`,
      });

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
        router.push("/dashboard/roles");
      }, 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'initialisation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <CardTitle>Initialiser le rôle Administrateur</CardTitle>
          </div>
          <CardDescription>
            Ce script va créer un rôle administrateur avec toutes les permissions
            et l'assigner à votre compte utilisateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Ce qui sera fait :</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Créer toutes les permissions de base (achats, ventes, produits, etc.)</li>
              <li>Créer un rôle "admin" (Administrateur)</li>
              <li>Assigner toutes les permissions au rôle admin</li>
              <li>Assigner le rôle admin à votre compte utilisateur</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleInit}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Initialisation en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Initialiser le rôle Administrateur
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Cette action ne peut être effectuée qu'une seule fois. Si le rôle admin existe déjà,
            les permissions seront mises à jour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

