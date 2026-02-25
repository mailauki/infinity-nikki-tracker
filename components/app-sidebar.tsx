import { ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { AuthButton } from './auth-button'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { ThemeSwitcher } from './theme-switcher'

const data = {
  navMain: [
    // {
    //   title: "Dashboard",
    //   url: "/dashboard",
    //   icon: LayoutDashboardIcon,
    // },
    {
      title: 'Eureka',
      url: '/eureka',
      image:
        'https://static.wikia.nocookie.net/infinity-nikki/images/5/56/Icon_Eureka.png/revision/latest?cb=20241222110118',
      items: [
        {
          title: 'Trials',
          url: '/eureka/trials',
        },
        {
          title: 'Missing',
          url: '/eureka/missing',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Infinity Nikki Wiki',
      url: 'https://infinity-nikki.fandom.com/',
      icon: ExternalLinkIcon,
    },
    {
      title: 'Infinity Nikki Official Website',
      url: 'https://infinitynikki.infoldgames.com/',
      icon: ExternalLinkIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/">
              <Image
                src="https://static.wikia.nocookie.net/infinity-nikki/images/e/e6/Site-logo.png/revision/latest?cb=20250212142911"
                alt="Infifity Nikki Logo"
                width={90}
                height={40}
                className="mx-2 mb-4 brightness-[0.4] drop-shadow-md grayscale dark:filter-none"
              />
            </Link>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/">Infinity Nikki Tracker</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="pb-4">
        <ThemeSwitcher />
        <React.Suspense>
          <AuthButton />
        </React.Suspense>
      </SidebarFooter>
    </Sidebar>
  )
}
