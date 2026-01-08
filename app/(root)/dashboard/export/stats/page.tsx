import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { ExportStatsContent } from "./_components/export-stats-content";

export const metadata: Metadata = {
  title: "État de Vente Export",
  description: "Statistiques détaillées des ventes export",
};

export default async function ExportStatsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return <ExportStatsContent />;
}

