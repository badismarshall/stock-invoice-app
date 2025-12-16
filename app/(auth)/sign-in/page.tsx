import { Metadata } from "next"
import { LoginUserAuthForm } from "./_components/user-signin-form"
import { getCurrentUser } from "@/data/user/user-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sirof - Authentification",
  description: "Creéz un compte pour accéder à votre espace personnel.",
}

async function AuthCheck() {
  const user = await getCurrentUser();
  if (user) {
    redirect(`/dashboard`);
  }
  return null;
}

export default function SignInPage() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthCheck />
      </Suspense>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenue
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous à votre compte pour accéder à votre espace personnel.
            </p>
          </div>
          <LoginUserAuthForm />
        </div>
      </div>
    </>
  )
}