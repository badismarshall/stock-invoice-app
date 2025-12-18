import { Metadata } from "next"
import { LoginUserAuthForm } from "./_components/user-signin-form"
import { getCurrentUser } from "@/data/user/user-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Code, AlertCircle } from "lucide-react";

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
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Bienvenue
              </h1>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <Code className="h-3 w-3 mr-1" />
                En développement
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Connectez-vous à votre compte pour accéder à votre espace personnel.
            </p>
          </div>
          
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Application en développement
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Cette application est actuellement en phase de développement. 
              Certaines fonctionnalités peuvent être incomplètes ou sujettes à des modifications.
            </AlertDescription>
          </Alert>

          <LoginUserAuthForm />
        </div>
      </div>
    </>
  )
}