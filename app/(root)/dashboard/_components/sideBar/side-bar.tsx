'use client'

import { SidebarContent, SidebarFooter, SidebarGroup, SidebarMenu, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "../../_components/sideBar/app-sidebar";
import { adminSidebarItemsGeneralSetting } from "../../_constants/sidebaritems";
import { NavMain } from "../../_components/sideBar/nav-main";
import {
    Sidebar,
  } from "@/components/ui/sidebar"
import { NavUserWrapper } from "./nav-user-wrapper";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function SideBar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { state } = useSidebar();

    return (
        <AppSidebar {...props}>
            <SidebarHeader className="flex items-center justify-center border-b border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
                <div className="relative w-full flex items-center justify-center min-h-[40px] group-data-[collapsible=icon]:min-h-[32px]">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={40}
                        className={cn(
                            "object-contain transition-all duration-200 ease-in-out",
                            "w-[120px] h-[40px] max-w-full",
                            "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
                        )}
                        priority
                        unoptimized
                    />
                </div>
            </SidebarHeader>
            <SidebarContent>
                    <SidebarMenu>
                        <NavMain items={adminSidebarItemsGeneralSetting} groupeLabel="Paramètres généraux"/>
                    </SidebarMenu>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter>
                <NavUserWrapper />
            </SidebarFooter>
        </AppSidebar>
    )
}
