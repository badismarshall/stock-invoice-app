import { getCurrentUser } from "@/data/user/user-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsCards } from "./_components/dashboard-stats-cards";
import { getDashboardStats } from "./_lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, Users, CreditCard, ShoppingBag, Globe, ArrowRight, Boxes, ShoppingCart, FileBarChart, Wallet, Truck, Settings } from "lucide-react";
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

            {/* Quick Access Section */}
            <div className="px-4 lg:px-6">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Accès rapide</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/dashboard/sales">
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Ventes Locales</CardTitle>
                      <CardDescription className="mt-1">
                        Gérez vos bons de livraison et factures locales
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{stats.sales.count} factures ce mois</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/export">
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-green-500/10 via-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Ventes Export</CardTitle>
                      <CardDescription className="mt-1">
                        Gérez vos factures proforma, bons de livraison et factures export
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Gestion complète des exportations</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Quick Access Modules Section */}
      <div className="px-4 lg:px-6">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Tous les modules</h2>
        <div className="grid gap-3 grid-cols-3">
          <Link href="/dashboard/products">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium">Produits</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/stock/current">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Boxes className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium">Stock</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/purchases">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium">Achats</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/invoices">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <FileBarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-medium">Facturation</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/payments">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium">Paiements</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/clients-suppliers">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-sm font-medium">Clients</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/clients-suppliers/suppliers">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium">Fournisseurs</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/users">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                  <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-sm font-medium">Utilisateurs</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/settings/company-settings">
            <Card className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-500/10 group-hover:bg-slate-500/20 transition-colors">
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <span className="text-sm font-medium">Paramètres</span>
              </CardContent>
            </Card>
          </Link>
        </div>
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
      <div className="px-4 lg:px-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-3 grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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
  
  