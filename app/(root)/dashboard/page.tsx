import { ChartAreaInteractive } from "./_components/dashboardTestComponets/ChartAreaInteractive";
import { SectionCards } from "./_components/dashboardTestComponets/section-cards";
import { getCurrentUser } from "@/data/user/user-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in`);
  }
  
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      {/* <DataTable data={data} /> */}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <Skeleton className="h-96" />
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
  
  