"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
            >
							<div className="pl-2.5">
								{theme === "light" ? (
									<Sun
										key="light"
										size={ICON_SIZE}
										className={"text-muted-foreground"}
									/>
								) : theme === "dark" ? (
									<Moon
										key="dark"
										size={ICON_SIZE}
										className={"text-muted-foreground"}
									/>
								) : (
									<Laptop
										key="system"
										size={ICON_SIZE}
										className={"text-muted-foreground"}
									/>
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="capitalize">{theme}</span>
							</div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-content"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
						<DropdownMenuRadioGroup
							value={theme}
							onValueChange={(e) => setTheme(e)}
						>
							<DropdownMenuRadioItem className="flex gap-2" value="light">
								<Sun size={ICON_SIZE} className="text-muted-foreground" />{" "}
								<span>Light</span>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem className="flex gap-2" value="dark">
								<Moon size={ICON_SIZE} className="text-muted-foreground" />{" "}
								<span>Dark</span>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem className="flex gap-2" value="system">
								<Laptop size={ICON_SIZE} className="text-muted-foreground" />{" "}
								<span>System</span>
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
  );
};

export { ThemeSwitcher };
