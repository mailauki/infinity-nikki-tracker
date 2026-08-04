'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
import { usePathname } from 'next/navigation'
import AdminNavMenu from './admin-nav-menu'
import AdminVariantColumnsToggle from './admin-variant-columns-toggle'
import AdminViewToggle from './admin-view-toggle'

export default function AdminToolBar() {
  const pathname = usePathname()
  const isFormRoute = pathname.endsWith('/new') || pathname.includes('/edit/')

  // No formId cleanup here: each form releases the toolbar from its own unmount
  // via clearFormConfig(). This component isn't even mounted on form routes, so
  // it could never observe a form -> form navigation — which is exactly the case
  // that used to strand a stale formId and silently break Save.

  if (isFormRoute) return null

  return (
    <ToolbarSlot lead={<AdminNavMenu />}>
      <AdminVariantColumnsToggle />
      {pathname !== '/admin' && <AdminViewToggle />}
    </ToolbarSlot>
  )
}
