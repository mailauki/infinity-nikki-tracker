'use client'
import { IconButton, Toolbar } from '@mui/material'
import { usePathname } from 'next/navigation'
import AdminViewToggle from './admin-view-toggle'
import { ChevronLeft } from '@mui/icons-material'

export default function AdminToggleToolbar() {
  const pathname = usePathname()
  const isAdminMainPage = pathname === '/admin'
  const isFormRoute = pathname.endsWith('/new') || pathname.includes('/edit/')

  return (
    !isAdminMainPage &&
    !isFormRoute && (
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <IconButton component="a" href="/admin">
          <ChevronLeft />
        </IconButton>
        <AdminViewToggle />
      </Toolbar>
    )
  )
}
