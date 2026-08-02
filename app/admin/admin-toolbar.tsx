'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
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
    <ToolbarSlot lead={<AdminNavMenu />}>
      <AdminVariantColumnsToggle />
      {pathname !== '/admin' && <AdminViewToggle />}
    </ToolbarSlot>
  )
}
