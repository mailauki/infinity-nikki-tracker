import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset className="">
				<SiteHeader />
				<div className="h-[calc(100vh-80px)] overflow-auto mt-2">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}