import { Metadata } from "next"
import Link from "next/link"
import { SignUpUserForm } from "./_components/user-signup-form"
import { getCurrentUser } from "@/data/user/user-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Parcels - Authentification",
  description: "Creéz un compte pour accéder à votre espace personnel.",
}

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(`/dashboard/`);
  }
  return (
    <>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Créer un compte
              </h1>
              <p className="text-sm text-muted-foreground">
                Entrez vos coordonnées ci-dessous pour créer votre compte
              </p>
            </div>
           <SignUpUserForm/>
            <p className="px-8 text-center text-sm text-muted-foreground">
              En créant un compte, vous acceptez nos{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Conditions d&apos;utilisation
              </Link>{" "}
              et{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </div>
    </>
  )
}