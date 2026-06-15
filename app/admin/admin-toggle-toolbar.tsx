'use client'
import { IconButton, Stack, Toolbar } from '@mui/material'
import { usePathname } from 'next/navigation'
import AdminViewToggle from './admin-view-toggle'
import AdminVariantColumnsToggle from './admin-variant-columns-toggle'
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
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          <AdminVariantColumnsToggle />
          <AdminViewToggle />
        </Stack>
      </Toolbar>
    )
  )
}
