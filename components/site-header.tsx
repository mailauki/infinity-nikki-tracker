'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb'

export function SiteHeader() {
  const pathname = usePathname()
  const path = pathname.split('/')
  const title = pathname === '/' ? 'home' : path[1]
  const slug = path.length > 2 ? path[2] : ''

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          {path.length > 2 ? (
            <BreadcrumbList>
              <BreadcrumbItem className="text-base font-medium capitalize">
                <BreadcrumbLink asChild>
                  <Link href={`/${title}`}>{title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-base font-medium capitalize">{slug.replace('-', ' ')}</BreadcrumbItem>
            </BreadcrumbList>
          ) : (
            <BreadcrumbList>
              <BreadcrumbItem className="text-base font-medium capitalize">{title}</BreadcrumbItem>
            </BreadcrumbList>
          )}
        </Breadcrumb>
      </div>
    </header>
  )
}
