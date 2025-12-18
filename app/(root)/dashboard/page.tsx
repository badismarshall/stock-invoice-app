import { getCurrentUser } from "@/data/user/user-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { getDashboardStats } from "./_lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, Users, CreditCard } from "lucide-react";
import Link from "next/link";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }

  const stats = await getDashboardStats();
  
  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de votre activité
        </p>
      </div>

      <DashboardStatsCards stats={stats} />

      <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <Link href="/dashboard/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toutes les factures</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.sales.count + stats.purchases.count}
              </div>
              <p className="text-xs text-muted-foreground">
                Factures ce mois
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/stock">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.stock.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.stock.lowStockCount > 0 
                  ? `${stats.stock.lowStockCount} en rupture`
                  : "Stock optimal"
                }
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/clients-suppliers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.partners.clients + stats.partners.suppliers}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.partners.clients} clients, {stats.partners.suppliers} fournisseurs
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.payments.count}
              </div>
              <p className="text-xs text-muted-foreground">
                Paiements ce mois
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

export default function AdministratorDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
  
  