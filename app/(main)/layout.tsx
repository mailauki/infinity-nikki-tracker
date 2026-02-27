import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AppBar from '@mui/material/AppBar'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Link from 'next/link'
import Image from 'next/image'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import NavDrawer from '@/components/nav-drawer'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <NavDrawer>
      <SiteHeader />
      <div className="h-[calc(100vh-192px)] overflow-y-auto">
        <Box sx={{ flexGrow: 1, p: 3 }}>{children}</Box>
      </div>
    </NavDrawer>
  )
}
