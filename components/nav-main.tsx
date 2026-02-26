import { type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    image?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <Collapsible key={item.title} asChild open>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title} size="lg">
                  <Link href={item.url} className="hover:underline">
                    {item.icon && <item.icon />}
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={36}
                        height={36}
                        className="brightness-[0.4] grayscale dark:filter-none"
                      />
                    )}
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild size="lg">
                            <Link href={subItem.url} className="hover:underline">
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
