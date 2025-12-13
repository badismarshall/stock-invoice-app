'use client'

import Link from "next/link"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation";

export  default function HeaderInsetSidebar() {
    const pathname = usePathname()
    const pathNames = pathname
    .split('/')
    .filter(
        path => path && 
        path !== 'customer' && 
        path !== 'administrator')
    .filter(
        path => path &&
        path !== 'fr' &&
        path !== 'ar'
    );
    
  return (
        <header className="flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {            
                pathNames.map((path, index) => {
                const isActive = index === pathNames.length - 1
                return(
                    <Breadcrumb key={index} className="hidden md:flex">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="#">{path.charAt(0).toUpperCase() + path.slice(1)}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                        </BreadcrumbList>
                    </Breadcrumb>
                )
                })  
            }
            </div>
        </header>
  )
}

