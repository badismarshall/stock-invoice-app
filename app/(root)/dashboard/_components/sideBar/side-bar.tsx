'use client'

import { useEffect, useState } from "react";
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarMenu } from "@/components/ui/sidebar";
import { AppSidebar } from "../../_components/sideBar/app-sidebar";
import { adminSidebarItemsGeneralSetting } from "../../_constants/sidebaritems";
import { NavMain } from "../../_components/sideBar/nav-main";
import {
    Sidebar,
  } from "@/components/ui/sidebar"
import { NavUser } from "./nav-user";
import { getCurrentUser } from "@/data/user/user-auth-client";

export default function SideBar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getCurrentUser();
            if (userData) {
                setUser(userData);
            }
        };
        fetchUser();
    }, []);

    return (
        <AppSidebar {...props}>
            <SidebarContent>
                    <SidebarMenu>
                        <NavMain items={adminSidebarItemsGeneralSetting} groupeLabel="Paramètres généraux"/>
                    </SidebarMenu>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter>
                {user && (
                    <NavUser user={{
                        name: user.name,
                        email: user.email,
                    }} />
                )}
            </SidebarFooter>
        </AppSidebar>
    )
}
