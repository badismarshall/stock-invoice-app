import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/user/user-auth";
import { SalesStatsContent } from "./_components/sales-stats-content";
import { startOfYear } from "date-fns";

export const metadata: Metadata = {
  title: "État de Vente Local",
  description: "Statistiques détaillées des ventes locales",
};

export default async function SalesStatsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  return <SalesStatsContent />;
}

