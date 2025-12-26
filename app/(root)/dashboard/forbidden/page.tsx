import { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accès refusé",
  description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page",
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
        <h1 className="text-3xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground max-w-md">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <Link href="/dashboard">
          <Button>Retour au tableau de bord</Button>
        </Link>
      </div>
    </div>
  );
}

