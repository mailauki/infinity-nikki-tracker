import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
		image?: string
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
							<SidebarMenuButton tooltip={item.title} className={item.image && "h-fit"} asChild>
								<Link href={item.url}>
									{item.icon && <item.icon />}
									{item.image && <Image
										src={item.image}
										alt={item.title}
										width={36}
										height={36}
										className="grayscale brightness-[0.4] dark:filter-none"
									/> }
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
