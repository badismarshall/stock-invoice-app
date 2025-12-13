import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarMenu,
  } from "@/components/ui/sidebar"
import { NavUser } from "./nav-user";
  
  export function AppSidebar({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    const user = {
      name: "Marshall",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    }
    return (
      <Sidebar collapsible="icon" variant="inset">
        {children}
      </Sidebar>
    )
  }
  