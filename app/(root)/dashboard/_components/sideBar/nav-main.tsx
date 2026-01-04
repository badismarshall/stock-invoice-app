"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useState, useEffect } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavMainProps = {
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  groupeLabel?: string;
};


function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: {
    title: string
    url?: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }
  pathname: string
}) {
  // Check if any sub-item matches the current pathname to keep collapsible open
  const hasActiveSubItem = item.items?.some(subItem => pathname === subItem.url) ?? false
  const [open, setOpen] = useState(hasActiveSubItem || item.isActive || false)

  // Update open state when pathname changes
  useEffect(() => {
    const hasActive = item.items?.some(subItem => pathname === subItem.url) ?? false
    if (hasActive) {
      setOpen(true)
    }
  }, [pathname, item.items])

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {item.title}
          </TooltipContent>
        </Tooltip>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => {
              // Check if current pathname matches the sub-item URL exactly or starts with it
              const isSubItemActive = pathname === subItem.url 
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                        <Link href={subItem.url} className="transition-colors hover:text-foreground">
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      align="center"
                    >
                      {subItem.title}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({
  items,
  groupeLabel
}: {
  items: {
    title: string
    url?: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[];
  groupeLabel : string
}) {

  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{ groupeLabel }</SidebarGroupLabel>
      <SidebarMenu >
        {items.map((item) => {

        // Check if current pathname matches the item URL exactly or starts with it
        const isActive = item.url ? (pathname === item.url) : false

        return (
            <div key={item.title}>
                {
                    (!item.items || item.items.length === 0 ) ? (
                        <Tooltip key={item.title}>
                          <TooltipTrigger asChild>
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton asChild isActive={isActive}>
                                <Link href={item.url || '#'} className="transition-colors hover:text-foreground">
                                  {item.icon && <item.icon />}    
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                    ) : (
                        <CollapsibleNavItem key={item.title} item={item} pathname={pathname} />
                    )   
                }
          </div>
        )})}
      </SidebarMenu>
    </SidebarGroup>
  )
}
