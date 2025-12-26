import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/data/user/user-auth"
import { Suspense } from "react"
import { BackupContent } from "./_components/backup-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Gestion des Backups",
  description: "Gérer les sauvegardes de la base de données",
}

async function BackupPageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return <BackupContent />
}

function BackupPageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function BackupPage() {
  return (
    <Suspense fallback={<BackupPageLoading />}>
      <BackupPageContent />
    </Suspense>
  );
}

