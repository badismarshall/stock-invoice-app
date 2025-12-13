import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers"
import SideBar from "./_components/sideBar/side-bar";
// import CustomerSidebar from "./customer/_components/customerSidebar";
import HeaderInsetSidebar from "./_components/sideBar/header-inset-sidebare";
import { Suspense } from "react";

async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SideBar />
      <SidebarInset className="px-2 pt-2">
        <HeaderInsetSidebar/>
        {/* <SidebarTrigger />	 */}  
        <div className="@container/main flex flex-1 flex-col gap-2 p-8 md:flex">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function SidebarWrapperFallback({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <SideBar />
      <SidebarInset className="px-2 pt-2">
        <HeaderInsetSidebar/>
        {/* <SidebarTrigger />	 */}  
        <div className="@container/main flex flex-1 flex-col gap-2 p-8 md:flex">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<SidebarWrapperFallback>{children}</SidebarWrapperFallback>}>
      <SidebarWrapper>{children}</SidebarWrapper>
    </Suspense>
  );
}
