'use client'

import ToolbarSlot from '@/components/toolbar-slot'
import { Stack } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useFormConfig } from '@/app/admin/form-context'
import AdminNavMenu from './admin-nav-menu'
import AdminVariantColumnsToggle from './admin-variant-columns-toggle'
import AdminViewToggle from './admin-view-toggle'

export default function AdminToolBar() {
  const pathname = usePathname()
  const { formId, setFormConfig } = useFormConfig()
  const isFormRoute = pathname.endsWith('/new') || pathname.includes('/edit/')
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current && !isFormRoute && formId) {
      setFormConfig({
        formId: '',
        pending: false,
        showAddAnother: false,
        showUpdateOnly: false,
      })
    }
    mounted.current = true
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isFormRoute) return null

  return (
    <ToolbarSlot>
      {/* <Stack
        direction="row"
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      > */}
      <AdminNavMenu />
      {/* <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}> */}
      <AdminVariantColumnsToggle />
      {pathname !== '/admin' && <AdminViewToggle />}
      {/* </Stack> */}
      {/* </Stack> */}
    </ToolbarSlot>
  )
}
